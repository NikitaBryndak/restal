/**
 * One-off index sync for a MongoDB deployment.
 *
 * WHY: Vercel sets NODE_ENV=production, which disables mongoose autoIndex —
 * indexes added to schemas after deploy never build in prod. This script
 * brings the target database's indexes in line with the current schema.
 *
 * Usage (from repo root):
 *   npx tsx scripts/sync-indexes.ts                      # uses MONGODB_URI from .env.local (dev DB)
 *   MONGODB_URI=<uri> npx tsx scripts/sync-indexes.ts    # any other deployment
 *
 * NOTE: syncIndexes() also DROPS indexes that exist in the database but are
 * not defined in the schema. Review the per-model output before running on prod.
 */
import mongoose from "mongoose";

// Import every model so its schema + index definitions register with mongoose.
import "@/models/user";
import "@/models/trip";
import "@/models/role";
import "@/models/article";
import "@/models/notification";
import "@/models/review";
import "@/models/emailLog";
import "@/models/contactRequest";
import "@/models/promoCode";
import "@/models/phoneVerification";
import "@/models/auditLog";
import "@/models/jobRun";
import "@/models/counter";
import "@/models/aiRateLimit";

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI is not set");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
    } catch (err) {
        console.error(`Failed to connect: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
    }

    const dbName = mongoose.connection.db?.databaseName ?? "(unknown)";
    console.log(`Connected — database "${dbName}"`);
    console.log("");

    let failed = false;
    for (const [name, model] of Object.entries(mongoose.models)) {
        try {
            // Diff index names before/after to report what changed
            const before = new Set((await model.collection.indexes()).map((i) => i.name));
            await model.syncIndexes();
            const after = new Set((await model.collection.indexes()).map((i) => i.name));
            const added = [...after].filter((n) => !before.has(n));
            const dropped = [...before].filter((n) => !after.has(n));
            const parts: string[] = [];
            if (added.length) parts.push(`added ${added.join(", ")}`);
            if (dropped.length) parts.push(`DROPPED ${dropped.join(", ")}`);
            console.log(`${parts.length ? "•" : "="} ${name}: ${parts.length ? parts.join("; ") : "in sync"}`);
        } catch (err) {
            failed = true;
            console.error(`✗ ${name}: ${err instanceof Error ? err.message : err}`);
        }
    }

    await mongoose.disconnect();
    console.log("");
    console.log(failed ? "Finished with errors" : "All models in sync");
    process.exit(failed ? 1 : 0);
}

main();
