import mongoose, { Schema } from "mongoose";

const emailLogSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            enum: [
                "contact_request",
                "trip_status",
                "trip_reminder_payment",
                "trip_reminder_departure",
                "cashback_credited",
            ],
        },
        to: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["sent", "failed"],
            default: "sent",
        },
        messageId: {
            type: String,
        },
        error: {
            type: String,
        },
        tripNumber: {
            type: String,
        },
    },
    { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ type: 1, createdAt: -1 });

// DEVELOPMENT: Delete cached model on hot-reload to prevent "Cannot overwrite model" errors
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.EmailLog) delete mongoose.models.EmailLog;
}

const EmailLog = mongoose.models.EmailLog || mongoose.model("EmailLog", emailLogSchema);

export default EmailLog;
