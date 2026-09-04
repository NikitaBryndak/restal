import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import User from '@/models/user';
import Role from '@/models/role';

const authorize = (credentials: Record<string, string>) =>
  // next-auth v4 CredentialsProvider nests the handler under `options`
  (authOptions.providers[0] as { options: { authorize: (c: unknown) => Promise<unknown> } }).options.authorize(credentials);
describe('authOptions shape', () => {
  it('uses the credentials provider with jwt sessions and custom pages', () => {
    expect(authOptions.providers).toHaveLength(1);
    expect(authOptions.session?.strategy).toBe('jwt');
    expect(authOptions.pages?.signIn).toBe('/login');
  });
});

describe('authorize()', () => {
  it('returns user identity for valid phone + password', async () => {
    const hash = await bcrypt.hash('correct-horse', 10);
    await User.create({ name: 'Auth Test', phoneNumber: '+380679000001', password: hash, role: 'editor' });

    const result = (await authorize({ phoneNumber: '+380679000001', password: 'correct-horse' })) as {
      id: string;
      phoneNumber: string;
      role: string;
    };
    expect(result.phoneNumber).toBe('+380679000001');
    expect(result.role).toBe('editor');
    expect(result.id).toMatch(/^[a-f\d]{24}$/i);
  });

  it('defaults the role to client when unset', async () => {
    const hash = await bcrypt.hash('pw-2', 10);
    await User.create({ name: 'Auth Test 2', phoneNumber: '+380679000002', password: hash });

    const result = (await authorize({ phoneNumber: '+380679000002', password: 'pw-2' })) as {
      role: string;
    };
    expect(result.role).toBe('client');
  });

  it('returns null for an unknown phone number', async () => {
    await expect(authorize({ phoneNumber: '+380679999999', password: 'x' })).resolves.toBeNull();
  });

  it('returns null for a wrong password', async () => {
    const hash = await bcrypt.hash('right-pw', 10);
    await User.create({ name: 'Auth Test 3', phoneNumber: '+380679000003', password: hash });

    await expect(authorize({ phoneNumber: '+380679000003', password: 'wrong-pw' })).resolves.toBeNull();
  });

  it('rejects after exceeding the per-phone login rate limit (10 attempts / 15 min)', async () => {
    const phone = '+380679000004';
    for (let i = 0; i < 10; i++) {
      await authorize({ phoneNumber: phone, password: 'nope' }); // allowed, user not found
    }
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(authorize({ phoneNumber: phone, password: 'nope' })).resolves.toBeNull();
      expect(errSpy).toHaveBeenCalledWith('Auth error:', expect.objectContaining({ message: expect.stringContaining('Забагато спроб') }));
    } finally {
      errSpy.mockRestore();
    }
  });
});

describe('jwt callback', () => {
  const jwtCb = (params: Record<string, unknown>) =>
    authOptions.callbacks!.jwt!(params as never) as unknown as Promise<Record<string, unknown>>;

  it('copies identity fields from the user object and flattens role pages on first sign-in', async () => {
    await User.create({ name: 'JWT First', phoneNumber: '+380679000010', password: 'x', role: 'editor' });
    await Role.create({ slug: 'editor', name: 'Редактор', isSystem: true, groups: ['client', 'articles'], pageOverrides: {} });

    const token = await jwtCb({
      token: {},
      user: { id: 'u1', phoneNumber: '+380679000010', role: 'editor' },
    });
    expect(token.role).toBe('editor');
    expect(token.phoneNumber).toBe('+380679000010');
    expect(token.allowedPages).toEqual(expect.arrayContaining(['profile', 'manage-articles', 'add-article']));
  });

  it('re-fetches the role slug from the DB on token refresh (demoted users lose access)', async () => {
    const hash = await bcrypt.hash('pw', 10);
    await User.create({ name: 'JWT Test', phoneNumber: '+380679000011', password: hash, role: 'admin' });

    // Simulate a refresh where the token still claims admin but DB now says editor.
    const user = await User.findOne({ phoneNumber: '+380679000011' });
    if (user) {
      user.role = 'editor';
      await user.save();
    }

    const token = await jwtCb({ token: { phoneNumber: '+380679000011', role: 'admin' }, user: undefined });
    expect(token.role).toBe('editor');
  });

  it('falls back to the client role when the DB lookup finds no user', async () => {
    const token = await jwtCb({ token: { phoneNumber: '+380679000012', role: 'admin' }, user: undefined });
    expect(token.role).toBe('client');
  });
});

describe('session callback', () => {
  it('exposes role, allowedPages and phoneNumber on session.user', async () => {
    const session = await authOptions.callbacks!.session!({
      session: { user: {} },
      token: { role: 'manager', allowedPages: ['profile'], phoneNumber: '+380679000013' },
    } as never) as { user: Record<string, unknown> };

    expect(session.user.role).toBe('manager');
    expect(session.user.allowedPages).toEqual(['profile']);
    expect(session.user.phoneNumber).toBe('+380679000013');
  });
});
