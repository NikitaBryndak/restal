/**
 * Incoming update router — single entry point shared by the webhook route and
 * the local poller, so both paths behave identically.
 *
 * CURRENT SCOPE (2026-09-04): messages from bound chats are logged to
 * `messagelogs`. Unbound chats are ignored UNLESS the text is a one-time bind
 * code shown in the site's Telegram prompt — then the chat gets linked and the
 * user receives a confirmation reply. This file is the expansion point for
 * future bot features (support inbox, commands). Keep per-update-type logic
 */

import User from "@/models/user";
import MessageLog from "./message-log";
import { sendMessage } from "./client";
import { formatTelegramHtml } from "./notifications";
import type { TgUpdate } from "./client";

/** Resolves the Restal account bound to a Telegram chat, if any. */
export async function findUserByChatId(chatId: number) {
    return User.findOne({ telegramChatId: chatId })
        .select("phoneNumber name notifyTelegram");
}

async function handleMessage(message: NonNullable<TgUpdate["message"]>): Promise<void> {
    if (!message.text) return; // non-text updates (photos, stickers…) are out of scope for now

    const user = await findUserByChatId(message.chat.id);

    if (!user) {
        // Unbound chat: first check for a one-time bind code from the site prompt.
        const boundPhone = await tryBindByCode(message);
        if (boundPhone) return;

        // Otherwise ignored on purpose — logged to the server console so unknown
        // chats stay visible during development.
        console.log(
            `[telegram] Ignoring message from unbound chat ${message.chat.id} (@${message.from?.username ?? "?"}): ${JSON.stringify(message.text).slice(0, 200)}`
        );
        return;
    }

    try {
        await MessageLog.create({
            direction: "in",
            chatId: message.chat.id,
            username: message.from?.username || undefined,
            userPhone: user.phoneNumber,
            text: message.text,
            type: "incoming",
            messageId: String(message.message_id),
        });
    } catch (err) {
        // Logging must never break update processing.
        console.error("[telegram] Failed to write incoming message log:", err instanceof Error ? err.message : err);
    }
}

/**
 * If the message text is a valid one-time bind code, links this chat to that user.
 * Returns the bound phone on success, null otherwise.
 */
async function tryBindByCode(message: NonNullable<TgUpdate["message"]>): Promise<string | null> {
    const code = (message.text ?? "").trim().toUpperCase();
    if (!/^TG-[A-Z0-9]{4}$/.test(code)) return null;

    const user = await User.findOne({ telegramBindCode: code, telegramChatId: null })
        .select("phoneNumber name telegramBindCodeExpiresAt");
    if (!user) return null;

    if (user.telegramBindCodeExpiresAt && user.telegramBindCodeExpiresAt.getTime() < Date.now()) {
        console.log(`[telegram] Bind code expired for ${user.phoneNumber}`);
        return null; // profileFetch issues a fresh one on the next visit
    }

    await User.updateOne(
        { _id: user._id },
        { $set: { telegramChatId: message.chat.id }, $unset: { telegramBindCode: "", telegramBindCodeExpiresAt: "" } }
    );

    try {
        await MessageLog.create({
            direction: "in",
            chatId: message.chat.id,
            username: message.from?.username || undefined,
            userPhone: user.phoneNumber,
            text: code,
            type: "bind",
            messageId: String(message.message_id),
        });
    } catch (err) {
        console.error("[telegram] Failed to write bind log:", err instanceof Error ? err.message : err);
    }

    try {
        await sendMessage(
            message.chat.id,
            formatTelegramHtml(`Акаунт ${user.name} пов'язано з Telegram!\nТепер оновлення про ваші тури надходитимуть сюди.`)
        );
    } catch (err) {
        // The binding itself succeeded — a failed confirmation reply must not undo it.
        console.error("[telegram] Failed to send bind confirmation:", err instanceof Error ? err.message : err);
    }

    return user.phoneNumber;
}

/** Processes one Telegram update. Never throws — webhook/poller always ack. */
export async function handleUpdate(update: TgUpdate): Promise<void> {
    try {
        if (update.message) {
            await handleMessage(update.message);
        }
        // Future: edited_message, callback_query, commands (/start, /help)…
    } catch (err) {
        console.error("[telegram] handleUpdate error:", err instanceof Error ? err.stack : err);
    }
}
