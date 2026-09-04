import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import ContactRequest from '@/models/contactRequest';
import User from '@/models/user';
import Role from '@/models/role';
import { getServerSession } from 'next-auth';
import { invalidateRoleCache } from '@/lib/role-cache';
import { GET as analyticsRequests } from '@/app/api/analytics/requests/route';

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

function get(url = '/api/analytics/requests') {
  return analyticsRequests(new NextRequest(`http://localhost${url}`));
}

describe('GET /api/analytics/requests', () => {
  it('returns 401 without a session', async () => {
    mockGetServerSession.mockResolvedValue(null as never);
    expect((await get()).status).toBe(401);
  });

  it('returns 403 for roles without the analytics scope', async () => {
    mockGetServerSession.mockResolvedValue(session('+380673000001', 'client') as never);
    expect((await get()).status).toBe(403);
  });

  it('aggregates contact requests and UTM-attributed registrations for an admin', async () => {
    mockGetServerSession.mockResolvedValue(session('+380673000002', 'admin') as never);

    // Two fresh "contact" requests (one responded after 30 min), one "manager" request.
    const createdAt = new Date();
    await ContactRequest.create({ source: 'contact', phone: '+380671000010' });
    await ContactRequest.create({
      source: 'contact',
      phone: '+380671000011',
      status: 'completed',
      respondedAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'fall-2026',
    });
    await ContactRequest.create({ source: 'manager', phone: '+380671000012' });

    // The registrationsByUtm path (User.aggregate) — broken by a missing User import.
    await User.create({ name: 'UTM Reg', phoneNumber: '+380679300001', password: 'x', utmSource: 'google', utmMedium: 'cpc' });

    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      period: string;
      total: number;
      comparison: number | null;
      bySource: Array<{ _id: string; count: number }>;
      sourceStatus: Array<{ source: string; new: number; completed: number; total: number }>;
      responseTimeBySource: Array<{ source: string; avgMinutes: number; count: number }>;
      utmBreakdown: Array<{ source: string; medium: string; campaign: string; count: number }>;
      registrationsByUtm: Array<{ source: string; medium: string; campaign: string; count: number }>;
    };

    expect(body.period).toBe('all');
    expect(body.total).toBe(3);
    // "all" has no previous window → comparison is null
    expect(body.comparison).toBeNull();

    const bySource = Object.fromEntries(body.bySource.map((s) => [s._id, s.count]));
    expect(bySource.contact).toBe(2);
    expect(bySource.manager).toBe(1);

    const contactRow = body.sourceStatus.find((r) => r.source === 'contact');
    expect(contactRow?.new).toBe(1);
    expect(contactRow?.completed).toBe(1);
    expect(contactRow?.total).toBe(2);

    const responseRow = body.responseTimeBySource.find((r) => r.source === 'contact');
    expect(responseRow?.count).toBe(1);
    expect(responseRow?.avgMinutes).toBe(30);

    // UTM attribution from contact requests…
    expect(body.utmBreakdown).toEqual([
      { source: 'google', medium: 'cpc', campaign: 'fall-2026', count: 1 },
    ]);
    // …and from user registrations (the previously broken aggregation).
    expect(body.registrationsByUtm).toEqual([
      { source: 'google', medium: 'cpc', campaign: '', count: 1 },
    ]);
  });

  it('filters by the requested period and compares against the previous window', async () => {
    mockGetServerSession.mockResolvedValue(session('+380673000003', 'admin') as never);

    const now = Date.now();
    await ContactRequest.create({ source: 'contact', phone: '+380671000020', createdAt: new Date(now - 2 * 24 * 3600 * 1000) });
    // Falls into the previous 7d window (now-14d .. now-7d).
    await ContactRequest.create({ source: 'tour', phone: '+380671000021', createdAt: new Date(now - 9 * 24 * 3600 * 1000) });

    const res = await get('/api/analytics/requests?period=7d');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { period: string; total: number; comparison: number };
    expect(body.period).toBe('7d');
    expect(body.total).toBe(1); // only the 2-day-old request is inside the window
    expect(body.comparison).toBe(0); // current=1, previous=1 → ((1-1)/1)*100
  });

  it('falls back to "all" for an unknown period value', async () => {
    mockGetServerSession.mockResolvedValue(session('+380673000004', 'admin') as never);
    const res = await get('/api/analytics/requests?period=bogus');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { period: string };
    expect(body.period).toBe('all');
  });
});
