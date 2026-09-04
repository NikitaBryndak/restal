import { describe, it, expect, beforeEach, vi } from 'vitest';
import EmailLog from '@/models/emailLog';
import { sendTripStatusEmail, sendCashbackCreditedEmail } from '@/lib/email';

// The transporter is created at module load; mock nodemailer so no real SMTP happens.
const { mockSendMail } = vi.hoisted(() => ({ mockSendMail: vi.fn() }));
vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({ sendMail: (...args: unknown[]) => mockSendMail(...args) }),
  },
}));

const statusData = (tripNumber: string) => ({
  to: 'user@example.com',
  userName: 'Olena',
  tripNumber,
  country: 'Тест',
  oldStatus: 'Paid',
  newStatus: 'In Progress',
});

beforeEach(() => {
  mockSendMail.mockReset();
});

describe('email send logging (sendTracked chokepoint)', () => {
  it('logs a sent entry with messageId, type and trip number on success', async () => {
    mockSendMail.mockResolvedValue({ messageId: '<test-123@gmail.com>' });

    await sendTripStatusEmail(statusData('TRIP-1'));

    const log = (await EmailLog.findOne({ tripNumber: 'TRIP-1' }).lean()) as Record<string, unknown> | null;
    expect(log).toMatchObject({
      type: 'trip_status',
      to: 'user@example.com',
      status: 'sent',
      messageId: '<test-123@gmail.com>',
    });
    expect(String(log?.subject)).toContain('TRIP-1');
  });

  it('logs a failed entry with the error and still rethrows for the caller', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTPAuthenticationError: bad creds'));

    await expect(sendTripStatusEmail(statusData('TRIP-2'))).rejects.toThrow(/bad creds/);

    const log = (await EmailLog.findOne({ tripNumber: 'TRIP-2' }).lean()) as Record<string, unknown> | null;
    expect(log).toMatchObject({ type: 'trip_status', to: 'user@example.com', status: 'failed' });
    expect(String(log?.error)).toContain('SMTPAuthenticationError');
  });

  it('maps each send function to its own log type (cashback example)', async () => {
    mockSendMail.mockResolvedValue({ messageId: '<cb-1@gmail.com>' });

    await sendCashbackCreditedEmail({
      to: 'user@example.com',
      userName: 'Olena',
      tripNumber: 'TRIP-3',
      country: 'Тест',
      cashbackAmount: 500,
      newBalance: 1200,
    });

    const log = (await EmailLog.findOne({ type: 'cashback_credited' }).lean()) as Record<string, unknown> | null;
    expect(log).toMatchObject({ status: 'sent', tripNumber: 'TRIP-3', messageId: '<cb-1@gmail.com>' });
  });

  it('still sends when the log write itself fails (logging never blocks delivery)', async () => {
    mockSendMail.mockResolvedValue({ messageId: '<ok-1@gmail.com>' });
    const spy = vi.spyOn(EmailLog, 'create').mockRejectedValue(new Error('db down'));

    await expect(sendTripStatusEmail(statusData('TRIP-4'))).resolves.toBeUndefined();
    expect(mockSendMail).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});
