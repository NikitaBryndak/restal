
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import AuditLog from "@/models/auditLog";
import { ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if ((session.user.privilegeLevel ?? 1) < ADMIN_PRIVILEGE_LEVEL) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const rateLimitResult = checkRateLimit(
            "audit-log",
            session.user.phoneNumber,
            30,
            5 * 60 * 1000,
        );
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: "Too many requests" },
                { status: 429 },
            );
        }

        await connectToDatabase();

        const { searchParams } = request.nextUrl;
        const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10));
        const limit = Math.min(
            100,
            Math.max(1, Number.parseInt(searchParams.get("limit") ?? "50", 10)),
        );
        const entityType = searchParams.get("entityType") || "";
        const action = searchParams.get("action") || "";
        const userId = searchParams.get("userId") || "";
        const from = searchParams.get("from") || "";
        const to = searchParams.get("to") || "";

        const filter: Record<string, unknown> = {};

        if (entityType) filter.entityType = entityType;
        if (action) filter.action = { $regex: action, $options: "i" };
        if (userId) filter.userId = userId;

        if (from || to) {
            const dateFilter: Record<string, Date> = {};
            if (from) dateFilter.$gte = new Date(from);
            if (to) dateFilter.$lte = new Date(to);
            filter.createdAt = dateFilter;
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(filter),
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        console.error("[audit-log] GET error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
