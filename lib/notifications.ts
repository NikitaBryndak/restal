import Notification from "@/models/notification";

interface CreateNotificationParams {
    userPhone: string;
    tripId: string;
    tripNumber: string;
    type: "document_upload" | "status_change";
    message: string;
    data?: Record<string, unknown>;
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

    return notification;
}
