import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import User from '@/models/user';
import Role from '@/models/role';
import { getServerSession } from 'next-auth';
import { logAudit } from '@/lib/audit';
import { invalidateRoleCache } from '@/lib/role-cache';
import { GET as listRoles, POST as createRole } from '@/app/api/roles/route';
import { PATCH as updateRole, DELETE as deleteRole } from '@/app/api/roles/[slug]/route';

vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return { ...actual, getServerSession: vi.fn() };
});
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }));

const mockGetServerSession = vi.mocked(getServerSession);
const mockLogAudit = vi.mocked(logAudit);

function session(phoneNumber: string, role: string) {
  return { user: { phoneNumber, role } };
}

async function seedSystemRoles() {
  await Role.create({ slug: 'client', name: 'Клієнт', isSystem: true, groups: ['client'], pageOverrides: {} });
  await Role.create({ slug: 'admin', name: 'Адмін', isSystem: true, groups: ['client', 'articles', 'tours', 'admin'], pageOverrides: {} });
}

beforeEach(() => {
  mockGetServerSession.mockReset();
  mockLogAudit.mockClear();
  invalidateRoleCache();
});

describe('GET /api/roles', () => {
  it('returns 401 without a session and 403 for roles without the users scope', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(null as never);
    expect((await listRoles()).status).toBe(401);

    mockGetServerSession.mockResolvedValue(session('+380670000001', 'client') as never);
    expect((await listRoles()).status).toBe(403);
  });

  it('returns every role with its user count for an admin', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    await User.create({ name: 'A', password: 'x', phoneNumber: '+380671112223', role: 'client' });
    await User.create({ name: 'B', password: 'x', phoneNumber: '+380671112224', role: 'admin' });

    const res = await listRoles();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { roles: Array<{ slug: string; name: string; isSystem: boolean; userCount: number }> };
    const bySlug = Object.fromEntries(body.roles.map((r) => [r.slug, r]));
    expect(bySlug.client.userCount).toBe(1);
    expect(bySlug.admin.userCount).toBe(1);
    expect(bySlug.admin.isSystem).toBe(true);
  });
});

describe('POST /api/roles', () => {
  function post(payload: unknown) {
    return createRole(
      new NextRequest('http://localhost/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  }

  it('rejects an empty name with 400', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    expect((await post({ name: '' })).status).toBe(400);
  });

  it('creates a custom role with an auto-transliterated slug and client-only default groups', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);

    const res = await post({ name: 'Бухгалтер' });
    expect(res.status).toBe(201);
    // б=b у=u х=kh г=h а=a л=l т=t е=e р=r — note the double h in the middle
    const expectedSlug = ['b', 'u', 'kh', 'h', 'a', 'l', 't', 'e', 'r'].join('');
    const body = (await res.json()) as { ok: boolean; slug: string; name: string };
    expect(body).toEqual({ ok: true, slug: expectedSlug, name: 'Бухгалтер' });

    const stored = (await Role.findOne({ slug: expectedSlug }).lean()) as { isSystem?: boolean; groups?: string[] } | null;
    expect(stored?.isSystem).toBe(false);
    expect(stored?.groups).toEqual(['client']);
  });

  it('suffixes duplicate names with -2 instead of colliding on the slug', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);

    expect((await post({ name: 'Бухгалтер' })).status).toBe(201);
    const second = (await (await post({ name: 'Бухгалтер' })).json()) as { slug: string };
    expect(second.slug).toBe(['b', 'u', 'kh', 'h', 'a', 'l', 't', 'e', 'r'].join('') + '-2');
  });
});

describe('PATCH /api/roles/[slug]', () => {
  function patch(slug: string, payload: unknown) {
    return updateRole(
      new NextRequest(`http://localhost/api/roles/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      { params: Promise.resolve({ slug }) }
    );
  }

  it('returns 404 for an unknown role', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    expect((await patch('nope', { name: 'X' })).status).toBe(404);
  });

  it('refuses to rename a system role with 400', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    expect((await patch('client', { name: 'Новий' })).status).toBe(400);
  });

  it('locks admin permissions behind 403 while other roles stay editable', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    expect((await patch('admin', { groups: ['client'] })).status).toBe(403);

    const res = await patch('client', { groups: ['client'], pageOverrides: { 'contact-requests': true } });
    expect(res.status).toBe(200);
  });

  it('rejects unknown group slugs and page override keys with 400', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    expect((await patch('client', { groups: ['nope'] })).status).toBe(400);
    expect((await patch('client', { pageOverrides: { nope: true } })).status).toBe(400);
  });

  it('renames a custom role and persists permission changes with an audit entry', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    const created = (await Role.create({ slug: 'buhgalter', name: 'Бухгалтер', isSystem: false, groups: ['client'], pageOverrides: {} }));

    const res = await patch('buhgalter', { name: 'Фінанси', groups: ['client', 'tours'] });
    expect(res.status).toBe(200);
    expect((await res.json()) as { ok: boolean }).toMatchObject({ ok: true });

    const reloaded = (await Role.findById(created._id).lean()) as { name?: string; groups?: string[] };
    expect(reloaded.name).toBe('Фінанси');
    expect(reloaded.groups).toEqual(['client', 'tours']);

    expect(mockLogAudit).toHaveBeenCalledTimes(1);
    const call = mockLogAudit.mock.calls[0][0];
    expect(call.action).toBe('role.updated');
    expect(call.entityId).toBe('buhgalter'); // the route audits by slug, not _id
  });
});

describe('DELETE /api/roles/[slug]', () => {
  function del(slug: string) {
    return deleteRole(
      new NextRequest(`http://localhost/api/roles/${slug}`, { method: 'DELETE' }),
      { params: Promise.resolve({ slug }) }
    );
  }

  it('refuses to delete a system role with 400', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    expect((await del('client')).status).toBe(400);
  });

  it('refuses to delete a role still assigned to users with 409 and the count', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    await Role.create({ slug: 'buhgalter', name: 'Бухгалтер', isSystem: false, groups: ['client'], pageOverrides: {} });
    await User.create({ name: 'A', password: 'x', phoneNumber: '+380671112223', role: 'buhgalter' });

    const res = await del('buhgalter');
    expect(res.status).toBe(409);
    const body = (await res.json()) as { message: string };
    expect(body.message).toMatch(/1/);
  });

  it('deletes an unused custom role', async () => {
    await seedSystemRoles();
    mockGetServerSession.mockResolvedValue(session('+380670000001', 'admin') as never);
    await Role.create({ slug: 'buhgalter', name: 'Бухгалтер', isSystem: false, groups: ['client'], pageOverrides: {} });

    const res = await del('buhgalter');
    expect(res.status).toBe(200);
    expect(await Role.findOne({ slug: 'buhgalter' })).toBeNull();
  });
});
