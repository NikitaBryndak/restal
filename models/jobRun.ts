import mongoose, { Schema } from "mongoose";

/**
 * One row per cron job execution — observability for scheduled jobs.
 * Written by lib/cron-log.ts after every run (success or failure).
 */
const jobRunSchema = new Schema({
    // Cron route name: auto-status | process-cashback | promo-maintenance
    job: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["success", "error"],
        required: true,
    },
    // Result counters from the run (e.g. { paidToInProgress: 2, ... })
    summary: {
        type: Schema.Types.Mixed,
        default: {},
    },
    // Per-item error messages collected during the run
    errors: {
        type: [String],
        default: [],
    },
    durationMs: {
        type: Number,
        default: 0,
    },
}, { timestamps: true, suppressReservedKeysWarning: true });

// Recent runs per job (admin dashboard)
jobRunSchema.index({ job: 1, createdAt: -1 });

// DEVELOPMENT: Delete cached model on hot-reload to prevent "Cannot overwrite model" errors
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.JobRun) delete mongoose.models.JobRun;
}

const JobRun = mongoose.models.JobRun || mongoose.model("JobRun", jobRunSchema);

export default JobRun;
