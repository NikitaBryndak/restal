/**
 * Telegram Bot API client — thin, dependency-free (global fetch).
 *
 * SECURITY/DESIGN INVARIANT: Telegram is a fire-and-log channel. A failed or
 * missing send MUST NEVER fall back to Twilio/SMS — Twilio exists exclusively
 * for registration and password-recovery OTPs (lib/sms.ts). Failure here means:
 * write a `failed` log entry, surface the error to the caller, stop.
 */

import { TELEGRAM_REQUEST_TIMEOUT_MS } from "@/config/constants";

export interface TgResponse<T = unknown> {
    ok: boolean;
    result?: T;
    description?: string;
}

function apiUrl(method: string): string | null {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return null;
    return `https://api.telegram.org/bot${token}/${method}`;
}

/**
 * Calls a Bot API method. Returns the parsed response body on any HTTP answer
 * (Telegram errors come back as 200/4xx with ok:false). Throws only on network
 * failure or timeout. Returns { ok: false } without touching the network when
 * no token is configured — callers treat that as "channel unavailable".
 */
export async function tgRequest<T = unknown>(
    method: string,
    params?: Record<string, unknown>
): Promise<TgResponse<T>> {
    const url = apiUrl(method);
    if (!url) {
        return { ok: false, description: "TELEGRAM_BOT_TOKEN is not configured" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TELEGRAM_REQUEST_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: params ? "POST" : "GET",
            headers: params ? { "Content-Type": "application/json" } : undefined,
            body: params ? JSON.stringify(params) : undefined,
            signal: controller.signal,
        });
        const data = (await res.json()) as TgResponse<T>;
        return data;
    } finally {
        clearTimeout(timer);
    }
}

export interface TgMessage {
    message_id: number;
    chat: { id: number };
    text?: string;
}

/** Sends an HTML-formatted message. Throws on network failure or Telegram error. */
export async function sendMessage(chatId: number, htmlText: string): Promise<TgMessage> {
    const res = await tgRequest<TgMessage>("sendMessage", {
        chat_id: chatId,
        text: htmlText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
    });
    if (!res.ok || !res.result) {
        throw new Error(res.description || `Telegram sendMessage failed (ok=${res.ok})`);
    }
    return res.result;
}

export interface TgUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from?: { id: number; username?: string; first_name?: string };
        chat: { id: number; type: string; username?: string };
        text?: string;
        date?: number;
    };
}

/** Long-poll for updates (local development mode). */
export async function getUpdates(offset: number, timeoutSec = 50): Promise<TgUpdate[]> {
    const res = await tgRequest<TgUpdate[]>("getUpdates", {
        offset,
        timeout: timeoutSec,
        allowed_updates: ["message"],
    });
    if (!res.ok || !Array.isArray(res.result)) {
        throw new Error(res.description || "Telegram getUpdates failed");
    }
    return res.result;
}

export interface TgWebhookInfo {
    url?: string;
    pending_update_count?: number;
    last_error_message?: string;
}

/** Points the bot at a webhook URL (production). `secretToken` becomes the X-Telegram-Bot-Api-Secret-Token header. */
export async function setWebhook(url: string, secretToken?: string): Promise<TgResponse> {
    return tgRequest("setWebhook", { url, secret_token: secretToken || undefined });
}

export async function getWebhookInfo(): Promise<TgWebhookInfo | null> {
    const res = await tgRequest<TgWebhookInfo>("getWebhookInfo");
    return res.ok ? res.result ?? null : null;
}
