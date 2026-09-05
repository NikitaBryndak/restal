import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import Trip from '@/models/trip';
import Notification from '@/models/notification';
import { getServerSession } from 'next-auth';
import { sendTelegramNotification } from '@/telegram/notifications';
import { PUT as manageTrip } from '@/app/api/trips/manage/[id]/route';

// Replace only the session lookup; keep every other next-auth export intact.
vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return { ...actual, getServerSession: vi.fn() };
});
// RBAC is out of scope here — the test targets the review-request contract on completion.
vi.mock('@/lib/role-access', () => ({
  getSessionRole: vi.fn().mockResolvedValue('admin'),
  hasAnyScope: vi.fn(() => true),
  getRoleSlugsGrantingPage: vi.fn().mockResolvedValue(['admin']),
}));
// Audit writes are fire-and-forget in the route — assert the call contract instead of DB state.
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }));
// No real Telegram API calls in tests — delivery is mocked at the client boundary.
vi.mock('@/telegram/notifications', () => ({ sendTelegramNotification: vi.fn() }));

const mockGetServerSession = vi.mocked(getServerSession);
const mockSendTg = vi.mocked(sendTelegramNotification);

function ddmm(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

async function makeTrip(overrides: Record<string, unknown> = {}) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return Trip.create({
    number: `R-MAN-${Math.floor(Math.random() * 1e6)}`,
    bookingDate: '01/08/2026',
    tripStartDate: ddmm(new Date(Date.now() - 5 * 864e5)),
    tripEndDate: ddmm(yesterday),
    country: 'Туреччина',
    ownerPhone: '+380675550044',
    managerPhone: '+380675550001',
    status: 'In Progress',
    tourists: [{ name: 'Олена', surname: 'Тест' }],
    ...overrides,
  });
}

function put(tripId: string, body: Record<string, unknown>) {
  return manageTrip(
    new NextRequest(`http://localhost/api/trips/manage/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
    { params: Promise.resolve({ id: tripId }) }
  );
}

beforeEach(() => {
  mockGetServerSession.mockReset();
  mockSendTg.mockReset();
  mockSendTg.mockResolvedValue(true);
  mockGetServerSession.mockResolvedValue({ user: { phoneNumber: '+380675550001', name: 'Менеджер', role: 'admin' } });
});

describe('PUT /api/trips/manage/[id] (manual completion review request)', () => {
  it('sends a linked review request when a manager completes the trip manually', async () => {
    const trip = await makeTrip({ shareToken: 'TOK-MAN-1' });

    const res = await put(trip._id.toString(), { status: 'Completed' });
    expect(res.status).toBe(200);

    const updated = (await Trip.findById(trip._id))!;
    expect(updated.status).toBe('Completed');

    const review = await Notification.findOne({ userPhone: '+380675550044', 'data.type': 'review_request' });
    expect(review).toBeTruthy();
    expect(review!.message).toContain(trip.number);
    expect(review!.message).toContain('https://restal.in.ua/shared/trip/TOK-MAN-1');

    // Telegram dispatch contract (fire-and-forget inside createNotification).
    await new Promise((r) => setImmediate(r));
    expect(mockSendTg).toHaveBeenCalledWith(
      expect.objectContaining({ userPhone: '+380675550044', logType: 'review_request' })
    );
  });

  it('sends a review request without a link when the trip has no share token', async () => {
    const trip = await makeTrip();

    const res = await put(trip._id.toString(), { status: 'Completed' });
    expect(res.status).toBe(200);

    const review = (await Notification.findOne({ userPhone: '+380675550044', 'data.type': 'review_request' }))!;
    expect(review.message).toContain(trip.number);
    expect(review.message).not.toContain('shared/trip');
  });

  it('does not send a review request for non-completion updates', async () => {
    const trip = await makeTrip({ shareToken: 'TOK-MAN-2' });

    const res = await put(trip._id.toString(), { notes: 'Оновлено менеджером' });
    expect(res.status).toBe(200);

    expect(await Notification.findOne({ userPhone: '+380675550044', 'data.type': 'review_request' })).toBeFalsy();
  });
});
