import mongoose, { Schema } from "mongoose";

const contactRequestSchema = new Schema({
    // Source: "contact" (contact page), "manager" (managers page consultation), "tour", or "ai-trip-plan"
    source: {
        type: String,
        enum: ["contact", "manager", "tour", "ai-trip-plan"],
        required: true,
    },
    // Contact info
    firstName: {
        type: String,
        required: false,
        trim: true,
    },
    lastName: {
        type: String,
        required: false,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: false,
        trim: true,
    },
    // For manager consultation requests
    managerName: {
        type: String,
        required: false,
        trim: true,
    },
    // Status tracking
    status: {
        type: String,
        enum: ["new", "in_progress", "completed", "dismissed"],
        default: "new",
    },
    // Admin notes
    adminNote: {
        type: String,
        default: "",
    },
    // Timestamp when the request was first responded to (status changed from "new")
    respondedAt: {
        type: Date,
        default: null,
    },
    // IP for rate limiting
    ip: {
        type: String,
        required: false,
    },
}, { timestamps: true });

contactRequestSchema.index({ status: 1, createdAt: -1 });
contactRequestSchema.index({ ip: 1, createdAt: -1 });

const ContactRequest = mongoose.models.ContactRequest || mongoose.model("ContactRequest", contactRequestSchema);

export default ContactRequest;
