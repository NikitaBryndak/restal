import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import Trip from '@/models/trip';
import User from '@/models/user';
import Notification from '@/models/notification';
import { sendTelegramNotification } from '@/telegram/notifications';
import { POST as processCashback } from '@/app/api/cron/process-cashback/route';

vi.mock('@/lib/mongodb', () => ({ connectToDatabase: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/email', () => ({ sendCashbackCreditedEmail: vi.fn() }));
// Audit writes are fire-and-forget in the route — assert the call contract instead of DB state.
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/cron-log', () => ({ recordCronRun: vi.fn().mockResolvedValue(undefined) }));
// No real Telegram API calls in tests — delivery is mocked at the client boundary.
vi.mock('@/telegram/notifications', () => ({ sendTelegramNotification: vi.fn() }));

const mockSendTg = vi.mocked(sendTelegramNotification);

process.env.CRON_SECRET = 'test-cron-secret';

function ddmm(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

async function makeFixture(cashbackAmount = 500, endDateOffsetDays = -1) {
  const ownerPhone = '+380675550043';
  await User.create({ name: 'Клієнт', password: 'x', phoneNumber: ownerPhone });
  const user = (await User.findOne({ phoneNumber: ownerPhone }))!;

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + endDateOffsetDays);
  const trip = await Trip.create({
    number: `R-CB-${Math.floor(Math.random() * 1e6)}`,
    bookingDate: '01/08/2026',
    tripStartDate: ddmm(new Date(Date.now() - 5 * 864e5)),
    tripEndDate: ddmm(endDate),
    country: 'Греція',
    ownerPhone,
    managerPhone: '+380675550001',
    status: 'Completed',
    cashbackAmount,
    cashbackProcessed: false,
    tourists: [{ name: 'Олена', surname: 'Тест' }],
  });

  return { trip, user };
}

function post() {
  return processCashback(
    new NextRequest('http://localhost/api/cron/process-cashback', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
  );
}

beforeEach(() => {
  mockSendTg.mockReset();
  mockSendTg.mockResolvedValue(true);
});

describe('POST /api/cron/process-cashback (cashback telegram notification)', () => {
  it('rejects requests without the cron secret', async () => {
    const res = await processCashback(new NextRequest('http://localhost/api/cron/process-cashback', { method: 'POST' }));
    expect(res.status).toBe(401);
  });

  it('credits the user and notifies them via Telegram one day after trip end', async () => {
    const { trip, user } = await makeFixture(500, -1);
    const balanceBefore = user.cashbackAmount || 0;

    const res = await post();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processedCount).toBe(1);

    // Financial effect: exact credit, atomic claim.
    const updatedUser = (await User.findById(user._id))!;
    expect(updatedUser.cashbackAmount).toBe(balanceBefore + 500);
    const updatedTrip = (await Trip.findById(trip._id))!;
    expect(updatedTrip.cashbackProcessed).toBe(true);

    // In-app notification typed cashback_credited.
    const notif = await Notification.findOne({ userPhone: '+380675550043', 'data.type': 'cashback_credited' });
    expect(notif).toBeTruthy();
    expect(notif!.message).toContain(trip.number);

    // Telegram dispatch contract (fire-and-forget inside createNotification).
    await new Promise((r) => setImmediate(r));
    expect(mockSendTg).toHaveBeenCalledWith(
      expect.objectContaining({ userPhone: '+380675550043', logType: 'cashback_credited' })
    );
  });

  it('does not process a trip that ended today (one-day delay)', async () => {
    const { trip } = await makeFixture(500, 0);

    const res = await post();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processedCount).toBe(0);

    const updatedTrip = (await Trip.findById(trip._id))!;
    expect(updatedTrip.cashbackProcessed).not.toBe(true);
    expect(await Notification.findOne({ 'data.type': 'cashback_credited' })).toBeFalsy();
  });
});
