import { describe, it, expect, vi, beforeEach } from 'vitest';
import User from '@/models/user';
import MessageLog from '@/telegram/message-log';
import { handleUpdate } from '@/telegram/handler';
import { sendMessage } from '@/telegram/client';

// No real Telegram API calls in tests — the confirmation reply is mocked.
vi.mock('@/telegram/client', () => ({ sendMessage: vi.fn() }));
const sendMock = vi.mocked(sendMessage);

// Distinct phone/chat per test so log assertions never see other tests' rows.
async function seedBoundUser(phone: string, chatId: number) {
  return User.create({ name: 'TG Test', phoneNumber: phone, password: 'hashed-password', telegramChatId: chatId });
}

describe('handleUpdate (incoming Telegram routing)', () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ ok: true, result: {} });
  });

  it('logs incoming messages from bound chats with the user phone', async () => {
    await seedBoundUser('+380675551234', 101);

    await handleUpdate({ update_id: 1, message: { message_id: 5, chat: { id: 101 }, text: 'Привіт' } });

    const log = (await MessageLog.findOne({ direction: 'in', userPhone: '+380675551234' }))!;
    expect(log.text).toBe('Привіт');
    expect(log.chatId).toBe(101);
  });

  it('replies with a register prompt for messages from unbound chats', async () => {
    await handleUpdate({ update_id: 2, message: { message_id: 6, chat: { id: 999 }, text: 'who am i' } });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const [chatId, text] = sendMock.mock.calls[0];
    expect(chatId).toBe(999);
    expect(text).toContain('/register');
    // The prompt is logged as an outgoing "other" message; no incoming log for unbound chats.
    const out = (await MessageLog.findOne({ direction: 'out', chatId: 999 }))!;
    expect(out.type).toBe('other');
    expect(await MessageLog.countDocuments({ direction: 'in', chatId: 999 })).toBe(0);
  });

  it('ignores non-message updates (e.g. my_chat_member)', async () => {
    await seedBoundUser('+380675551235', 102);

    await handleUpdate({ update_id: 3, my_chat_member: { chat: { id: 102 }, from: {}, new_chat_member: {} } });

    expect(await MessageLog.countDocuments({ userPhone: '+380675551235' })).toBe(0);
  });

  it('never throws on malformed updates', async () => {
    await expect(handleUpdate({} as never)).resolves.toBeUndefined();
  });
});

describe('handleUpdate (bind code flow)', () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ ok: true, result: {} });
  });

  it('links an unbound chat when the user sends a valid bind code', async () => {
    const user = await User.create({ name: 'Bind Me', phoneNumber: '+380675559001', password: 'hashed-password', notifyTelegram: true, telegramBindCode: 'TG-ABCD', telegramBindCodeExpiresAt: new Date(Date.now() + 60_000) });

    await handleUpdate({ update_id: 10, message: { message_id: 70, chat: { id: 501 }, from: { username: 'bindme' }, text: 'tg-abcd' } });

    const fresh = (await User.findById(user._id))!;
    expect(fresh.telegramChatId).toBe(501);
    expect(fresh.telegramBindCode ?? null).toBeNull(); // $unset on bind
    const log = (await MessageLog.findOne({ direction: 'in', type: 'bind', chatId: 501 }))!;
    expect(log.userPhone).toBe('+380675559001');
    expect(sendMock).toHaveBeenCalledWith(501, expect.stringContaining("пов'язано"));
    expect(sendMock).toHaveBeenCalledTimes(1); // bind confirmation only — no register prompt
  });

  it('rejects an expired bind code (chat stays unbound)', async () => {
    const user = await User.create({ name: 'Expired', phoneNumber: '+380675559002', password: 'hashed-password', notifyTelegram: true, telegramBindCode: 'TG-X123', telegramBindCodeExpiresAt: new Date(Date.now() - 60_000) });

    await handleUpdate({ update_id: 11, message: { message_id: 71, chat: { id: 502 }, text: 'TG-X123' } });

    const fresh = (await User.findById(user._id))!;
    expect(fresh.telegramChatId ?? null).toBeNull();
    // The expired code falls through to the unregistered-user register prompt.
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][1]).toContain('/register');
  });

  it('sends the register prompt for unknown bind codes from unbound chats', async () => {
    await handleUpdate({ update_id: 12, message: { message_id: 72, chat: { id: 503 }, text: 'TG-ZZZZ' } });

    expect(await MessageLog.countDocuments({ type: 'bind', chatId: 503 })).toBe(0);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][1]).toContain('/register');
  });
});

describe('handleUpdate (unregistered user register prompt)', () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ ok: true, result: {} });
  });

  it('replies with a registration invite containing the site link', async () => {
    await handleUpdate({ update_id: 20, message: { message_id: 80, chat: { id: 701 }, from: { username: 'stranger' }, text: 'hello bot' } });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const [chatId, text] = sendMock.mock.calls[0];
    expect(chatId).toBe(701);
    expect(text).toContain('Зареєструйтесь');
    expect(text).toContain('/register');
  });

  it('always links to the production register page with telegram UTM attribution', async () => {
    await handleUpdate({ update_id: 21, message: { message_id: 81, chat: { id: 702 }, text: 'hi' } });

    const link = sendMock.mock.calls[0][1];
    expect(link).toContain('https://restal.in.ua/register?utm_source=telegram&utm_medium=bot&utm_campaign=register_prompt');
  });

  it('throttles repeated prompts from the same unbound chat', async () => {
    await handleUpdate({ update_id: 22, message: { message_id: 82, chat: { id: 703 }, text: 'first' } });
    await handleUpdate({ update_id: 23, message: { message_id: 83, chat: { id: 703 }, text: 'second' } });

    expect(sendMock).toHaveBeenCalledTimes(1); // second message within cooldown → no reply
  });

  it('does not log a prompt when the send fails', async () => {
    sendMock.mockRejectedValueOnce(new Error('telegram down'));

    await handleUpdate({ update_id: 24, message: { message_id: 84, chat: { id: 704 }, text: 'hi' } });

    expect(await MessageLog.countDocuments({ direction: 'out', chatId: 704 })).toBe(0);
  });
});
