import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireSessionAccess } from "@/lib/role-access";
import { setWebhook, getWebhookInfo } from "@/telegram/client";

/**
 * Admin-only webhook management. POST points the bot at a URL (used after each
 * production deploy: url = https://restal.in.ua/api/telegram/webhook); GET
 * reports the current webhook state for verification.
 */
export async function POST(request: NextRequest) {
    const access = await requireSessionAccess(["roles"]);
    if (!access.ok) return access.response;

    let body: { url?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!/^https:\/\/[^\s]+\//.test(url)) {
        return NextResponse.json({ message: "url must be an absolute https URL" }, { status: 400 });
    }

    const res = await setWebhook(url, process.env.TELEGRAM_WEBHOOK_SECRET);
    if (!res.ok) {
        return NextResponse.json({ message: res.description || "setWebhook failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, url });
}

export async function GET() {
    const access = await requireSessionAccess(["roles"]);
    if (!access.ok) return access.response;

    await connectToDatabase();
    let info;
    try {
        info = await getWebhookInfo();
    } catch (err) {
        return NextResponse.json({ message: `getWebhookInfo failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 502 });
    }
    return NextResponse.json(info ?? { message: "no webhook configured" });
}
