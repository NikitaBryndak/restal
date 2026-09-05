import mongoose, { Schema } from "mongoose";

/**
 * Telegram message log — every incoming and outgoing bot message.
 * Collection: `messagelogs`. Mirrors the emaillogs pattern (fire-and-forget
 * writes, never block or fail the send path on a logging error).
 */
const messageLogSchema = new Schema(
    {
        direction: {
            type: String,
            required: true,
            enum: ["in", "out"],
        },
        chatId: {
            type: Number,
            required: true, // Telegram chat id of the peer
        },
        username: {
            type: String,
            required: false, // Telegram @username when known
        },
        userPhone: {
            type: String,
            required: false, // matched Restal account (null = unbound/unknown chat)
        },
        text: {
            type: String,
            default: "", // message body exactly as delivered (HTML markup for outgoing)
        },
        type: {
            type: String,
            required: true,
            enum: [
                "trip_status",
                "document_upload",
                "reminder_payment",
                "reminder_departure",
                "cashback_credited",
                "trip_created",
                "incoming",
                "bind", // one-time bind code accepted — chat linked to a user
                "other",
            ],
        },
        messageId: {
            type: String, // Telegram message_id (stringified) when available
            required: false,
        },
        status: {
            type: String,
            enum: ["sent", "failed"],
            default: "sent",
        },
        error: {
            type: String,
            required: false,
        },
        tripNumber: {
            type: String,
            required: false,
        },
    },
    { timestamps: true }
);

messageLogSchema.index({ createdAt: -1 });
messageLogSchema.index({ chatId: 1, createdAt: -1 });
messageLogSchema.index({ userPhone: 1, createdAt: -1 });

// DEVELOPMENT: Delete cached model on hot-reload to prevent "Cannot overwrite model" errors
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.MessageLog) delete mongoose.models.MessageLog;
}

const MessageLog = mongoose.models.MessageLog || mongoose.model("MessageLog", messageLogSchema);

export default MessageLog;
