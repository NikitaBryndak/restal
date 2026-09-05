// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import { render, nextLinkMock, nextImageMock } from '../components/test-utils';

const sessionRef = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => sessionRef.current) }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/mongodb', () => ({ connectToDatabase: vi.fn(async () => {}) }));

// Isolate the page logic (nudge decision) from card rendering.
vi.mock('next/link', () => nextLinkMock());
vi.mock('next/image', () => nextImageMock());
vi.mock('@/components/trip/trip-card', () => ({
  default: (props: { data: Record<string, unknown> }) =>
    React.createElement('div', { 'data-testid': 'trip-card' }, String(props.data.number)),
}));

const tripsFind = vi.hoisted(() => vi.fn());
vi.mock('@/models/trip', () => ({ default: { find: (...a: unknown[]) => tripsFind(...a) } }));
const reviewsFind = vi.hoisted(() => vi.fn());
vi.mock('@/models/review', () => ({ default: { find: (...a: unknown[]) => reviewsFind(...a) } }));

import TripsPage from '@/app/dashboard/trips/page';

const NUDGE_TEXT = '⭐ Залишити відгук';

function mockTrips(trips: Record<string, unknown>[]) {
  const chain = { sort: () => chain, lean: async () => trips };
  tripsFind.mockReturnValue(chain);
}
function mockReviews(reviewedTripIds: string[]) {
  const rows = reviewedTripIds.map((id) => ({ tripId: id }));
  const chain = { select: () => chain, lean: async () => rows };
  reviewsFind.mockReturnValue(chain);
}

const baseTrip = (over: Record<string, unknown>) => ({
  _id: 'trip-id-1',
  number: 'T-001',
  status: 'Completed',
  ownerPhone: '+380675550004',
  managerPhone: '+380675550001',
  shareToken: 'SHARETOKEN0000000001',
  tripStartDate: '10/08/2026',
  tripEndDate: '17/08/2026',
  ...over,
});

beforeEach(() => {
  sessionRef.current = { user: { phoneNumber: '+380675550004' } };
  mockTrips([]);
  mockReviews([]);
});

describe('/dashboard/trips review nudge', () => {
  it('shows a nudge link to the shared page for owned completed trips without a review', async () => {
    mockTrips([baseTrip({})]);
    render(await TripsPage());

    const link = screen.getByRole('link', { name: NUDGE_TEXT });
    expect(link).toHaveAttribute('href', '/shared/trip/SHARETOKEN0000000001');
  });

  it('hides the nudge once a review exists for the trip', async () => {
    mockTrips([baseTrip({})]);
    mockReviews(['trip-id-1']);
    render(await TripsPage());

    expect(screen.queryByRole('link', { name: NUDGE_TEXT })).toBeNull();
  });

  it('does not nudge for trips that are still in progress or have no share token', async () => {
    mockTrips([
      baseTrip({ status: 'In Booking' }),
      baseTrip({ _id: 'trip-id-2', number: 'T-002', shareToken: null }),
    ]);
    render(await TripsPage());

    expect(screen.queryByRole('link', { name: NUDGE_TEXT })).toBeNull();
  });

  it('does not nudge for trips the user manages but does not own', async () => {
    mockTrips([baseTrip({ ownerPhone: '+380675559999' })]); // managerPhone stays +380675550004
    render(await TripsPage());

    expect(screen.queryByRole('link', { name: NUDGE_TEXT })).toBeNull();
  });
});
