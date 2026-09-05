import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import Trip from '@/models/trip';
import Notification from '@/models/notification';
import { getServerSession } from 'next-auth';
import { logAudit } from '@/lib/audit';
import { sendTelegramNotification } from '@/telegram/notifications';
import { POST as createTrip } from '@/app/api/trips/route';

// Replace only the session lookup; keep every other next-auth export intact.
vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return { ...actual, getServerSession: vi.fn() };
});
// RBAC is out of scope here — the test targets the notification contract on creation.
vi.mock('@/lib/role-access', () => ({
  getSessionRole: vi.fn().mockResolvedValue('admin'),
  hasAnyScope: vi.fn(() => true),
}));
// Audit writes are fire-and-forget in the route — assert the call contract instead of DB state.
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }));
// No real Telegram API calls in tests — delivery is mocked at the client boundary.
vi.mock('@/telegram/notifications', () => ({ sendTelegramNotification: vi.fn() }));

const mockGetServerSession = vi.mocked(getServerSession);
const mockLogAudit = vi.mocked(logAudit);
const mockSendTg = vi.mocked(sendTelegramNotification);

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    number: 'R-TEST-1',
    country: 'Європа',
    tripStartDate: '2026-10-01',
    tripEndDate: '2026-10-08',
    ownerPhone: '+380675550009',
    payment: { totalAmount: 10000, paidAmount: 0 },
    bookingDate: '2026-09-05',
    tourists: [{ name: 'Олена', surname: 'Тест' }],
    ...overrides,
  };
}

function post(body: Record<string, unknown>) {
  return createTrip(
    new NextRequest('http://localhost/api/trips', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    })
  );
}

beforeEach(() => {
  mockGetServerSession.mockReset();
  mockLogAudit.mockClear();
  mockSendTg.mockReset();
  mockSendTg.mockResolvedValue(true);
});

describe('POST /api/trips (trip creation notification)', () => {
  it('creates the trip and notifies the owner in-app + via Telegram', async () => {
    mockGetServerSession.mockResolvedValue({ user: { phoneNumber: '+380675550001', name: 'Менеджер' } });

    const res = await post(validBody());
    expect(res.status).toBe(201);

    const trip = (await Trip.findOne({ number: 'R-TEST-1' }))!;
    expect(trip.ownerPhone).toBe('+380675550009');

    // In-app notification for the owner, typed trip_created.
    const notif = (await Notification.findOne({ userPhone: '+380675550009', type: 'trip_created' }))!;
    expect(notif.tripNumber).toBe('R-TEST-1');
    expect(notif.message).toContain('#R-TEST-1');
    expect(notif.message).toContain('Європа');

    // Telegram dispatch contract (fire-and-forget inside createNotification).
    expect(mockSendTg).toHaveBeenCalledWith({
      userPhone: '+380675550009',
      message: notif.message,
      tripNumber: 'R-TEST-1',
      logType: 'trip_created',
    });
    expect(mockLogAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'trip.created' }));
  });

  it('still returns 201 when notification creation fails (notification must not break the flow)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { phoneNumber: '+380675550001', name: 'Менеджер' } });
    const createSpy = vi.spyOn(Notification, 'create').mockRejectedValueOnce(new Error('db down'));

    const res = await post(validBody({ number: 'R-TEST-2' }));

    expect(res.status).toBe(201);
    expect(await Trip.countDocuments({ number: 'R-TEST-2' })).toBe(1);
    createSpy.mockRestore();
  });

  it('rejects unauthenticated requests without notifying anyone', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await post(validBody({ number: 'R-TEST-3' }));

    expect(res.status).toBe(401);
    expect(mockSendTg).not.toHaveBeenCalled();
    expect(await Notification.countDocuments({ tripNumber: 'R-TEST-3' })).toBe(0);
  });
});
