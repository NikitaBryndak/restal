import { describe, it, expect, vi, afterEach } from 'vitest';
import { tgRequest, sendMessage, setWebhook, getWebhookInfo } from '@/telegram/client';

const TOKEN = 'test-token-123';

function mockBotApi(response: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => response });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('tgRequest', () => {
  it('fails without a bot token and never touches the network', async () => {
    const fetchMock = mockBotApi({ ok: true, result: {} });
    const res = await tgRequest('getMe');
    expect(res.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls param-less methods via GET', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    const fetchMock = mockBotApi({ ok: true, result: { username: 'restal_bot' } });

    const res = await tgRequest('getMe');

    expect(res).toMatchObject({ ok: true, result: { username: 'restal_bot' } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api.telegram.org/bot${TOKEN}/getMe`);
    expect(init.method).toBe('GET');
  });

  it('posts JSON to the Bot API when params are given', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    const fetchMock = mockBotApi({ ok: true, result: {} });

    await tgRequest('sendMessage', { chat_id: 1, text: 'hi' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ chat_id: 1, text: 'hi' });
  });

  it('returns Telegram API errors as-is (no retry, no fallback)', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    mockBotApi({ ok: false, error_code: 429, description: 'Too Many Requests' });

    const res = await tgRequest('sendMessage');

    expect(res.ok).toBe(false);
    expect((res as { error_code?: number }).error_code).toBe(429);
  });

  it('throws on network failure', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    await expect(tgRequest('getMe')).rejects.toThrow('ECONNREFUSED');
  });
});

describe('sendMessage', () => {
  it('throws without a token and never touches the network (no SMS fallback)', async () => {
    const fetchMock = mockBotApi({ ok: true, result: {} });
    await expect(sendMessage(123, 'hi')).rejects.toThrow('TELEGRAM_BOT_TOKEN is not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts HTML-formatted text and returns the message object', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    const fetchMock = mockBotApi({ ok: true, result: { message_id: 7 } });

    const msg = await sendMessage(123, 'hi');

    expect(msg).toMatchObject({ message_id: 7 });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toMatchObject({ chat_id: 123, text: 'hi', parse_mode: 'HTML' });
  });

  it('throws on Telegram API errors (caller decides how to surface)', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    mockBotApi({ ok: false, error_code: 400, description: 'chat not found' });
    await expect(sendMessage(123, 'hi')).rejects.toThrow('chat not found');
  });
});

describe('webhook helpers', () => {
  it('setWebhook passes the secret token and returns the Telegram response', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    const fetchMock = mockBotApi({ ok: true, result: { url: 'https://api.telegram.org/bot' + TOKEN + '/webhook/abc' } });

    const res = await setWebhook('https://restal.in.ua/api/telegram/webhook', 'secret-1');

    expect(res).toMatchObject({ ok: true });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toMatchObject({ url: 'https://restal.in.ua/api/telegram/webhook', secret_token: 'secret-1' });
  });

  it('getWebhookInfo propagates network failures (route layer surfaces them)', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(getWebhookInfo()).rejects.toThrow('offline');
  });

  it('getWebhookInfo returns null without a token (no network call)', async () => {
    const fetchMock = mockBotApi({ ok: true, result: {} });
    expect(await getWebhookInfo()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
