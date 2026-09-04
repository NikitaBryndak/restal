import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The real twilio client must never be constructed in tests.
const mockMessagesCreate = vi.fn();
vi.mock('twilio', () => ({
  default: vi.fn(() => ({ messages: { create: (...args: unknown[]) => mockMessagesCreate(...args) } })),
}));

// NOTE on dynamic imports below (ts-no-dynamic-import exception): lib/sms.ts captures
// TWILIO_* env vars at module evaluation time, so each scenario must re-import the
// module after stubbing env — a static import cannot express that boundary.

describe('sendSMS without Twilio credentials (client is null)', () => {
  // Test env has no TWILIO_* values, so the client captured at import is null.
  it('throws in non-development environments', async () => {
    const { sendSMS } = await import('@/lib/sms');
    const prevNodeEnv = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
      await expect(sendSMS('+380671234567', 'hello')).rejects.toThrow('Twilio credentials are not configured.');
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
    }
  });

  it('returns a mock sid in development mode (simulated flow)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { sendSMS } = await import('@/lib/sms');
    const prevNodeEnv = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
      const result = await sendSMS('+380671234567', 'otp 123456');
      expect(result).toEqual({ sid: 'mock-sid' });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Would send to +380671234567'));
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
      logSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });
});

describe('sendSMS with Twilio credentials (fresh module import)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockMessagesCreate.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends via the twilio client and returns the result', async () => {
    vi.stubEnv('TWILIO_ACCOUNT_SID', 'ACtest');
    vi.stubEnv('TWILIO_AUTH_TOKEN', 'token');
    vi.stubEnv('TWILIO_PHONE_NUMBER', '+15550001111');
    mockMessagesCreate.mockResolvedValue({ sid: 'SM123' });

    const twilio = (await import('twilio')).default;
    const { sendSMS } = await import('@/lib/sms');
    expect(twilio).toHaveBeenCalledWith('ACtest', 'token');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const result = await sendSMS('+380671234567', 'hi there');
      expect(result).toEqual({ sid: 'SM123' });
      expect(mockMessagesCreate).toHaveBeenCalledWith({
        body: 'hi there',
        from: '+15550001111',
        to: '+380671234567',
      });
    } finally {
      logSpy.mockRestore();
    }
  });

  it('rethrows twilio errors after logging them', async () => {
    vi.stubEnv('TWILIO_ACCOUNT_SID', 'ACtest');
    vi.stubEnv('TWILIO_AUTH_TOKEN', 'token');
    vi.stubEnv('TWILIO_PHONE_NUMBER', '+15550001111');
    mockMessagesCreate.mockRejectedValue(new Error('twilio down'));

    const { sendSMS } = await import('@/lib/sms');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(sendSMS('+380671234567', 'hi')).rejects.toThrow('twilio down');
      expect(errSpy).toHaveBeenCalled();
    } finally {
      errSpy.mockRestore();
    }
  });
});
