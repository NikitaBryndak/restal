// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
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
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
  // Anchor with target=_blank would otherwise hit jsdom's unimplemented navigation.
  vi.stubGlobal('open', vi.fn());
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

  it('auto-collapses into a slim pill after 8s and re-expands on tap', async () => {
    vi.useFakeTimers();
    try {
      sessionRef.current = authenticated;
      mockProfile({ notifyTelegram: true, telegramChatId: null, telegramBindCode: 'TG-ABCD' });
      render(<TelegramBindPrompt />);

      // act() flushes React scheduler work (MessageChannel) that fake timers alone don't run.
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(screen.getByText(TITLE)).toBeInTheDocument();

      await act(async () => { await vi.advanceTimersByTimeAsync(8000); });
      const pill = screen.getByRole('button', { name: 'Розгорнути Telegram-сповіщення' });
      expect(pill).toHaveTextContent('TG-ABCD');
      expect(screen.queryByText(TITLE)).toBeNull();

      fireEvent.click(pill); // tap expands again and stays expanded
      expect(screen.getByText(TITLE)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('copies the bind code to clipboard when "Відкрити бота" is clicked', async () => {
    sessionRef.current = authenticated;
    mockProfile({ notifyTelegram: true, telegramChatId: null, telegramBindCode: 'TG-ABCD' });
    render(<TelegramBindPrompt />);
    await screen.findByText('TG-ABCD');

    const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
    // fireEvent (not user-event): setup() replaces navigator.clipboard with its own stub, shadowing the spy.
    fireEvent.click(screen.getByRole('link', { name: /Відкрити бота/ }));

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('TG-ABCD'));
    // Feedback swaps the button label briefly.
    expect(await screen.findByText('Скопійовано')).toBeInTheDocument();
  });

  it('copies the code when the inline code chip is tapped', async () => {
    sessionRef.current = authenticated;
    mockProfile({ notifyTelegram: true, telegramChatId: null, telegramBindCode: 'TG-ABCD' });
    render(<TelegramBindPrompt />);
    await screen.findByText('TG-ABCD');

    const writeText = navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;
    fireEvent.click(screen.getByRole('button', { name: 'Скопіювати код TG-ABCD' }));

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('TG-ABCD'));
  });
});
