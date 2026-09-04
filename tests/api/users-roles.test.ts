import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import User from '@/models/user';
import { getServerSession } from 'next-auth';
import { logAudit } from '@/lib/audit';
import { GET as listUsers, PATCH as changeRole } from '@/app/api/users/roles/route';
// Replace only the session lookup; keep every other next-auth export intact.
vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return { ...actual, getServerSession: vi.fn() };
});
// Audit writes are fire-and-forget in the route — assert the call contract instead of DB state.
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }));

const mockGetServerSession = vi.mocked(getServerSession);
const mockLogAudit = vi.mocked(logAudit);

function session(phoneNumber: string, privilegeLevel: number) {
  return { user: { phoneNumber, privilegeLevel } };
}

async function seedUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    name: 'Test User',
    password: 'hashed-password',
    phoneNumber: '+380671112223',
    ...overrides,
  });
}

beforeEach(() => {
  mockGetServerSession.mockReset();
  mockLogAudit.mockClear();
});

describe('GET /api/users/roles', () => {
  it('returns 401 without a session', async () => {
    mockGetServerSession.mockResolvedValue(null as never);
    const res = await listUsers();
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin sessions', async () => {
    mockGetServerSession.mockResolvedValue(session('+380670000001', 3) as never);
    const res = await listUsers();
    expect(res.status).toBe(403);
  });

  it('returns the user list for an admin, sorted by name without PII fields', async () => {
    mockGetServerSession.mockResolvedValue(session('+380670000001', 4) as never);
    await seedUser({ name: 'Borys', phoneNumber: '+380672223334' });
    await seedUser({ name: 'Anna', phoneNumber: '+380673334445' });

    const res = await listUsers();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { users: Array<Record<string, unknown>> };
    expect(body.users.map((u) => u.name)).toEqual(['Anna', 'Borys']);
    expect(body.users[0]).toHaveProperty('phoneNumber');
    expect(body.users[0]).toHaveProperty('privilegeLevel');
    const raw = JSON.stringify(body);
    expect(raw).not.toContain('hashed-password');
  });
});

describe('PATCH /api/users/roles', () => {
  function patch(phone: string, privilegeLevel: unknown) {
    return changeRole(
      new NextRequest('http://localhost/api/users/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, privilegeLevel }),
      })
    );
  }

  it('returns 401 without a session and 403 for non-admins', async () => {
    mockGetServerSession.mockResolvedValue(null as never);
    expect((await patch('+380672223334', 2)).status).toBe(401);

    mockGetServerSession.mockResolvedValue(session('+380670000001', 2) as never);
    expect((await patch('+380672223334', 2)).status).toBe(403);
  });

  it('rejects invalid phone or privilegeLevel with 400', async () => {
    mockGetServerSession.mockResolvedValue(session('+380670000001', 4) as never);
    await seedUser({ phoneNumber: '+380672223334' });

    expect((await patch('', 2)).status).toBe(400);
    expect((await patch('+380672223334', 5)).status).toBe(400);
    expect((await patch('+380672223334', 'manager')).status).toBe(400);
  });

  it('rejects self-modification with 400 to prevent admin lockout', async () => {
    mockGetServerSession.mockResolvedValue(session('+380670000001', 4) as never);
    await seedUser({ phoneNumber: '+380670000001' });

    const res = await patch('+380670000001', 1);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toMatch(/own role/i);
  });

  it('returns 404 for an unknown phone number', async () => {
    mockGetServerSession.mockResolvedValue(session('+380670000001', 4) as never);
    const res = await patch('+380679999999', 2);
    expect(res.status).toBe(404);
  });

  it('is a no-op without an audit entry when the level is unchanged', async () => {
    mockGetServerSession.mockResolvedValue(session('+380670000001', 4) as never);
    await seedUser({ phoneNumber: '+380672223334', privilegeLevel: 3 });

    const res = await patch('+380672223334', 3);
    expect(res.status).toBe(200);
    expect(mockLogAudit).not.toHaveBeenCalled();
  });

  it('updates the role, persists it, and writes a user.role.changed audit entry', async () => {
    mockGetServerSession.mockResolvedValue(session('+380670000001', 4) as never);
    const target = await seedUser({ phoneNumber: '+380672223334', privilegeLevel: 1 });

    const res = await patch('+380672223334', 3);
    expect(res.status).toBe(200);
    expect((await res.json()) as { ok: boolean; privilegeLevel: number }).toEqual({ ok: true, privilegeLevel: 3 });

    const reloaded = (await User.findById(target._id).lean()) as { privilegeLevel?: number } | null;
    expect(reloaded?.privilegeLevel).toBe(3);

    expect(mockLogAudit).toHaveBeenCalledTimes(1);
    const call = mockLogAudit.mock.calls[0][0];
    expect(call.action).toBe('user.role.changed');
    expect(call.entityId).toBe(String(target._id));
    expect(call.userId).toBe('+380670000001');
    expect(call.details).toMatchObject({ targetPhone: '+380672223334', from: 1, to: 3 });
  });
});
