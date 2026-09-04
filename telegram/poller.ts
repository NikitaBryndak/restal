/**
 * Long-polling loop for local development (TELEGRAM_MODE=polling).
 * Production uses the webhook route instead — Vercel cannot hold a
 * long-lived process. Started from instrumentation.ts, never from request code.
 */

import { getUpdates } from "./client";
import { handleUpdate } from "./handler";

const RETRY_DELAY_MS = 3_000;
// Must stay below the client's 15s request abort, or every poll dies as "aborted".
const POLL_TIMEOUT_SEC = 10;

// Survives module re-evaluation (dev hot reload) — one loop per process.
const GLOBAL_KEY = Symbol.for("restal.telegram.poller.running");

function isRunning(): boolean {
    return (globalThis as Record<symbol, boolean>)[GLOBAL_KEY] === true;
}

/** Starts the poll loop if not already running. Resolves immediately. */
export async function startPolling(): Promise<void> {
    if (isRunning()) return;
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.warn("[telegram] TELEGRAM_MODE=polling but no TELEGRAM_BOT_TOKEN — poller not started");
        return;
    }

    (globalThis as Record<symbol, boolean>)[GLOBAL_KEY] = true;
    console.log("[telegram] Long-polling started (local dev mode)");

    let offset = 0;
    // Detached loop — must never reject into the instrumentation caller.
    void (async () => {
        while (true) {
            try {
                const updates = await getUpdates(offset, POLL_TIMEOUT_SEC);
                for (const update of updates) {
                    offset = Math.max(offset, update.update_id + 1);
                    await handleUpdate(update);
                }
            } catch (err) {
                console.error("[telegram] Poll error:", err instanceof Error ? err.message : err);
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            }
        }
    })();
}
