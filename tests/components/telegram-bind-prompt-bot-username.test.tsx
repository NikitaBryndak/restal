// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from './test-utils';

const sessionRef = vi.hoisted(() => ({ current: null as unknown }));

vi.mock('next-auth/react', () => ({
  useSession: () => sessionRef.current,
}));

const authenticated = { data: { user: { phoneNumber: '+380675559102' } }, status: 'authenticated' };

/**
 * Re-imports the component (and with it config/constants) after a module reset so
 * TELEGRAM_BOT_USERNAME is re-evaluated against the current process.env.
 */
async function renderPrompt() {
  vi.resetModules();
  const { TelegramBindPrompt } = await import('@/components/telegram-bind-prompt');
  render(<TelegramBindPrompt />);
}

beforeEach(() => {
  sessionRef.current = authenticated;
  sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (String(url).includes('/api/profileFetch')) {
      return Promise.resolve(
        new Response(JSON.stringify({ notifyTelegram: true, telegramChatId: null, telegramBindCode: 'TG-ABCD' }), { status: 200 })
      );
    }
    return Promise.resolve(new Response('{}', { status: 200 }));
  }));
  // Anchor with target=_blank would otherwise hit jsdom's unimplemented navigation.
  vi.stubGlobal('open', vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('TelegramBindPrompt bot username (env-aware)', () => {
  it('defaults to the production bot when no override is set', async () => {
    delete process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    await renderPrompt();

    const link = await screen.findByRole('link', { name: /Відкрити бота/ });
    expect(link).toHaveAttribute('href', 'https://t.me/restal_info_bot');
    expect(screen.getByText(/@restal_info_bot/)).toBeInTheDocument();
  });

  it('points at the dev polling bot when NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME', 'restal_dev_bot');
    await renderPrompt();

    const link = await screen.findByRole('link', { name: /Відкрити бота/ });
    expect(link).toHaveAttribute('href', 'https://t.me/restal_dev_bot');
    expect(screen.getByText(/@restal_dev_bot/)).toBeInTheDocument();
  });
});
