import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { handleUpdate } from "@/telegram/handler";
import type { TgUpdate } from "@/telegram/client";

/**
 * Telegram webhook endpoint (production). Telegram POSTs updates here; the
 * secret token header authenticates them. Local development uses long-polling
 * instead (TELEGRAM_MODE=polling) and never hits this route.
 */
export async function POST(request: NextRequest) {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret) {
        const provided = request.headers.get("x-telegram-bot-api-secret-token");
        if (provided !== secret) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    let update: TgUpdate;
    try {
        update = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!update || typeof update.update_id !== "number") {
        return NextResponse.json({ error: "Malformed Telegram update" }, { status: 400 });
    }

    await connectToDatabase();
    // handleUpdate never throws — always ack so Telegram doesn't retry.
    await handleUpdate(update);
    return NextResponse.json({ ok: true });
}
