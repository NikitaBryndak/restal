import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import User from '@/models/user';
import Trip from '@/models/trip';
import Role from '@/models/role';
import { getServerSession } from 'next-auth';
import { invalidateRoleCache } from '@/lib/role-cache';
import { GET as analyticsReferrals } from '@/app/api/analytics/referrals/route';

// Replace only the session lookup; keep every other next-auth export intact.
vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return { ...actual, getServerSession: vi.fn() };
});

const mockGetServerSession = vi.mocked(getServerSession);

function session(phoneNumber: string, role: string) {
  return { user: { phoneNumber, role } };
}

beforeEach(async () => {
  mockGetServerSession.mockReset();
  invalidateRoleCache();
  await Role.create({ slug: 'client', name: 'Клієнт', isSystem: true, groups: ['client'], pageOverrides: {} });
  await Role.create({ slug: 'admin', name: 'Адмін', isSystem: true, groups: ['client', 'articles', 'tours', 'admin'], pageOverrides: {} });
});

function get(url = '/api/analytics/referrals') {
  return analyticsReferrals(new NextRequest(`http://localhost${url}`));
}

describe('GET /api/analytics/referrals', () => {
  it('returns 401 without a session', async () => {
    mockGetServerSession.mockResolvedValue(null as never);
    expect((await get()).status).toBe(401);
  });

  it('returns 403 for roles without the analytics scope', async () => {
    mockGetServerSession.mockResolvedValue(session('+380673000201', 'client') as never);
    expect((await get()).status).toBe(403);
  });

  it('returns an empty overview when no referees exist', async () => {
    mockGetServerSession.mockResolvedValue(session('+380673000202', 'admin') as never);
    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      overview: { referrers: number; referredUsers: number };
      topReferrers: unknown[];
    };
    expect(body.overview.referrers).toBe(0);
    expect(body.overview.referredUsers).toBe(0);
    expect(body.topReferrers).toEqual([]);
  });

  it('attributes referee trips and revenue to their referrer', async () => {
    mockGetServerSession.mockResolvedValue(session('+380673000203', 'admin') as never);

    // Referrer with one successful referral (counters set by the process-cashback cron).
    const referrer = await User.create({
      name: 'Ref Referrer',
      phoneNumber: '+380679400101',
      password: 'x',
      referralCount: 1,
      referralBonusEarned: 2000,
    });

    // Two referees registered via the referrer's code.
    await User.create({ name: 'Referee A', phoneNumber: '+380679400102', password: 'x', referredBy: referrer._id });
    await User.create({ name: 'Referee B', phoneNumber: '+380679400103', password: 'x', referredBy: referrer._id });

    // One trip owned by referee A; referee B has none yet.
    await Trip.create({
      number: 'R-REFTEST-A1',
      bookingDate: '01/09/2026',
      tripStartDate: '10/09/2026',
      tripEndDate: '20/09/2026',
      country: 'Туреччина',
      managerPhone: '+380679400999',
      ownerPhone: '+380679400102',
      payment: { totalAmount: 10000, paidAmount: 5000 },
    });

    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      overview: {
        referrers: number;
        referredUsers: number;
        bonusEarned: number;
        refereeTrips: number;
        refereeRevenue: number;
        refereePaid: number;
      };
      topReferrers: Array<{
        phone: string;
        registeredCount: number;
        referredCount: number;
        bonusEarned: number;
        refereeTrips: number;
        refereeRevenue: number;
      }>;
    };

    expect(body.overview.referrers).toBe(1);
    expect(body.overview.referredUsers).toBe(2);
    expect(body.overview.bonusEarned).toBe(2000);
    expect(body.overview.refereeTrips).toBe(1);
    expect(body.overview.refereeRevenue).toBe(10000);
    expect(body.overview.refereePaid).toBe(5000);

    const row = body.topReferrers[0];
    expect(row.phone).toBe('+380679400101');
    expect(row.registeredCount).toBe(2); // both registered referees
    expect(row.referredCount).toBe(1); // only one completed a first trip (cron counter)
    expect(row.bonusEarned).toBe(2000);
    expect(row.refereeTrips).toBe(1);
    expect(row.refereeRevenue).toBe(10000);
  });

  it('keeps separate referrers as separate rows', async () => {
    mockGetServerSession.mockResolvedValue(session('+380673000204', 'admin') as never);

    const r1 = await User.create({ name: 'Ref One', phoneNumber: '+380679400201', password: 'x' });
    const r2 = await User.create({ name: 'Ref Two', phoneNumber: '+380679400202', password: 'x' });
    await User.create({ name: 'Referee C', phoneNumber: '+380679400203', password: 'x', referredBy: r1._id });
    await User.create({ name: 'Referee D', phoneNumber: '+380679400204', password: 'x', referredBy: r2._id });

    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      overview: { referrers: number; referredUsers: number };
      topReferrers: Array<{ phone: string; registeredCount: number }>;
    };

    expect(body.overview.referrers).toBe(2);
    expect(body.overview.referredUsers).toBe(2);
    for (const row of body.topReferrers) {
      expect(row.registeredCount).toBe(1);
    }
  });
});
