import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { createNotification } from '@/lib/notifications';
import Notification from '@/models/notification';

describe('createNotification', () => {
  it('creates an unread notification with default empty data', async () => {
    const tripId = new mongoose.Types.ObjectId().toString();
    const created = await createNotification({
      userPhone: '+380671234567',
      tripId,
      tripNumber: 'R-100',
      type: 'status_change',
      message: 'Статус змінено',
    });

    expect(created.read).toBe(false);
    expect(created.data).toEqual({});
    expect(created.tripNumber).toBe('R-100');

    const fromDb = await Notification.findById(created._id);
    expect(fromDb?.userPhone).toBe('+380671234567');
  });

  it('stores custom data payload and document_upload type', async () => {
    const tripId = new mongoose.Types.ObjectId().toString();
    const created = await createNotification({
      userPhone: '+380670000001',
      tripId,
      tripNumber: 'R-200',
      type: 'document_upload',
      message: 'Документ завантажено',
      data: { fileName: 'passport.pdf' },
    });

    expect(created.data).toEqual({ fileName: 'passport.pdf' });
    const fromDb = await Notification.findById(created._id);
    expect(fromDb?.type).toBe('document_upload');
  });
});
