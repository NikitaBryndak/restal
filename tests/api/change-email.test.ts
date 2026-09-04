import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import User from '@/models/user';
import { getServerSession } from 'next-auth';
import { logAudit } from '@/lib/audit';
import { POST as changeEmail } from '@/app/api/auth/change-email/route';
// Replace only the session lookup; keep every other next-auth export intact.
vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return { ...actual, getServerSession: vi.fn() };
});
// Audit writes are fire-and-forget in the route — assert the call contract instead of DB state.
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }));

const mockGetServerSession = vi.mocked(getServerSession);
const mockLogAudit = vi.mocked(logAudit);

function session(phoneNumber: string) {
  return { user: { phoneNumber } };
}

async function seedUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    name: 'Test User',
    password: 'hashed-password',
    phoneNumber: '+380671112223',
    ...overrides,
  });
}

function post(phone: string, newEmail: unknown) {
  return changeEmail(
    new NextRequest('http://localhost/api/auth/change-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEmail === undefined ? {} : { newEmail }),
    })
  );
}

beforeEach(() => {
  mockGetServerSession.mockReset();
  mockLogAudit.mockClear();
});

describe('POST /api/auth/change-email', () => {
  // NOTE: the in-memory rate limiter (5/15min per phone) persists across tests,
  // so every test that passes the session check uses its own dedicated phone.

  it('returns 401 without a session', async () => {
    mockGetServerSession.mockResolvedValue(null as never);
    const res = await post('+380671112223', 'a@b.com');
    expect(res.status).toBe(401);
  });

  it('rejects a missing or non-string newEmail with 400 and does not clear the address', async () => {
    const phone = '+380672000001';
    mockGetServerSession.mockResolvedValue(session(phone) as never);
    await seedUser({ phoneNumber: phone, email: 'keep@me.com' });

    expect((await post(phone, undefined)).status).toBe(400);
    expect((await post(phone, 42)).status).toBe(400);

    const reloaded = await User.findOne({ phoneNumber: phone }).lean();
    expect(reloaded?.email).toBe('keep@me.com');
  });

  it('rejects malformed or oversized addresses with 400', async () => {
    const phone = '+380672000002';
    mockGetServerSession.mockResolvedValue(session(phone) as never);
    await seedUser({ phoneNumber: phone });

    expect((await post(phone, 'not-an-email')).status).toBe(400);
    expect((await post(phone, `${'a'.repeat(250)}@b.co`)).status).toBe(400);
  });

  it('returns 404 when the session user does not exist in the DB', async () => {
    mockGetServerSession.mockResolvedValue(session('+380679999999') as never);
    const res = await post('+380679999999', 'a@b.com');
    expect(res.status).toBe(404);
  });

  it('saves a valid email, persists it trimmed, and audits old/new values', async () => {
    const phone = '+380672000003';
    mockGetServerSession.mockResolvedValue(session(phone) as never);
    const user = await seedUser({ phoneNumber: phone, email: 'old@me.com' });

    const res = await post(phone, '  new@me.com ');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string; userEmail: string };
    expect(body.userEmail).toBe('new@me.com');

    const reloaded = await User.findById(user._id).lean();
    expect(reloaded?.email).toBe('new@me.com');

    expect(mockLogAudit).toHaveBeenCalledTimes(1);
    const call = mockLogAudit.mock.calls[0][0] as { action: string; details: Record<string, unknown> };
    expect(call.action).toBe('user.email_changed');
    expect(call.details).toMatchObject({ oldEmail: 'old@me.com', newEmail: 'new@me.com' });
  });

  it('clears the email when an empty (whitespace) string is sent', async () => {
    const phone = '+380672000004';
    mockGetServerSession.mockResolvedValue(session(phone) as never);
    const user = await seedUser({ phoneNumber: phone, email: 'old@me.com' });

    const res = await post(phone, '   ');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string; userEmail: string | null };
    expect(body.userEmail).toBeNull();

    const reloaded = await User.findById(user._id).lean() as { email?: string } | null;
    expect(reloaded?.email ?? null).toBeNull();
  });

  it('blocks the sixth change within the window with 429', async () => {
    const phone = '+380675551111'; // dedicated bucket — exhausts its own quota
    mockGetServerSession.mockResolvedValue(session(phone) as never);
    await seedUser({ phoneNumber: phone });

    for (let i = 0; i < 5; i++) {
      expect((await post(phone, `e${i}@b.com`)).status).toBe(200);
    }
    expect((await post(phone, 'e6@b.com')).status).toBe(429);
  });
});
