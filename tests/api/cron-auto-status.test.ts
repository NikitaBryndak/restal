import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import Trip from '@/models/trip';
import Notification from '@/models/notification';
import { sendTelegramNotification } from '@/telegram/notifications';
import { POST as runAutoStatus } from '@/app/api/cron/auto-status/route';

vi.mock('@/lib/mongodb', () => ({ connectToDatabase: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/email', () => ({ sendTripStatusEmail: vi.fn(), sendTripReminderEmail: vi.fn() }));
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

async function makeTrip(overrides: Record<string, unknown> = {}) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return Trip.create({
    number: `R-CRON-${Math.floor(Math.random() * 1e6)}`,
    bookingDate: '01/08/2026',
    tripStartDate: ddmm(new Date(Date.now() - 5 * 864e5)),
    tripEndDate: ddmm(yesterday),
    country: 'Італія',
    ownerPhone: '+380675550042',
    managerPhone: '+380675550001',
    status: 'In Progress',
    tourists: [{ name: 'Олена', surname: 'Тест' }],
    ...overrides,
  });
}

function post() {
  return runAutoStatus(
    new NextRequest('http://localhost/api/cron/auto-status', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
  );
}

beforeEach(() => {
  mockSendTg.mockReset();
  mockSendTg.mockResolvedValue(true);
});

describe('POST /api/cron/auto-status (post-trip review request)', () => {
  it('rejects requests without the cron secret', async () => {
    const res = await runAutoStatus(new NextRequest('http://localhost/api/cron/auto-status', { method: 'POST' }));
    expect(res.status).toBe(401);
  });

  it('completes an ended trip and sends a linked review request to the owner', async () => {
    const trip = await makeTrip({ shareToken: 'TOK-CRON-1' });

    const res = await post();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.inProgressToCompleted).toBe(1);

    // Status transition persisted.
    const updated = (await Trip.findById(trip._id))!;
    expect(updated.status).toBe('Completed');

    // Review request notification with the shared-page link.
    const review = await Notification.findOne({ userPhone: '+380675550042', 'data.type': 'review_request' });
    expect(review).toBeTruthy();
    expect(review!.message).toContain(trip.number);
    expect(review!.message).toContain('https://restal.in.ua/shared/trip/TOK-CRON-1');

    // The generic completion notification is still sent too.
    const statusNotif = await Notification.findOne({ userPhone: '+380675550042', 'data.newStatus': 'Completed' });
    expect(statusNotif).toBeTruthy();

    // Telegram dispatch contract (fire-and-forget inside createNotification).
    await new Promise((r) => setImmediate(r));
    expect(mockSendTg).toHaveBeenCalledWith(
      expect.objectContaining({ userPhone: '+380675550042', logType: 'review_request' })
    );
  });

  it('does not complete a trip that has not ended yet', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await makeTrip({ tripEndDate: ddmm(tomorrow) });

    const res = await post();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.inProgressToCompleted).toBe(0);

    expect(await Notification.findOne({ 'data.type': 'review_request' })).toBeFalsy();
  });
});
