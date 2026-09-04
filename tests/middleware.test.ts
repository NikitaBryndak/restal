import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import middleware from '@/middleware';
import { findPageForPath } from '@/config/access';

const SECRET = 'test-middleware-secret';
process.env.NEXTAUTH_SECRET = SECRET;

// Builds a NextRequest carrying a valid next-auth v4 session cookie.
async function authedReq(path: string, allowedPages: string[]) {
  const req = new NextRequest(`http://localhost${path}`);
  const token = await encode({
    token: { role: 'client', phoneNumber: '+380670000000', allowedPages },
    secret: SECRET,
  });
  req.cookies.set('next-auth.session-token', token);
  return req;
}

// withAuth's type requires both args and may return undefined — normalize for tests.
async function runMiddleware(req: NextRequest): Promise<Response> {
  const res = (await middleware(req as never, undefined as never)) as Response;
  expect(res).toBeDefined();
  return res;
}

describe('middleware (withAuth wrapper)', () => {
  it('redirects unauthenticated requests to /login', async () => {
    const res = await runMiddleware(new NextRequest('http://localhost/dashboard/profile'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('lets a user through when the page slug is in allowedPages', async () => {
    const res = await runMiddleware(await authedReq('/dashboard/analytics', ['analytics']));
    expect(res.status).toBe(200);
  });

  it('lets a client through to a client page', async () => {
    const res = await runMiddleware(await authedReq('/dashboard/profile', ['profile', 'my-trips']));
    expect(res.status).toBe(200);
  });

  it('blocks a user without the manage-tour slug (redirects to first allowed client page)', async () => {
    const res = await runMiddleware(await authedReq('/dashboard/manage-tour', ['profile']));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard/profile');
  });

  it('redirects to home when the user has no allowed pages at all', async () => {
    const res = await runMiddleware(await authedReq('/dashboard/manage-tour', []));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('http://localhost/');
  });

  it('allows unmapped API paths by default for authenticated users', async () => {
    // Paths outside the catalog are not gated here — ownership is enforced downstream.
    const res = await runMiddleware(await authedReq('/api/trips/manage/abc123', ['profile']));
    expect(res.status).toBe(200);
  });

  it('allows unmapped dashboard paths for any authenticated user', async () => {
    const res = await runMiddleware(await authedReq('/dashboard/some-future-page', []));
    expect(res.status).toBe(200);
  });
});

describe('findPageForPath (unit)', () => {
  it('maps catalog paths to their page slugs', () => {
    expect(findPageForPath('/dashboard/profile')?.slug).toBe('profile');
    expect(findPageForPath('/dashboard/manage-articles')?.slug).toBe('manage-articles');
    expect(findPageForPath('/cashback')?.slug).toBe('bonuses');
  });

  it('returns null for paths outside the catalog, including the /dashboard root', () => {
    expect(findPageForPath('/unmapped-path')).toBeNull();
    expect(findPageForPath('/dashboard/some-future-page')).toBeNull();
    expect(findPageForPath('/dashboard')).toBeNull();
  });

  it('uses longest prefix match for nested paths', () => {
    // /dashboard/trips/abc123 sits under the my-trips page prefix.
    expect(findPageForPath('/dashboard/trips/abc123')?.slug).toBe('my-trips');
  });
});
