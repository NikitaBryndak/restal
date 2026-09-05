import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import JobRun from "@/models/jobRun";
import { getSessionRole, hasAnyScope } from "@/lib/role-access";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/config/constants";

/**
 * GET /api/cron-runs — recent cron job executions (admin only).
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = await getSessionRole(session);
        if (!hasAnyScope(role, ["cron"])) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const rateLimitResult = checkRateLimit(
            "cron-runs",
            session.user.phoneNumber,
            RATE_LIMITS["cron-runs"].max,
            RATE_LIMITS["cron-runs"].windowMs,
        );
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        await connectToDatabase();

        const runs = await JobRun.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return NextResponse.json({
            runs: runs.map((r) => ({
                _id: String(r._id),
                job: r.job,
                status: r.status,
                summary: r.summary ?? {},
                errors: r.errors ?? [],
                durationMs: r.durationMs ?? 0,
                createdAt: r.createdAt,
            })),
        });
    } catch (err) {
        console.error("GET /api/cron-runs error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
