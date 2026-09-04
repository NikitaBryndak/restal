import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import User from '@/models/user';
import Role from '@/models/role';
import { getServerSession } from 'next-auth';
import { logAudit } from '@/lib/audit';
import { invalidateRoleCache } from '@/lib/role-cache';
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

function session(phoneNumber: string, role: string) {
  return { user: { phoneNumber, role } };
}

async function seedRoles() {
  await Role.create({ slug: 'client', name: 'Клієнт', isSystem: true, groups: ['client'], pageOverrides: {} });
  await Role.create({ slug: 'manager', name: 'Менеджер', isSystem: true, groups: ['client', 'tours'], pageOverrides: {} });
  await Role.create({ slug: 'admin', name: 'Адмін', isSystem: true, groups: ['client', 'articles', 'tours', 'admin'], pageOverrides: {} });
}

async function seedUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    name: 'Test User',
    password: 'hashed-password',
    phoneNumber: '+380671112223',
    role: 'client',
    ...overrides,
  });
}

beforeEach(() => {
  mockGetServerSession.mockReset();
  mockLogAudit.mockClear();
  invalidateRoleCache();
});

describe('GET /api/users/roles', () => {
  function get(query = '') {
    return listUsers(new NextRequest(`http://localhost/api/users/roles${query ? `?${query}` : ''}`));
  }

  it('returns 401 without a session', async () => {
    mockGetServerSession.mockResolvedValue(null as never);
    const res = await get();
    expect(res.status).toBe(401);
  });

  it('returns 403 for roles without the users page scope', async () => {
    await seedRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'client') as never);
    const res = await get();
    expect(res.status).toBe(403);
  });

  it('returns users with role slug and display name for an admin, without PII fields', async () => {
    await seedRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    await seedUser({ name: 'Borys', phoneNumber: '+380672223334', role: 'manager' });
    await seedUser({ name: 'Anna', phoneNumber: '+380673334445', role: 'client' });

    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { users: Array<Record<string, unknown>>; total: number; page: number; pageSize: number };
    expect(body.users.map((u) => u.name)).toEqual(['Anna', 'Borys']);
    expect({ total: body.total, page: body.page, pageSize: body.pageSize }).toEqual({ total: 2, page: 1, pageSize: 50 });
    const borys = body.users.find((u) => u.name === 'Borys')!;
    expect(borys.role).toBe('manager');
    expect(borys.roleName).toBe('Менеджер'); // manager is seeded by seedRoles()
    expect(body.users[0]).toHaveProperty('phoneNumber');
    const raw = JSON.stringify(body);
    expect(raw).not.toContain('hashed-password');
  });

  it('attaches the role display name when the role exists', async () => {
    await seedRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    await seedUser({ name: 'Borys', phoneNumber: '+380672223334', role: 'manager' });

    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { users: Array<{ name: string; role: string; roleName: string }> };
    expect(body.users[0].roleName).toBe('Менеджер');
  });

  it('searches the entire user base, not just the current page', async () => {
    await seedRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    await Promise.all(
      Array.from({ length: 53 }, (_, i) =>
        seedUser({ name: `User ${String(i).padStart(2, '0')}`, phoneNumber: `+38067${String(100000 + i)}` })
      )
    );

    // "User 51" sorts onto page 2 — invisible on the default first page.
    const res = await get('search=User%2051');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { users: Array<{ name: string }>; total: number };
    expect(body.total).toBe(1);
    expect(body.users.map((u) => u.name)).toEqual(['User 51']);
  });

  it('escapes regex metacharacters in the search term', async () => {
    await seedRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    await seedUser({ name: 'Anna', phoneNumber: '+380672223334' });

    // "+" is a regex metacharacter; an unescaped query would throw or mis-match.
    const res = await get('search=%2B380');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { users: Array<{ name: string }>; total: number };
    expect(body.total).toBe(1);
    expect(body.users[0].name).toBe('Anna');
  });
});

describe('PATCH /api/users/roles', () => {
  function patch(phone: string, role: unknown) {
    return changeRole(
      new NextRequest('http://localhost/api/users/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role }),
      })
    );
  }

  it('returns 401 without a session and 403 for roles without the users scope', async () => {
    await seedRoles();
    mockGetServerSession.mockResolvedValue(null as never);
    expect((await patch('+380672223334', 'manager')).status).toBe(401);

    mockGetServerSession.mockResolvedValue(session('+380670000001', 'client') as never);
    expect((await patch('+380672223334', 'manager')).status).toBe(403);
  });

  it('rejects invalid phone or unknown role slug with 400', async () => {
    await seedRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    await seedUser({ phoneNumber: '+380672223334' });

    expect((await patch('', 'manager')).status).toBe(400);
    expect((await patch('+380672223334', '')).status).toBe(400);
    expect((await patch('+380672223334', 'no-such-role')).status).toBe(400);
  });

  it('rejects self-modification with 400 to prevent admin lockout', async () => {
    await seedRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    await seedUser({ phoneNumber: '+380670000001' });

    const res = await patch('+380670000001', 'client');
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toMatch(/own role/i);
  });

  it('returns 404 for an unknown phone number', async () => {
    await seedRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    const res = await patch('+380679999999', 'manager');
    expect(res.status).toBe(404);
  });

  it('is a no-op without an audit entry when the role is unchanged', async () => {
    await seedRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    await seedUser({ phoneNumber: '+380672223334', role: 'manager' });

    const res = await patch('+380672223334', 'manager');
    expect(res.status).toBe(200);
    expect(mockLogAudit).not.toHaveBeenCalled();
  });

  it('updates the role, persists it, and writes a user.role.changed audit entry with slugs', async () => {
    await seedRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    const target = await seedUser({ phoneNumber: '+380672223334', role: 'client' });

    const res = await patch('+380672223334', 'manager');
    expect(res.status).toBe(200);
    expect((await res.json()) as { ok: boolean; role: string; roleName: string }).toEqual({ ok: true, role: 'manager', roleName: 'Менеджер' });

    const reloaded = (await User.findById(target._id).lean()) as { role?: string } | null;
    expect(reloaded?.role).toBe('manager');

    expect(mockLogAudit).toHaveBeenCalledTimes(1);
    const call = mockLogAudit.mock.calls[0][0];
    expect(call.action).toBe('user.role.changed');
    expect(call.entityId).toBe(String(target._id));
    expect(call.userId).toBe('+380670000001');
    expect(call.details).toMatchObject({ targetPhone: '+380672223334', from: 'client', to: 'manager' });
  });
});
