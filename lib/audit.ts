import { connectToDatabase } from "@/lib/mongodb";
import AuditLog from "@/models/auditLog";

export type EntityType =
    | "trip"
    | "user"
    | "article"
    | "promo-code"
    | "contact-request"
    | "notification"
    | "document"
    | "system"
    | "cashback"
    | "auth";

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

        // Strip undefined values from details to avoid BSON serialisation issues
        const rawDetails = params.details ?? {};
        const cleanDetails: Record<string, unknown> = {};
        for (const key of Object.keys(rawDetails)) {
            if (rawDetails[key] !== undefined) {
                cleanDetails[key] = rawDetails[key];
            }
        }

        await AuditLog.create({
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId ?? "",
            userId: params.userId,
            userPhone: params.userPhone ?? "",
            userName: params.userName ?? "",
            details: cleanDetails,
            ip: params.ip ?? "",
        });
    } catch (err) {
        console.error("[audit] Failed to log:", params.action, err);
    }
}
