import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema({
    action: {
        type: String,
        required: true,
        index: true,
    },
    entityType: {
        type: String,
        required: true,
        enum: ["trip", "user", "article", "promo-code", "contact-request", "notification", "document", "system"],
        index: true,
    },
    entityId: {
        type: String,
        default: "",
    },
    userId: {
        type: String,
        required: true,
        index: true,
    },
    userPhone: {
        type: String,
        default: "",
    },
    userName: {
        type: String,
        default: "",
    },
    details: {
        type: Schema.Types.Mixed,
        default: {},
    },
    ip: {
        type: String,
        default: "",
    },
}, {
    timestamps: true,
});

// Compound indexes for common queries
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
