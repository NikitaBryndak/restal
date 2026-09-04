// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render, user } from './test-utils';
import { TelegramBindPrompt } from '@/components/telegram-bind-prompt';

const TITLE = 'Увімкнути Telegram-сповіщення?';

// Mutable session state — set per test before rendering.
const sessionRef = vi.hoisted(() => ({ current: null as unknown }));

vi.mock('next-auth/react', () => ({
  useSession: () => sessionRef.current,
}));

function mockProfile(profile: Record<string, unknown>) {
  (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    if (String(url).includes('/api/profileFetch')) {
      return Promise.resolve(new Response(JSON.stringify(profile), { status: 200 }));
    }
    return Promise.resolve(new Response('{}', { status: 200 }));
  });
}

const authenticated = { data: { user: { phoneNumber: '+380675559101' } }, status: 'authenticated' };

beforeEach(() => {
  sessionRef.current = null;
  sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
});

describe('TelegramBindPrompt (global bind prompt)', () => {
  it('renders nothing for anonymous visitors', async () => {
    sessionRef.current = { data: null, status: 'unauthenticated' };
    render(<TelegramBindPrompt />);
    expect(screen.queryByText(TITLE)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('renders nothing when opt-in is off', async () => {
    sessionRef.current = authenticated;
    mockProfile({ notifyTelegram: false, telegramChatId: null, telegramBindCode: null });
    render(<TelegramBindPrompt />);
    await vi.waitFor(() => expect(screen.queryByText(TITLE)).toBeNull());
  });

  it('shows the bind code and bot link for opted-in unbound users', async () => {
    sessionRef.current = authenticated;
    mockProfile({ notifyTelegram: true, telegramChatId: null, telegramBindCode: 'TG-ABCD' });
    render(<TelegramBindPrompt />);

    expect(await screen.findByText('TG-ABCD')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Відкрити бота/ });
    expect(link).toHaveAttribute('href', 'https://t.me/restal_info_bot');
  });

  it('renders nothing once the chat is bound', async () => {
    sessionRef.current = authenticated;
    mockProfile({ notifyTelegram: true, telegramChatId: 501, telegramBindCode: null });
    render(<TelegramBindPrompt />);
    await vi.waitFor(() => expect(screen.queryByText(TITLE)).toBeNull());
  });

  it('hides after dismissal and remembers it in sessionStorage', async () => {
    sessionRef.current = authenticated;
    mockProfile({ notifyTelegram: true, telegramChatId: null, telegramBindCode: 'TG-ABCD' });
    render(<TelegramBindPrompt />);
    await screen.findByText('TG-ABCD');

    await user().click(screen.getByLabelText('Сховати'));

    expect(screen.queryByText(TITLE)).toBeNull();
    expect(sessionStorage.getItem('tg-bind-prompt-dismissed')).toBe('1');
  });

  it('opt-out posts notifyTelegram=false to the preferences API', async () => {
    sessionRef.current = authenticated;
    mockProfile({ notifyTelegram: true, telegramChatId: null, telegramBindCode: 'TG-ABCD' });
    render(<TelegramBindPrompt />);
    await screen.findByText('TG-ABCD');

    await user().click(screen.getByRole('button', { name: 'Не потрібні' }));

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/auth/preferences',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ notifyTelegram: false }) }),
      );
    });
  });
});
