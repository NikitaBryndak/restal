import { describe, it, expect, vi, afterEach } from 'vitest';
import User from '@/models/user';
import MessageLog from '@/telegram/message-log';
import { sendTelegramNotification } from '@/telegram/notifications';

const TOKEN = 'test-token-456';

function mockBotApi(response: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => response });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('sendTelegramNotification (outbound delivery)', () => {
  it('returns false without a bot token and never touches the network (no SMS fallback)', async () => {
    const fetchMock = mockBotApi({ ok: true, result: {} });
    expect(await sendTelegramNotification({ userPhone: '+380675557771', message: 'hi' })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns false when the user does not exist', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    const fetchMock = mockBotApi({ ok: true, result: {} });
    expect(await sendTelegramNotification({ userPhone: '+380999999999', message: 'hi' })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips users who have not opted in (no network call, no log)', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    await User.create({ name: 'Opted Out', phoneNumber: '+380675557772', password: 'hashed-password', telegramChatId: 301, notifyTelegram: false });
    const fetchMock = mockBotApi({ ok: true, result: {} });

    expect(await sendTelegramNotification({ userPhone: '+380675557772', message: 'hi' })).toBe(false);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await MessageLog.countDocuments({ direction: 'out', userPhone: '+380675557772' })).toBe(0);
  });

  it('sends HTML to bound opted-in users and logs the sent messageId', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    await User.create({ name: 'Opted In', phoneNumber: '+380675557773', password: 'hashed-password', telegramChatId: 302, notifyTelegram: true });
    const fetchMock = mockBotApi({ ok: true, result: { message_id: 55 } });

    const ok = await sendTelegramNotification({ userPhone: '+380675557773', message: 'Бара +1000 за тур R-123', tripNumber: 'R-123' });

    expect(ok).toBe(true);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.chat_id).toBe(302);
    expect(body.parse_mode).toBe('HTML');
    expect(body.text).toContain('<b>R-123</b>'); // trip number bolded

    const log = (await MessageLog.findOne({ direction: 'out', userPhone: '+380675557773' }))!;
    expect(log.status).toBe('sent');
    expect(log.messageId).toBe('55'); // stored as string per schema
  });

  it('logs failed sends with the error and never throws or falls back to SMS', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    await User.create({ name: 'Failing', phoneNumber: '+380675557774', password: 'hashed-password', telegramChatId: 303, notifyTelegram: true });
    mockBotApi({ ok: false, error_code: 400, description: 'chat not found' });

    expect(await sendTelegramNotification({ userPhone: '+380675557774', message: 'hi' })).toBe(false);

    const log = (await MessageLog.findOne({ direction: 'out', userPhone: '+380675557774' }))!;
    expect(log.status).toBe('failed');
    expect(log.error).toContain('chat not found');
  });
});
