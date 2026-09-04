/**
 * Outbound Telegram notifications — delivery side of the bot.
 *
 * Opt-in gate (both must hold):
 *   1. user.telegramChatId is set (account bound to a Telegram chat), AND
 *   2. user.notifyTelegram === true (checkbox at registration / settings toggle).
 *
 * INVARIANT: this function never throws and NEVER falls back to Twilio/SMS on
 * failure — it logs a `failed` entry and returns false. Twilio is reserved for
 * registration/recovery OTPs only.
 */

import User from "@/models/user";
import MessageLog from "./message-log";
import { sendMessage } from "./client";

export type TelegramLogType =
    | "trip_status"
    | "document_upload"
    | "reminder_payment"
    | "reminder_departure"
    | "cashback_credited"
    | "other";

export interface SendTelegramParams {
    userPhone: string;
    message: string; // plain-text (Ukrainian) notification body
    tripNumber?: string;
    logType?: TelegramLogType;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/** Escapes the message for Telegram HTML and bolds the trip number on first occurrence. */
export function formatTelegramHtml(message: string, tripNumber?: string): string {
    const escaped = escapeHtml(message);
    if (tripNumber) {
        const escTrip = escapeHtml(tripNumber);
        const idx = escaped.indexOf(escTrip);
        if (idx !== -1) {
            return `${escaped.slice(0, idx)}<b>${escTrip}</b>${escaped.slice(idx + escTrip.length)}`;
        }
    }
    return escaped;
}

async function writeLog(entry: Partial<InstanceType<typeof MessageLog>> & { chatId: number }): Promise<void> {
    try {
        await MessageLog.create(entry);
    } catch (err) {
        console.error("[telegram] Failed to write message log:", err instanceof Error ? err.message : err);
    }
}

/** Sends a notification via Telegram. Returns true only on successful delivery. */
export async function sendTelegramNotification(params: SendTelegramParams): Promise<boolean> {
    const { userPhone, message, tripNumber, logType = "other" } = params;

    const user = await User.findOne({ phoneNumber: userPhone })
        .select("telegramChatId notifyTelegram");

    if (!user?.telegramChatId || user.notifyTelegram !== true) {
        return false; // not bound or opted out — no message, nothing to log
    }

    const html = formatTelegramHtml(message, tripNumber);

    try {
        const sent = await sendMessage(user.telegramChatId, html);
        await writeLog({
            direction: "out",
            chatId: user.telegramChatId,
            userPhone,
            text: html,
            type: logType,
            messageId: String(sent.message_id),
            status: "sent",
            tripNumber,
        });
        return true;
    } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error(`[telegram] Failed to send notification to ${userPhone}:`, error);
        await writeLog({
            direction: "out",
            chatId: user.telegramChatId,
            userPhone,
            text: html,
            type: logType,
            status: "failed",
            error,
            tripNumber,
        });
        return false; // no Twilio fallback — by design
    }
}
