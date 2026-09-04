import { describe, it, expect, vi } from 'vitest';
import { logAudit } from '@/lib/audit';
import AuditLog from '@/models/auditLog';

describe('logAudit', () => {
  it('persists a full audit entry with all optional fields', async () => {
    await logAudit({
      action: 'trip.update',
      entityType: 'trip',
      entityId: 'abc123',
      userId: 'user-1',
      userPhone: '+380671234567',
      userName: 'Нікіта',
      details: { oldStatus: 'In Booking', newStatus: 'Confirmed' },
      ip: '1.2.3.4',
    });

    const doc = await AuditLog.findOne({ action: 'trip.update' });
    expect(doc).not.toBeNull();
    expect(doc?.entityType).toBe('trip');
    expect(doc?.entityId).toBe('abc123');
    expect(doc?.userPhone).toBe('+380671234567');
    expect(doc?.details).toEqual({ oldStatus: 'In Booking', newStatus: 'Confirmed' });
    expect(doc?.ip).toBe('1.2.3.4');
  });

  it('applies empty-string defaults for omitted optional fields', async () => {
    await logAudit({ action: 'system.startup', entityType: 'system', userId: 'user-2' });

    const doc = await AuditLog.findOne({ action: 'system.startup' });
    expect(doc?.entityId).toBe('');
    expect(doc?.userPhone).toBe('');
    expect(doc?.userName).toBe('');
    expect(doc?.details).toEqual({});
    expect(doc?.ip).toBe('');
  });

  it('strips undefined values from details before saving', async () => {
    await logAudit({
      action: 'promo.redeem',
      entityType: 'promo-code',
      userId: 'user-3',
      details: { code: 'X1', maybeMissing: undefined, amount: 500 },
    });

    const doc = await AuditLog.findOne({ action: 'promo.redeem' });
    expect(doc?.details).toEqual({ code: 'X1', amount: 500 });
    expect((doc?.details as Record<string, unknown>).maybeMissing).toBeUndefined();
  });

  it('never throws — DB failures are swallowed and logged', async () => {
    const createSpy = vi.spyOn(AuditLog, 'create').mockRejectedValueOnce(new Error('db down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(
        logAudit({ action: 'trip.create', entityType: 'trip', userId: 'user-4' })
      ).resolves.toBeUndefined();
      expect(errSpy).toHaveBeenCalled();
    } finally {
      createSpy.mockRestore();
      errSpy.mockRestore();
    }
  });
});
