import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import User from '@/models/user';
import MessageLog from '@/telegram/message-log';
import { POST } from '@/app/api/telegram/webhook/route';

const SECRET = 'test-webhook-secret';

function updateRequest(body: string, secret?: string) {
  return new NextRequest('http://localhost/api/telegram/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'x-telegram-bot-api-secret-token': secret } : {}),
    },
    body,
  });
}

beforeEach(() => vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', SECRET));
afterEach(() => vi.unstubAllEnvs());

describe('POST /api/telegram/webhook', () => {
  it('rejects requests with a wrong secret token (403)', async () => {
    const res = await POST(updateRequest(JSON.stringify({ update_id: 1 }), 'wrong-secret'));
    expect(res.status).toBe(403);
  });

  it('accepts a bound user message and logs it', async () => {
    await User.create({ name: 'Hooked', phoneNumber: '+380675559991', password: 'hashed-password', telegramChatId: 201 });

    const res = await POST(updateRequest(
      JSON.stringify({ update_id: 10, message: { message_id: 9, chat: { id: 201 }, text: 'via webhook' } }),
      SECRET,
    ));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const log = (await MessageLog.findOne({ direction: 'in', userPhone: '+380675559991' }))!;
    expect(log.text).toBe('via webhook');
  });

  it('returns 400 on malformed JSON body', async () => {
    const res = await POST(updateRequest('{not json', SECRET));
    expect(res.status).toBe(400);
  });

  it('returns 400 when update_id is missing', async () => {
    const res = await POST(updateRequest(JSON.stringify({ message: {} }), SECRET));
    expect(res.status).toBe(400);
  });

  it('acks (200) unbound chats without logging', async () => {
    const res = await POST(updateRequest(
      JSON.stringify({ update_id: 11, message: { message_id: 10, chat: { id: 777 }, text: 'stranger' } }),
      SECRET,
    ));

    expect(res.status).toBe(200);
    expect(await MessageLog.countDocuments({ chatId: 777 })).toBe(0);
  });
});
