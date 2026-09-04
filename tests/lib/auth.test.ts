import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import User from '@/models/user';

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
    await User.create({ name: 'Auth Test', phoneNumber: '+380679000001', password: hash, privilegeLevel: 2 });

    const result = (await authorize({ phoneNumber: '+380679000001', password: 'correct-horse' })) as {
      id: string;
      phoneNumber: string;
      privilegeLevel: number;
    };
    expect(result.phoneNumber).toBe('+380679000001');
    expect(result.privilegeLevel).toBe(2);
    expect(result.id).toMatch(/^[a-f\d]{24}$/i);
  });

  it('defaults privilegeLevel to 1 when unset', async () => {
    const hash = await bcrypt.hash('pw-2', 10);
    await User.create({ name: 'Auth Test 2', phoneNumber: '+380679000002', password: hash });

    const result = (await authorize({ phoneNumber: '+380679000002', password: 'pw-2' })) as {
      privilegeLevel: number;
    };
    expect(result.privilegeLevel).toBe(1);
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

  it('copies identity fields from the user object on first sign-in', async () => {
    // Phone not in DB → re-fetch finds nothing and keeps the user-provided values.
    const token = await jwtCb({
      token: {},
      user: { id: 'u1', phoneNumber: '+380679000010', privilegeLevel: 3 },
    });
    expect(token.privilegeLevel).toBe(3);
    expect(token.phoneNumber).toBe('+380679000010');
  });

  it('re-fetches privilegeLevel from the DB on token refresh (demoted users lose access)', async () => {
    const hash = await bcrypt.hash('pw', 10);
    await User.create({ name: 'JWT Test', phoneNumber: '+380679000011', password: hash, privilegeLevel: 4 });

    // Simulate a refresh where the token still claims level 4 but DB now says 2.
    const user = await User.findOne({ phoneNumber: '+380679000011' });
    if (user) {
      user.privilegeLevel = 2;
      await user.save();
    }

    const token = await jwtCb({ token: { phoneNumber: '+380679000011', privilegeLevel: 4 }, user: undefined });
    expect(token.privilegeLevel).toBe(2);
  });

  it('keeps the existing level when the DB lookup finds no user', async () => {
    const token = await jwtCb({ token: { phoneNumber: '+380679000012', privilegeLevel: 5 }, user: undefined });
    expect(token.privilegeLevel).toBe(5);
  });
});

describe('session callback', () => {
  it('exposes privilegeLevel and phoneNumber on session.user', async () => {
    const session = await authOptions.callbacks!.session!({
      session: { user: {} },
      token: { privilegeLevel: 3, phoneNumber: '+380679000013' },
    } as never) as { user: Record<string, unknown> };

    expect(session.user.privilegeLevel).toBe(3);
    expect(session.user.phoneNumber).toBe('+380679000013');
  });
});
