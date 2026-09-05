import Notification from "@/models/notification";
import { sendTelegramNotification, type TelegramLogType } from "@/telegram/notifications";

interface CreateNotificationParams {
    userPhone: string;
    tripId: string;
    tripNumber: string;
    type: "document_upload" | "status_change" | "trip_created";
    message: string;
    data?: Record<string, unknown>;
}

/** Derives the telegram message-log type from the in-app notification kind. */
function deriveTelegramLogType(type: string, data?: Record<string, unknown>): TelegramLogType {
    if (type === "document_upload") return "document_upload";
    if (type === "trip_created") return "trip_created";
    const dt = data?.type;
    if (dt === "payment_reminder") return "reminder_payment";
    if (dt === "departure_reminder") return "reminder_departure";
    if (dt === "cashback_credited") return "cashback_credited";
    if (dt === "review_request") return "review_request";
    return "trip_status";
}

/**
 * Creates an in-app notification.
 */
export async function createNotification(params: CreateNotificationParams) {
    const { userPhone, tripId, tripNumber, type, message, data } = params;

    const notification = await Notification.create({
        userPhone,
        tripId,
        tripNumber,
        type,
        message,
        data: data || {},
        read: false,
    });

    // Map the in-app notification to a telegram log type (reminders/cashback are
    // status_change-typed but carry their kind in data.type).
    const logType = deriveTelegramLogType(type, data);

    // Telegram delivery — fire-and-forget. Must never break in-app notification
    // creation; failures are logged inside sendTelegramNotification (no SMS fallback).
    void sendTelegramNotification({ userPhone, message, tripNumber, logType }).catch(
        (err) => console.error("[telegram] Dispatch error:", err instanceof Error ? err.message : err)
    );

    return notification;
}

/** Public review link for a trip (shared page with the owner's review form). */
export function buildReviewLink(shareToken?: string | null): string | undefined {
    return shareToken ? `https://restal.in.ua/shared/trip/${shareToken}` : undefined;
}

/**
 * Post-trip review request — in-app + Telegram. Sent when a trip is marked
 * Completed (auto-cron or manual status change). Includes the shared-page link
 * when the trip has a share token, so the client can leave a review directly
 * from the Telegram message.
 */
export async function sendReviewRequest(params: {
    userPhone: string;
    tripId: string;
    tripNumber: string;
    country?: string;
    shareToken?: string | null;
}) {
    const link = buildReviewLink(params.shareToken);
    const message = `Дякуємо, що подорожували з RestAL! Поділіться враженнями від подорожі ${params.tripNumber}${params.country ? ` (${params.country})` : ""} — ваш відгук допоможе іншим туристам. ⭐${link ? `\nЗалишити відгук: ${link}` : ""}`;
    return createNotification({
        userPhone: params.userPhone,
        tripId: params.tripId,
        tripNumber: params.tripNumber,
        type: "status_change",
        message,
        data: { type: "review_request" },
    });
}
