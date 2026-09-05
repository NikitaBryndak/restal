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
