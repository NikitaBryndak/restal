/**
 * Next.js instrumentation hook — runs once per server process on startup.
 * Starts the Telegram long-poller in local development (TELEGRAM_MODE=polling).
 * Production leaves TELEGRAM_MODE unset and receives updates via the webhook
 * route instead, so nothing here is active there.
 */

export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    if (process.env.TELEGRAM_MODE !== "polling") return;

    // Dynamic import is intentional: instrumentation.ts is evaluated in BOTH the nodejs and edge runtimes, while telegram/poller pulls in mongoose-backed code that only exists on node. A static import would bundle it into the edge graph.
    const { startPolling } = await import("./telegram/poller");
    await startPolling();
}
