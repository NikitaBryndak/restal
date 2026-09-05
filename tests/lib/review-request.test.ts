import { describe, it, expect, beforeEach, vi } from 'vitest';
import Notification from '@/models/notification';
import { Types } from 'mongoose';
import { sendTelegramNotification } from '@/telegram/notifications';
import { buildReviewLink, sendReviewRequest } from '@/lib/notifications';

// No real Telegram API calls in tests — delivery is mocked at the client boundary.
vi.mock('@/telegram/notifications', () => ({ sendTelegramNotification: vi.fn() }));

const mockSendTg = vi.mocked(sendTelegramNotification);

beforeEach(() => {
  mockSendTg.mockReset();
  mockSendTg.mockResolvedValue(true);
});

describe('buildReviewLink', () => {
  it('returns the shared-page URL for a token and undefined otherwise', () => {
    expect(buildReviewLink('TOK-1')).toBe('https://restal.in.ua/shared/trip/TOK-1');
    expect(buildReviewLink(undefined)).toBeUndefined();
    expect(buildReviewLink(null)).toBeUndefined();
    expect(buildReviewLink('')).toBeUndefined();
  });
});

describe('sendReviewRequest (post-trip review request)', () => {
  it('creates a review_request notification with the share link when a token exists', async () => {
    await sendReviewRequest({
      userPhone: '+380675550101',
      tripId: new Types.ObjectId().toHexString(),
      tripNumber: 'R-REV-1',
      country: 'Італія',
      shareToken: 'TOK-REV',
    });

    const notif = (await Notification.findOne({ userPhone: '+380675550101' }))!;
    expect(notif.type).toBe('status_change');
    expect(notif.data.type).toBe('review_request');
    expect(notif.tripNumber).toBe('R-REV-1');
    expect(notif.message).toContain('R-REV-1');
    expect(notif.message).toContain('(Італія)');
    expect(notif.message).toContain('https://restal.in.ua/shared/trip/TOK-REV');

    // Telegram dispatch contract (fire-and-forget inside createNotification).
    await new Promise((r) => setImmediate(r));
    expect(mockSendTg).toHaveBeenCalledWith({
      userPhone: '+380675550101',
      message: notif.message,
      tripNumber: 'R-REV-1',
      logType: 'review_request',
    });
  });

  it('omits the link line when the trip has no share token', async () => {
    await sendReviewRequest({
      userPhone: '+380675550102',
      tripId: new Types.ObjectId().toHexString(),
      tripNumber: 'R-REV-2',
    });

    const notif = (await Notification.findOne({ userPhone: '+380675550102' }))!;
    expect(notif.data.type).toBe('review_request');
    expect(notif.message).toContain('R-REV-2');
    expect(notif.message).not.toContain('shared/trip');
  });
});
