import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import PhoneVerification from '@/models/phoneVerification';
import User from '@/models/user';
import { POST as sendOtp } from '@/app/api/auth/send-otp/route';
import { POST as verifyOtp } from '@/app/api/auth/verify-otp/route';
import { POST as register } from '@/app/api/register/route';

// Each test uses a distinct x-real-ip so per-IP rate limits never interfere.
let ipCounter = 0;
function json(body: unknown, path = '/api/test') {
  const ip = `10.9.${(ipCounter++ % 250)}.${(ipCounter * 7) % 250}`;
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
    body: JSON.stringify(body),
  });
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const VALID_PHONE = '+380671234567';

async function seedVerification(phone: string, opts: { otp?: string; verified?: boolean; expired?: boolean } = {}) {
  const otp = opts.otp ?? '123456';
  return PhoneVerification.create({
    phoneNumber: phone,
    otpHash: sha256(otp),
    expiresAt: new Date(Date.now() + (opts.expired ? -60_000 : 10 * 60_000)),
    attempts: 0,
    verified: opts.verified ?? false,
  });
}

describe('POST /api/auth/send-otp', () => {
  it('rejects missing phone number with 400', async () => {
    const res = await sendOtp(json({ purpose: 'register' }));
    expect(res.status).toBe(400);
  });

  it('rejects malformed phone numbers with 400', async () => {
    for (const bad of ['123', '+0abc', '++380671234567']) {
      const res = await sendOtp(json({ phoneNumber: bad }));
      expect(res.status).toBe(400);
    }
  });

  it('stores a hashed OTP (never plaintext) and returns 200', async () => {
    const res = await sendOtp(json({ phoneNumber: VALID_PHONE, purpose: 'register' }));
    expect(res.status).toBe(200);

    const doc = await PhoneVerification.findOne({ phoneNumber: VALID_PHONE });
    expect(doc).not.toBeNull();
    expect(doc!.otpHash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex, not the 6-digit code
    expect(doc!.verified).toBe(false);
    expect(doc!.attempts).toBe(0);
    expect(doc!.expiresAt.getTime()).toBeGreaterThan(Date.now() + 9 * 60_000);
  });

  it('replaces an unverified OTP when a new code is requested', async () => {
    await sendOtp(json({ phoneNumber: VALID_PHONE }));
    const first = (await PhoneVerification.findOne({ phoneNumber: VALID_PHONE }))!;
    await sendOtp(json({ phoneNumber: VALID_PHONE }));

    const docs = await PhoneVerification.find({ phoneNumber: VALID_PHONE });
    expect(docs).toHaveLength(1); // old unverified doc deleted, not accumulated
    expect(docs[0]._id.toString()).not.toBe(first._id.toString());
  });
});

describe('POST /api/auth/verify-otp', () => {
  it('returns 400 when no OTP record exists for the phone', async () => {
    const res = await verifyOtp(json({ phoneNumber: VALID_PHONE, otp: '123456' }));
    expect(res.status).toBe(400);
  });

  it('rejects a code that is not exactly 6 digits', async () => {
    await seedVerification(VALID_PHONE);
    const res = await verifyOtp(json({ phoneNumber: VALID_PHONE, otp: '12345' }));
    expect(res.status).toBe(400);
  });

  it('increments attempts on a wrong code and reports remaining tries', async () => {
    await seedVerification(VALID_PHONE, { otp: '123456' });
    const res = await verifyOtp(json({ phoneNumber: VALID_PHONE, otp: '999999' }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('Залишилось спроб: 4');

    const doc = (await PhoneVerification.findOne({ phoneNumber: VALID_PHONE }))!;
    expect(doc.attempts).toBe(1);
    expect(doc.verified).toBe(false);
  });

  it('marks the record verified on a correct code', async () => {
    await seedVerification(VALID_PHONE, { otp: '424242' });
    const res = await verifyOtp(json({ phoneNumber: VALID_PHONE, otp: '424242' }));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ verified: true });
    const doc = (await PhoneVerification.findOne({ phoneNumber: VALID_PHONE }))!;
    expect(doc.verified).toBe(true);
  });

  it('deletes and rejects an expired OTP', async () => {
    await seedVerification(VALID_PHONE, { otp: '123456', expired: true });
    const res = await verifyOtp(json({ phoneNumber: VALID_PHONE, otp: '123456' }));

    expect(res.status).toBe(400);
    expect(await PhoneVerification.findOne({ phoneNumber: VALID_PHONE })).toBeNull();
  });

  it('locks out after OTP_MAX_ATTEMPTS failed tries', async () => {
    const doc = await seedVerification(VALID_PHONE, { otp: '123456' });
    doc.attempts = 5;
    await doc.save();

    const res = await verifyOtp(json({ phoneNumber: VALID_PHONE, otp: '123456' })); // even the right code now
    expect(res.status).toBe(400);
    expect(await PhoneVerification.findOne({ phoneNumber: VALID_PHONE })).toBeNull();
  });
});

describe('POST /api/register', () => {
  it('rejects registration without a recent verified phone number', async () => {
    const res = await register(json({ name: 'No OTP', phoneNumber: VALID_PHONE, password: 'Password123' }));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await User.findOne({ phoneNumber: VALID_PHONE })).toBeNull();
  });

  it('rejects a short password with 400', async () => {
    await seedVerification(VALID_PHONE, { verified: true });
    const res = await register(json({ name: 'Short PW', phoneNumber: VALID_PHONE, password: 'short' }));
    expect(res.status).toBe(400);
  });

  it('creates the user with welcome bonus and generated referral code on success', async () => {
    await seedVerification(VALID_PHONE, { verified: true });
    const res = await register(json({ name: 'Test User', phoneNumber: VALID_PHONE, password: 'Password123' }));

    expect(res.status).toBe(201);
    const user = (await User.findOne({ phoneNumber: VALID_PHONE }))!;
    expect(user.name).toBe('Test User');
    expect(user.cashbackAmount).toBe(1000); // WELCOME_BONUS
    expect(user.privilegeLevel).toBe(1);
    expect(user.referralCode).toMatch(/^REF-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(user.password).not.toBe('Password123'); // stored hashed
  });

  it('rejects a duplicate phone number', async () => {
    await User.create({ name: 'Existing', phoneNumber: VALID_PHONE, password: 'hashed' });
    await seedVerification(VALID_PHONE, { verified: true });
    const res = await register(json({ name: 'Duplicate', phoneNumber: VALID_PHONE, password: 'Password123' }));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await User.countDocuments({ phoneNumber: VALID_PHONE })).toBe(1);
  });

  it('consumes the verification record after successful registration', async () => {
    await seedVerification(VALID_PHONE, { verified: true });
    const res = await register(json({ name: 'Clean Up', phoneNumber: VALID_PHONE, password: 'Password123' }));
    expect(res.status).toBe(201);
    expect(await PhoneVerification.countDocuments({ phoneNumber: VALID_PHONE })).toBe(0);
  });
});
