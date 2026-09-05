import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import Trip from '@/models/trip';
import Review from '@/models/review';
import { getServerSession } from 'next-auth';
import { logAudit } from '@/lib/audit';
import { POST as createReview } from '@/app/api/reviews/route';

// Replace only the session lookup; keep every other next-auth export intact.
vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return { ...actual, getServerSession: vi.fn() };
});
// Audit writes are fire-and-forget in the route — assert the call contract instead of DB state.
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }));

const mockGetServerSession = vi.mocked(getServerSession);
const mockLogAudit = vi.mocked(logAudit);

// Run-scoped trip numbers so repeated suite runs never collide with earlier fixtures.
const RUN = Date.now();
const OWNER_PHONE = '+380675552001';
const OTHER_PHONE = '+380675552002';

async function makeTrip(overrides: Record<string, unknown> = {}) {
  const number = `R-REV-${RUN}-${Math.random().toString(36).slice(2, 8)}`;
  return Trip.create({
    number,
    bookingDate: '2026-07-01',
    tripStartDate: '2026-08-01',
    tripEndDate: '2026-08-08',
    country: 'Іспанія',
    ownerPhone: OWNER_PHONE,
    managerPhone: '+380675550001',
    status: 'Completed',
    ...overrides,
  });
}

function post(phoneNumber: string | null, body: Record<string, unknown>) {
  mockGetServerSession.mockResolvedValue(
    phoneNumber ? { user: { phoneNumber, name: 'Тестовий Користувач' } } : null
  );
  return createReview(
    new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    })
  );
}

beforeEach(() => {
  mockGetServerSession.mockReset();
  mockLogAudit.mockClear();
});

describe('POST /api/reviews (post-trip reviews)', () => {
  it('rejects unauthenticated requests', async () => {
    const trip = await makeTrip();
    const res = await post(null, { tripNumber: trip.number, rating: 5 });
    expect(res.status).toBe(401);
    expect(await Review.countDocuments({})).toBeGreaterThanOrEqual(0); // no crash, no doc for this trip
    expect(await Review.findOne({ tripId: trip._id })).toBeNull();
  });

  it('rejects non-owners of the trip', async () => {
    const trip = await makeTrip();
    const res = await post(OTHER_PHONE, { tripNumber: trip.number, rating: 5 });
    expect(res.status).toBe(403);
    expect(await Review.findOne({ tripId: trip._id })).toBeNull();
  });

  it('rejects reviews for trips that have not ended', async () => {
    const trip = await makeTrip({ status: 'In Booking' });
    const res = await post(OWNER_PHONE, { tripNumber: trip.number, rating: 5 });
    expect(res.status).toBe(400);
    expect(await Review.findOne({ tripId: trip._id })).toBeNull();
  });

  it('rejects invalid ratings', async () => {
    const trip = await makeTrip();
    for (const bad of [0, 6, 2.5, 'high']) {
      const res = await post(OWNER_PHONE, { tripNumber: trip.number, rating: bad });
      expect(res.status).toBe(400);
    }
    expect(await Review.findOne({ tripId: trip._id })).toBeNull();
  });

  it('rejects comments longer than 500 characters', async () => {
    const trip = await makeTrip();
    const res = await post(OWNER_PHONE, { tripNumber: trip.number, rating: 4, text: 'а'.repeat(501) });
    expect(res.status).toBe(400);
    expect(await Review.findOne({ tripId: trip._id })).toBeNull();
  });

  it('creates a review for the owner of a completed trip and audits it', async () => {
    const trip = await makeTrip();
    const res = await post(OWNER_PHONE, { tripNumber: trip.number, rating: 5, text: 'Чудова подорож!' });

    expect(res.status).toBe(201);

    const review = (await Review.findOne({ tripId: trip._id }))!;
    expect(review.tripNumber).toBe(trip.number);
    expect(review.userPhone).toBe(OWNER_PHONE);
    expect(review.userName).toBe('Тестовий Користувач'); // snapshot from session
    expect(review.rating).toBe(5);
    expect(review.text).toBe('Чудова подорож!');

    expect(mockLogAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'review.created' }));
  });

  it('rejects a second review by the same user for the same trip', async () => {
    const trip = await makeTrip();
    const first = await post(OWNER_PHONE, { tripNumber: trip.number, rating: 4 });
    expect(first.status).toBe(201);

    const second = await post(OWNER_PHONE, { tripNumber: trip.number, rating: 5, text: 'Ще раз' });
    expect(second.status).toBe(409);
    expect(await Review.countDocuments({ tripId: trip._id })).toBe(1);
  });

  it('returns 404 for unknown trips', async () => {
    const res = await post(OWNER_PHONE, { tripNumber: `R-REV-${RUN}-NOPE`, rating: 5 });
    expect(res.status).toBe(404);
  });
});
