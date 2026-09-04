import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'msg-1' });
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: (...args: unknown[]) => mockSendMail(...args) })),
  },
}));

import {
  sendContactRequestNotification,
  sendTripStatusEmail,
  sendTripReminderEmail,
  sendCashbackCreditedEmail,
} from '@/lib/email';

beforeEach(() => {
  mockSendMail.mockClear();
  process.env.GMAIL_USER = 'restal@example.com';
});

describe('sendContactRequestNotification', () => {
  it('maps known sources to Ukrainian labels and includes manager + message rows', async () => {
    await sendContactRequestNotification({
      source: 'manager',
      firstName: 'Іван',
      lastName: 'Петренко',
      phone: '+380671234567',
      message: 'Хочу на Мальдіви',
      managerName: 'Олена',
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mail = mockSendMail.mock.calls[0][0] as { to: string; subject: string; html: string };
    expect(mail.to).toContain('@'); // NOTIFICATION_RECIPIENTS joined
    expect(mail.subject).toBe("Нова заявка на зв'язок — Іван Петренко (Сторінка менеджерів)");
    expect(mail.html).toContain('Сторінка менеджерів');
    expect(mail.html).toContain('Іван Петренко');
    expect(mail.html).toContain('tel:+380671234567');
    expect(mail.html).toContain('Олена');
    expect(mail.html).toContain('Хочу на Мальдіви');
  });

  it('falls back to the raw source string for unknown sources', async () => {
    await sendContactRequestNotification({
      source: 'ai-trip-plan',
      firstName: '',
      lastName: '',
      phone: '+380670000002',
      message: '',
      managerName: '',
    });

    const mail = mockSendMail.mock.calls[0][0] as { subject: string; html: string };
    expect(mail.subject).toContain('ai-trip-plan'); // raw fallback label
    expect(mail.html).toContain('Не вказано'); // empty full name
    expect(mail.html).not.toContain('Менеджер:');
    expect(mail.html).not.toContain('Повідомлення:');
  });

  it('joins only the provided name parts', async () => {
    await sendContactRequestNotification({
      source: 'contact',
      firstName: 'Марія',
      lastName: '',
      phone: '+380670000003',
      message: 'привіт',
      managerName: '',
    });

    const mail = mockSendMail.mock.calls[0][0] as { subject: string };
    expect(mail.subject).toContain('Марія (Сторінка контактів)');
  });

  it('propagates transporter failures', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('smtp down'));
    await expect(
      sendContactRequestNotification({
        source: 'tour',
        firstName: 'А',
        lastName: 'Б',
        phone: '+380670000004',
        message: '',
        managerName: '',
      })
    ).rejects.toThrow('smtp down');
  });
});

describe('sendTripStatusEmail', () => {
  it('renders old → new status and addresses the user', async () => {
    await sendTripStatusEmail({
      to: 'user@example.com',
      userName: 'Нікіта',
      tripNumber: 'R-500',
      country: 'Італія',
      oldStatus: 'In Booking',
      newStatus: 'Confirmed',
    });

    const mail = mockSendMail.mock.calls[0][0] as { to: string; subject: string; html: string };
    expect(mail.to).toBe('user@example.com');
    expect(mail.subject).toBe('Подорож R-500: Confirmed');
    expect(mail.html).toContain('Нікіта');
    expect(mail.html).toContain('R-500 — Італія');
    expect(mail.html).toContain('In Booking');
    expect(mail.html).toContain('Confirmed');
  });
});

describe('sendTripReminderEmail', () => {
  it('renders the payment reminder with amounts and remaining balance', async () => {
    await sendTripReminderEmail({
      to: 'user@example.com',
      userName: 'Нікіта',
      tripNumber: 'R-600',
      country: 'Греція',
      reminderType: 'payment',
      deadline: '15/09/2026',
      totalAmount: 12000,
      paidAmount: 5000,
    });

    const mail = mockSendMail.mock.calls[0][0] as { subject: string; html: string };
    expect(mail.subject).toBe('⚠️ Нагадування: оплата за подорож R-600 — 15/09/2026');
    expect(mail.html).toContain('Нагадування про оплату');
    expect(mail.html).toContain('15/09/2026');
    // uk-UA locale formatting: 12 000 / 5 000 / remaining 7 000
    expect(mail.html).toContain((12000).toLocaleString('uk-UA'));
    expect(mail.html).toContain((7000).toLocaleString('uk-UA'));
  });

  it('treats missing amounts as zero', async () => {
    await sendTripReminderEmail({
      to: 'user@example.com',
      userName: 'Нікіта',
      tripNumber: 'R-601',
      country: 'Греція',
      reminderType: 'payment',
      deadline: '15/09/2026',
    });

    const mail = mockSendMail.mock.calls[0][0] as { html: string };
    expect(mail.html).toContain((0).toLocaleString('uk-UA'));
  });

  it('renders the departure reminder with all optional flight/hotel rows', async () => {
    await sendTripReminderEmail({
      to: 'user@example.com',
      userName: 'Нікіта',
      tripNumber: 'R-700',
      country: 'Туреччина',
      reminderType: 'departure',
      flightNumber: 'PS-1234',
      departureTime: '10:30',
      departureDate: '20/09/2026',
      hotel: 'Beach Resort 5*',
    });

    const mail = mockSendMail.mock.calls[0][0] as { subject: string; html: string };
    expect(mail.subject).toBe('✈️ Завтра ваша подорож R-700 — Туреччина!');
    expect(mail.html).toContain('Завтра ваша подорож!');
    expect(mail.html).toContain('PS-1234');
    expect(mail.html).toContain('10:30');
    expect(mail.html).toContain('20/09/2026');
    expect(mail.html).toContain('Beach Resort 5*');
  });

  it('omits departure rows for missing optional fields', async () => {
    await sendTripReminderEmail({
      to: 'user@example.com',
      userName: 'Нікіта',
      tripNumber: 'R-701',
      country: 'Туреччина',
      reminderType: 'departure',
    });

    const mail = mockSendMail.mock.calls[0][0] as { html: string };
    expect(mail.html).not.toContain('Рейс:');
    expect(mail.html).not.toContain('Час вильоту:');
    expect(mail.html).not.toContain('Готель:');
  });
});

describe('sendCashbackCreditedEmail', () => {
  it('shows credited amount and new balance in uk-UA format', async () => {
    await sendCashbackCreditedEmail({
      to: 'user@example.com',
      userName: 'Нікіта',
      tripNumber: 'R-800',
      country: 'Іспанія',
      cashbackAmount: 245,
      newBalance: 1245,
    });

    const mail = mockSendMail.mock.calls[0][0] as { subject: string; html: string };
    expect(mail.subject).toBe(`🎉 Кешбек +${(245).toLocaleString('uk-UA')} грн за подорож R-800`);
    expect(mail.html).toContain(`+${(245).toLocaleString('uk-UA')} грн`);
    expect(mail.html).toContain(`${(1245).toLocaleString('uk-UA')} грн`);
  });
});
