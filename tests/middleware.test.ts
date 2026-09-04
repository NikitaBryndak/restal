import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import middleware from '@/middleware';
import { canAccessPath, RoleLevel } from '@/config/access';

const SECRET = 'test-middleware-secret';
process.env.NEXTAUTH_SECRET = SECRET;

// Builds a NextRequest carrying a valid next-auth v4 session cookie.
async function authedReq(path: string, privilegeLevel: number) {
  const req = new NextRequest(`http://localhost${path}`);
  const token = await encode({ token: { privilegeLevel }, secret: SECRET });
  req.cookies.set('next-auth.session-token', token);
  return req;
}

describe('middleware (withAuth wrapper)', () => {
  it('redirects unauthenticated requests to /login', async () => {
    const res = await middleware(new NextRequest('http://localhost/dashboard/profile'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('lets an admin through to an admin-only page', async () => {
    const res = await middleware(await authedReq('/dashboard/analytics', RoleLevel.ADMIN));
    expect(res.status).toBe(200);
  });

  it('lets a client through to a client-level page', async () => {
    const res = await middleware(await authedReq('/dashboard/profile', RoleLevel.CLIENT));
    expect(res.status).toBe(200);
  });

  it('blocks a client from a manager-only page (redirects to /dashboard/profile)', async () => {
    const res = await middleware(await authedReq('/dashboard/manage-tour', RoleLevel.CLIENT));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard/profile');
  });

  it('lets an editor through to editor-only pages but not manager pages', async () => {
    const allowed = await middleware(await authedReq('/dashboard/manage-articles', RoleLevel.EDITOR));
    expect(allowed.status).toBe(200);

    const blocked = await middleware(await authedReq('/dashboard/promo-codes', RoleLevel.EDITOR));
    expect(blocked.status).toBe(307);
  });

  it('lets a manager through to manager-only pages but not admin pages', async () => {
    const allowed = await middleware(await authedReq('/dashboard/contact-requests', RoleLevel.MANAGER));
    expect(allowed.status).toBe(200);

    const blocked = await middleware(await authedReq('/dashboard/audit-log', RoleLevel.MANAGER));
    expect(blocked.status).toBe(307);
  });

  it('allows unmapped API paths by default for authenticated users', async () => {
    // canAccessPath returns true for paths without an explicit rule.
    const res = await middleware(await authedReq('/api/trips/manage/abc123', RoleLevel.EDITOR));
    expect(res.status).toBe(200);
  });

  it('allows unmapped dashboard paths for any authenticated user', async () => {
    const res = await middleware(await authedReq('/dashboard/some-future-page', RoleLevel.CLIENT));
    expect(res.status).toBe(200);
  });
});

describe('canAccessPath (unit)', () => {
  it('admin passes every mapped page', () => {
    for (const path of ['/dashboard/profile', '/dashboard/manage-articles', '/dashboard/add-tour', '/dashboard/analytics']) {
      expect(canAccessPath(path, RoleLevel.ADMIN)).toBe(true);
    }
  });

  it('editor is locked out of manager and admin pages', () => {
    expect(canAccessPath('/dashboard/promo-codes', RoleLevel.EDITOR)).toBe(false);
    expect(canAccessPath('/dashboard/analytics', RoleLevel.EDITOR)).toBe(false);
  });

  it('level 0 (no token) is denied even client pages, but unmapped paths default-allow', () => {
    expect(canAccessPath('/dashboard/profile', 0)).toBe(false);
    expect(canAccessPath('/unmapped-path', 0)).toBe(true);
  });

  it('exact /dashboard root requires at least client level', () => {
    expect(canAccessPath('/dashboard', RoleLevel.CLIENT)).toBe(true);
    expect(canAccessPath('/dashboard', 0)).toBe(false);
  });
});
