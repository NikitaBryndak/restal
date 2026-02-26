import { connectToDatabase } from "@/lib/mongodb";
import AuditLog from "@/models/auditLog";

type EntityType = "trip" | "user" | "article" | "promo-code" | "contact-request" | "notification" | "document" | "system";

interface AuditParams {
    action: string;
    entityType: EntityType;
    entityId?: string;
    userId: string;
    userPhone?: string;
    userName?: string;
    details?: Record<string, unknown>;
    ip?: string;
}

/**
 * Log an audit event. Fire-and-forget — never throws.
 */
export async function logAudit(params: AuditParams): Promise<void> {
    try {
        await connectToDatabase();
        await AuditLog.create({
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId ?? "",
            userId: params.userId,
            userPhone: params.userPhone ?? "",
            userName: params.userName ?? "",
            details: params.details ?? {},
            ip: params.ip ?? "",
        });
    } catch {
        // Silently fail — audit should never break main flow
        console.error("[audit] Failed to log:", params.action);
    }
}
