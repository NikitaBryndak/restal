import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
    // User who receives the notification (by phone number)
    userPhone: {
        type: String,
        required: true,
        index: true,
    },
    // Reference to the trip
    tripId: {
        type: Schema.Types.ObjectId,
        ref: 'Trip',
        required: true,
    },
    tripNumber: {
        type: String,
        required: true,
    },
    // Type of notification
    type: {
        type: String,
        enum: ['document_upload', 'status_change'],
        required: true,
    },
    // Notification message
    message: {
        type: String,
        required: true,
    },
    // Additional data (e.g., document name, old/new status)
    data: {
        type: Schema.Types.Mixed,
        default: {},
    },
    // Read status
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Index for efficient queries
notificationSchema.index({ userPhone: 1, read: 1, createdAt: -1 });

// DEVELOPMENT: Delete cached model on hot-reload to prevent "Cannot overwrite model" errors
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.Notification) delete mongoose.models.Notification;
}

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
