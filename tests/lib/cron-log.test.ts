import { describe, it, expect, beforeEach, vi } from 'vitest';
import JobRun from '@/models/jobRun';
import { sendCronFailureEmail } from '@/lib/email';
import { recordCronRun } from '@/lib/cron-log';

// No real Gmail sends in tests — delivery is mocked at the boundary.
vi.mock('@/lib/email', () => ({ sendCronFailureEmail: vi.fn().mockResolvedValue(undefined) }));

const mockSendCronFailureEmail = vi.mocked(sendCronFailureEmail);

// Run-scoped job names so repeated suite runs never collide with earlier fixtures.
const RUN = Date.now();

beforeEach(() => {
  mockSendCronFailureEmail.mockReset();
  mockSendCronFailureEmail.mockResolvedValue(undefined);
});

describe('recordCronRun (cron observability)', () => {
  it('persists a successful run with summary and duration', async () => {
    const job = `auto-status-${RUN}`;
    await recordCronRun(job, {
      status: 'success',
      summary: { paidToInProgress: 2, completedToArchived: 1 },
      errors: [],
      durationMs: 42,
    });

    const doc = (await JobRun.findOne({ job }))!;
    expect(doc.status).toBe('success');
    expect(doc.summary).toMatchObject({ paidToInProgress: 2, completedToArchived: 1 });
    expect(doc.errors).toEqual([]);
    expect(doc.durationMs).toBe(42);

    // No failure email on a clean run
    expect(mockSendCronFailureEmail).not.toHaveBeenCalled();
  });

  it('sends a failure email when the run collected errors', async () => {
    const job = `process-cashback-${RUN}`;
    await recordCronRun(job, {
      status: 'success',
      summary: { processedCount: 1 },
      errors: ['Error processing trip R-TEST'],
      durationMs: 10,
    });

    expect(mockSendCronFailureEmail).toHaveBeenCalledTimes(1);
    expect(mockSendCronFailureEmail).toHaveBeenCalledWith(job, expect.objectContaining({
      status: 'success',
      errors: ['Error processing trip R-TEST'],
    }));
  });

  it('sends a failure email when the run itself failed (status error)', async () => {
    const job = `promo-maintenance-${RUN}`;
    await recordCronRun(job, {
      status: 'error',
      errors: ['db down'],
      durationMs: 5,
    });

    expect(mockSendCronFailureEmail).toHaveBeenCalledWith(job, expect.objectContaining({ status: 'error' }));
    const doc = (await JobRun.findOne({ job }))!;
    expect(doc.status).toBe('error');
  });

  it('prunes runs older than the retention window', async () => {
    const job = `auto-status-prune-${RUN}`;
    // Insert an old run directly with a backdated createdAt (bypasses timestamps)
    await JobRun.collection.insertOne({
      job,
      status: 'success',
      summary: {},
      errors: [],
      durationMs: 1,
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60_000),
    });

    await recordCronRun(job, { status: 'success', durationMs: 3 });

    const docs = await JobRun.find({ job }).lean();
    expect(docs).toHaveLength(1); // old one pruned, new one kept
    expect((docs[0] as { createdAt: Date }).createdAt.getTime()).toBeGreaterThan(Date.now() - 24 * 60 * 60_000);
  });

  it('never throws when the database write fails (observability must not break cron)', async () => {
    const createSpy = vi.spyOn(JobRun, 'create').mockRejectedValueOnce(new Error('db down'));
    await expect(
      recordCronRun(`broken-${RUN}`, { status: 'success', durationMs: 1 })
    ).resolves.toBeUndefined();
    createSpy.mockRestore();
  });

  it('still attempts the failure email even when the DB write fails', async () => {
    const createSpy = vi.spyOn(JobRun, 'create').mockRejectedValueOnce(new Error('db down'));
    await recordCronRun(`broken-email-${RUN}`, { status: 'error', errors: ['x'], durationMs: 1 });

    expect(mockSendCronFailureEmail).toHaveBeenCalledTimes(1);
    createSpy.mockRestore();
  });
});
