import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import User from '@/models/user';
import { getServerSession } from 'next-auth';
import { POST as setPrefs } from '@/app/api/auth/preferences/route';
import { GET as fetchProfile } from '@/app/api/profileFetch/route';

// Replace only the session lookup; keep every other next-auth export intact.
vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return { ...actual, getServerSession: vi.fn() };
});
const mockGetServerSession = vi.mocked(getServerSession);

const PHONE = '+380675554444';

beforeEach(() => {
  mockGetServerSession.mockReset();
  mockGetServerSession.mockResolvedValue({ user: { phoneNumber: PHONE } });
});

function post(body: unknown) {
  return new NextRequest('http://localhost/api/auth/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/auth/preferences — telegram opt-in', () => {
  it('persists notifyTelegram=true and returns all three flags', async () => {
    await User.create({ name: 'Prefs', phoneNumber: PHONE, password: 'hashed-password' });

    const res = await setPrefs(post({ notifyTelegram: true }));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ notifyEmail: false, notifySms: false, notifyTelegram: true });
    const user = (await User.findOne({ phoneNumber: PHONE }))!;
    expect(user.notifyTelegram).toBe(true);
  });

  it('rejects non-boolean values with 400', async () => {
    await User.create({ name: 'Prefs2', phoneNumber: PHONE, password: 'hashed-password' });
    const res = await setPrefs(post({ notifyTelegram: 'yes' }));
    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated requests with 401', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await setPrefs(post({ notifyTelegram: true }));
    expect(res.status).toBe(401);
  });
});

describe('/api/profileFetch — telegram flag exposure', () => {
  it('returns the saved flags (defaults false)', async () => {
    await User.create({ name: 'Prefs3', phoneNumber: PHONE, password: 'hashed-password' });

    const res = await fetchProfile();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.notifyTelegram ?? false).toBe(false);
  });

  it('reflects a persisted opt-in', async () => {
    await User.create({ name: 'Prefs4', phoneNumber: PHONE, password: 'hashed-password', notifyTelegram: true });

    const res = await fetchProfile();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.notifyTelegram).toBe(true);
  });
});

describe('/api/profileFetch — telegram bind code', () => {
  it('generates and returns a one-time bind code when opted in but unbound', async () => {
    const phone = '+380675559101';
    mockGetServerSession.mockResolvedValue({ user: { phoneNumber: phone } });
    await User.create({ name: 'BindGen', phoneNumber: phone, password: 'hashed-password', notifyTelegram: true });

    const res = await fetchProfile();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.telegramChatId ?? null).toBeNull();
    expect(data.telegramBindCode).toMatch(/^TG-[A-Z0-9]{4}$/);

    const user = (await User.findOne({ phoneNumber: phone }))!;
    expect(user.telegramBindCode).toBe(data.telegramBindCode);
    expect(user.telegramBindCodeExpiresAt!.getTime()).toBeGreaterThan(Date.now());
  });

  it('reuses the unexpired code across fetches', async () => {
    const phone = '+380675559102';
    mockGetServerSession.mockResolvedValue({ user: { phoneNumber: phone } });
    await User.create({ name: 'BindReuse', phoneNumber: phone, password: 'hashed-password', notifyTelegram: true, telegramBindCode: 'TG-KEEP1', telegramBindCodeExpiresAt: new Date(Date.now() + 60_000) });

    const data = await (await fetchProfile()).json();
    expect(data.telegramBindCode).toBe('TG-KEEP1');
  });

  it('returns the chat id and no code once bound', async () => {
    const phone = '+380675559103';
    mockGetServerSession.mockResolvedValue({ user: { phoneNumber: phone } });
    await User.create({ name: 'BoundUser', phoneNumber: phone, password: 'hashed-password', notifyTelegram: true, telegramChatId: 777 });

    const data = await (await fetchProfile()).json();
    expect(data.telegramChatId).toBe(777);
    expect(data.telegramBindCode ?? null).toBeNull();
  });

  it('does not generate a code when opt-in is off', async () => {
    const phone = '+380675559104';
    mockGetServerSession.mockResolvedValue({ user: { phoneNumber: phone } });
    await User.create({ name: 'NoOptIn', phoneNumber: phone, password: 'hashed-password' });

    const data = await (await fetchProfile()).json();
    expect(data.telegramBindCode ?? null).toBeNull();
  });
});
