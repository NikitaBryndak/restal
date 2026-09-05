import JobRun from "@/models/jobRun";
import { sendCronFailureEmail } from "@/lib/email";

/** How long job run history is kept before pruning */
const RETENTION_DAYS = 30;

export interface CronRunResult {
    status: "success" | "error";
    /** Result counters from the run (e.g. { paidToInProgress: 2 }) */
    summary?: Record<string, unknown>;
    /** Per-item error messages collected during the run */
    errors?: string[];
    durationMs: number;
}

/**
 * Persist a cron job execution and alert on failure.
 * Fire-and-forget safe: never throws — observability must not break the job itself.
 * Also prunes runs older than RETENTION_DAYS to keep the collection bounded.
 */
export async function recordCronRun(job: string, run: CronRunResult): Promise<void> {
    try {
        await JobRun.create({
            job,
            status: run.status,
            summary: run.summary ?? {},
            errors: run.errors ?? [],
            durationMs: run.durationMs,
        });

        const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60_000);
        await JobRun.deleteMany({ createdAt: { $lt: cutoff } });
    } catch (err) {
        console.error(`Failed to record cron run (${job}):`, err instanceof Error ? err.message : err);
    }

    const hasErrors = (run.errors?.length ?? 0) > 0;
    if (hasErrors || run.status === "error") {
        try {
            await sendCronFailureEmail(job, {
                status: run.status,
                errors: run.errors ?? [],
                summary: run.summary ?? {},
            });
        } catch (err) {
            console.error(`Failed to send cron failure email (${job}):`, err instanceof Error ? err.message : err);
        }
    }
}
