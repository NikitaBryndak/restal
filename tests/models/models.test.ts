import { describe, it, expect, vi, afterEach } from 'vitest';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '@/models/user';
import Trip from '@/models/trip';
import Article from '@/models/article';
import ContactRequest from '@/models/contactRequest';
import PhoneVerification from '@/models/phoneVerification';
import PromoCode, { PROMO_CODE_STATUSES } from '@/models/promoCode';
import Counter from '@/models/counter';
import AiRateLimit from '@/models/aiRateLimit';
import { WELCOME_BONUS } from '@/config/constants';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('User model', () => {
  it('auto-generates a REF-XXXX-XXXX referral code on save when unset', async () => {
    const user = await User.create({ name: 'Ref Test', phoneNumber: '+380679100001', password: 'x' });
    expect(user.referralCode).toMatch(/^REF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });

  it('keeps an explicitly provided referral code', async () => {
    const user = await User.create({
      name: 'Ref Test 2',
      phoneNumber: '+380679100002',
      password: 'x',
      referralCode: 'REF-ZZZZ-YYYY',
    });
    expect(user.referralCode).toBe('REF-ZZZZ-YYYY');
  });

  it('regenerates the code on collision (up to MAX_CODE_GEN_RETRIES)', async () => {
    // Seed a user holding the code that the first generated attempt will produce.
    await User.create({ name: 'Ref Holder', phoneNumber: '+380679100003', password: 'x', referralCode: 'REF-AAAA-AAAA' });

    const randomBytesSpy = vi.spyOn(crypto, 'randomBytes');
    // Attempt 1 → REF-AAAA-AAAA (collision); attempt 2 → REF-BCDE-FGHJ.
    randomBytesSpy
      .mockReturnValueOnce(Buffer.from([0, 0, 0, 0]))
      .mockReturnValueOnce(Buffer.from([0, 0, 0, 0]))
      .mockReturnValueOnce(Buffer.from([1, 2, 3, 4]))
      .mockReturnValueOnce(Buffer.from([5, 6, 7, 8]));

    const user = await User.create({ name: 'Ref Test 3', phoneNumber: '+380679100004', password: 'x' });
    expect(user.referralCode).toBe('REF-BCDE-FGHJ');
    expect(randomBytesSpy).toHaveBeenCalledTimes(4);
  });

  it('applies default privilegeLevel 1 and the welcome cashback bonus', async () => {
    const user = await User.create({ name: 'Defaults Test', phoneNumber: '+380679100005', password: 'x' });
    expect(user.privilegeLevel).toBe(1);
    expect(user.cashbackAmount).toBe(WELCOME_BONUS);
  });
});

describe('Trip model', () => {
  it('applies status default "In Booking" and timestamps on create', async () => {
    const trip = await Trip.create({
      number: 'R-TEST-1',
      bookingDate: '01/09/2026',
      tripStartDate: '10/09/2026',
      tripEndDate: '20/09/2026',
      country: 'Італія',
      ownerPhone: '+380679100100',
      managerPhone: '+380679100101',
    });
    expect(trip.status).toBe('In Booking');
    expect(trip.createdAt).toBeInstanceOf(Date);
  });

  it('rejects invalid status values via enum validation', async () => {
    await expect(
      Trip.create({
        number: 'R-TEST-2',
        bookingDate: '01/09/2026',
        tripStartDate: '10/09/2026',
        tripEndDate: '20/09/2026',
        country: 'Італія',
        ownerPhone: '+380679100100',
        managerPhone: '+380679100101',
        status: 'Not A Status',
      })
    ).rejects.toThrow();
  });
});

describe('Article model', () => {
  it('creates with all required fields and timestamps', async () => {
    const article = await Article.create({
      articleID: 9001,
      tag: 'news',
      images: 'article-image.jpg',
      title: 'Тестова стаття',
      description: 'Опис',
      content: 'Зміст',
      creatorPhone: '+380679100102',
    });
    expect(article.title).toBe('Тестова стаття');
    expect(article.createdAt).toBeInstanceOf(Date);
  });

  it('rejects missing required fields', async () => {
    await expect(Article.create({} as never)).rejects.toThrow();
  });
});

describe('ContactRequest model', () => {
  it('defaults status to "new"', async () => {
    const req = await ContactRequest.create({ source: 'contact', phone: '+380679100010' });
    expect(req.status).toBe('new');
  });

  it('stores optional manager consultation fields with defaults', async () => {
    const req = await ContactRequest.create({
      source: 'manager',
      phone: '+380679100011',
      managerName: 'Олена',
      ip: '2.3.4.5',
    });
    expect(req.managerName).toBe('Олена');
    expect(req.adminNote).toBe('');
    expect(req.respondedAt).toBeNull();
  });
});

describe('PhoneVerification model', () => {
  it('sets expiresAt ~10 minutes in the future and defaults verified=false, attempts=0', async () => {
    const before = Date.now();
    const doc = await PhoneVerification.create({ phoneNumber: '+380679100020', otpHash: 'hashed-otp' });
    expect(doc.verified).toBe(false);
    expect(doc.attempts).toBe(0);
    expect(doc.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 9 * 60_000);
    expect(doc.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 11 * 60_000);
  });
});

describe('PromoCode model', () => {
  it('uppercases the code and defaults status to active with null usage fields', async () => {
    const userId = new mongoose.Types.ObjectId();
    const code = await PromoCode.create({
      code: 'save50',
      amount: 100,
      userId,
      ownerPhone: '+380679100030',
      ownerName: 'Тест',
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    expect(code.code).toBe('SAVE50');
    expect(code.status).toBe('active');
    expect(PROMO_CODE_STATUSES).toEqual(['active', 'used', 'expired']);
    expect(code.usedAt).toBeNull();
    expect(code.tripId).toBeNull();
  });

  it('enforces the minimum promo amount (100 UAH)', async () => {
    const userId = new mongoose.Types.ObjectId();
    await expect(
      PromoCode.create({
        code: 'TOO_SMALL',
        amount: 50,
        userId,
        ownerPhone: '+380679100031',
        ownerName: 'Тест',
        expiresAt: new Date(Date.now() + 86_400_000),
      })
    ).rejects.toThrow();
  });
});

describe('Counter model', () => {
  it('defaults value to 0 and upserts by name', async () => {
    const counter = await Counter.findOneAndUpdate({ name: 'test-counter' }, { $inc: { value: 1 } }, { upsert: true, new: true });
    expect(counter?.value).toBe(1);
    const again = await Counter.findOneAndUpdate({ name: 'test-counter' }, { $inc: { value: 1 } }, { upsert: true, new: true });
    expect(again?.value).toBe(2);
  });
});

describe('AiRateLimit model', () => {
  it('creates with count 0 and a lastReset timestamp', async () => {
    const doc = await AiRateLimit.create({ identifier: 'test-identifier' });
    expect(doc.count).toBe(0);
    expect(doc.lastReset).toBeInstanceOf(Date);
  });
});
