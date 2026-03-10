import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import ContactRequest from "@/models/contactRequest";
import { ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import { checkRateLimit } from "@/lib/rate-limit";

const SECURITY_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
};

const ALLOWED_PERIODS = ["7d", "30d", "90d", "12m", "all"] as const;
type Period = (typeof ALLOWED_PERIODS)[number];

function getPeriodDates(period: Period) {
    const now = new Date();
    let periodStart: Date | null = null;
    let previousPeriodStart: Date | null = null;

    switch (period) {
        case "7d":
            periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            break;
        case "30d":
            periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
            break;
        case "90d":
            periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            previousPeriodStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
        case "12m":
            periodStart = new Date(new Date().setMonth(now.getMonth() - 12));
            previousPeriodStart = new Date(new Date().setMonth(now.getMonth() - 24));
            break;
        case "all":
        default:
            break;
    }

    return {
        periodStart,
        previousPeriodStart,
        previousPeriodEnd: periodStart,
    };
}

/**
 * GET /api/analytics/requests
 * Admin-only endpoint returning contact request analytics by source type.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.phoneNumber) {
            return NextResponse.json(
                { message: "Не авторизовано" },
                { status: 401, headers: SECURITY_HEADERS }
            );
        }

        const rl = checkRateLimit("analytics-requests", session.user.phoneNumber, 20, 5 * 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json(
                { message: "Забагато запитів. Спробуйте пізніше." },
                { status: 429, headers: { ...SECURITY_HEADERS, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
            );
        }

        await connectToDatabase();

        const user = await User.findOne({ phoneNumber: session.user.phoneNumber }).lean() as { privilegeLevel?: number } | null;
        if (!user || (user.privilegeLevel ?? 1) < ADMIN_PRIVILEGE_LEVEL) {
            return NextResponse.json(
                { message: "Недостатньо прав" },
                { status: 403, headers: SECURITY_HEADERS }
            );
        }

        const { searchParams } = new URL(request.url);
        const rawPeriod = searchParams.get("period") || "all";
        const period: Period = ALLOWED_PERIODS.includes(rawPeriod as Period) ? (rawPeriod as Period) : "all";
        const { periodStart, previousPeriodStart, previousPeriodEnd } = getPeriodDates(period);

        const dateFilter = periodStart ? { createdAt: { $gte: periodStart } } : {};
        const prevDateFilter = previousPeriodStart && previousPeriodEnd
            ? { createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } }
            : {};
        const chartDateStart = periodStart || new Date(new Date().setMonth(new Date().getMonth() - 12));

        const [
            bySource,
            byStatus,
            bySourceStatus,
            overTime,
            avgResponseBySource,
            totalCurrent,
            totalPrevious,
        ] = await Promise.all([
            // Requests grouped by source
            ContactRequest.aggregate([
                ...(periodStart ? [{ $match: { createdAt: { $gte: periodStart } } }] : []),
                { $group: { _id: "$source", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),

            // Requests grouped by status
            ContactRequest.aggregate([
                ...(periodStart ? [{ $match: { createdAt: { $gte: periodStart } } }] : []),
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),

            // Cross-tab: source × status
            ContactRequest.aggregate([
                ...(periodStart ? [{ $match: { createdAt: { $gte: periodStart } } }] : []),
                {
                    $group: {
                        _id: { source: "$source", status: "$status" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { "_id.source": 1, "_id.status": 1 } },
            ]),

            // Requests over time grouped by source
            ContactRequest.aggregate([
                { $match: { createdAt: { $gte: chartDateStart } } },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                            source: "$source",
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
            ]),

            // Average response time by source
            ContactRequest.aggregate([
                {
                    $match: {
                        respondedAt: { $ne: null },
                        ...(periodStart ? { createdAt: { $gte: periodStart } } : {}),
                    },
                },
                {
                    $project: {
                        source: 1,
                        responseTimeMs: { $subtract: ["$respondedAt", "$createdAt"] },
                    },
                },
                {
                    $group: {
                        _id: "$source",
                        avgResponseTimeMs: { $avg: "$responseTimeMs" },
                        count: { $sum: 1 },
                    },
                },
            ]),

            // Total current period
            ContactRequest.countDocuments(dateFilter),

            // Total previous period
            previousPeriodStart && previousPeriodEnd
                ? ContactRequest.countDocuments(prevDateFilter)
                : Promise.resolve(0),
        ]);

        const monthNames = [
            "Січ", "Лют", "Бер", "Кві", "Тра", "Чер",
            "Лип", "Сер", "Вер", "Жов", "Лис", "Гру",
        ];

        // Format over-time data: group by month with per-source counts
        const timeMap = new Map<string, { month: string; contact: number; manager: number; tour: number; "ai-trip-plan": number; total: number }>();
        for (const item of overTime as { _id: { year: number; month: number; source: string }; count: number }[]) {
            const key = `${item._id.year}-${item._id.month}`;
            const label = `${monthNames[item._id.month - 1]} ${item._id.year}`;
            if (!timeMap.has(key)) {
                timeMap.set(key, { month: label, contact: 0, manager: 0, tour: 0, "ai-trip-plan": 0, total: 0 });
            }
            const entry = timeMap.get(key)!;
            const source = item._id.source as keyof typeof entry;
            if (source in entry && source !== "month" && source !== "total") {
                (entry[source] as number) += item.count;
            }
            entry.total += item.count;
        }
        const requestsOverTime = Array.from(timeMap.values());

        // Format source-status cross-tab
        const sourceStatusMap = new Map<string, { source: string; new: number; in_progress: number; completed: number; dismissed: number; total: number }>();
        for (const item of bySourceStatus as { _id: { source: string; status: string }; count: number }[]) {
            const src = item._id.source;
            if (!sourceStatusMap.has(src)) {
                sourceStatusMap.set(src, { source: src, new: 0, in_progress: 0, completed: 0, dismissed: 0, total: 0 });
            }
            const entry = sourceStatusMap.get(src)!;
            const status = item._id.status as keyof typeof entry;
            if (status in entry && status !== "source" && status !== "total") {
                (entry[status] as number) += item.count;
            }
            entry.total += item.count;
        }
        const sourceStatusData = Array.from(sourceStatusMap.values());

        // Format avg response time by source
        const responseTimeBySource = (avgResponseBySource as { _id: string; avgResponseTimeMs: number; count: number }[]).map((item) => ({
            source: item._id,
            avgMinutes: Math.round(item.avgResponseTimeMs / 60000),
            count: item.count,
        }));

        // Comparison
        function calcChange(current: number, previous: number): number | null {
            if (!previousPeriodStart || previous === 0) return null;
            return Math.round(((current - previous) / previous) * 100);
        }

        return NextResponse.json(
            {
                period,
                total: totalCurrent,
                comparison: calcChange(totalCurrent, totalPrevious),
                bySource: bySource as { _id: string; count: number }[],
                byStatus: byStatus as { _id: string; count: number }[],
                sourceStatus: sourceStatusData,
                overTime: requestsOverTime,
                responseTimeBySource,
            },
            { headers: SECURITY_HEADERS }
        );
    } catch (error) {
        console.error("Analytics requests API error:", error);
        return NextResponse.json(
            { message: "Помилка сервера" },
            { status: 500, headers: SECURITY_HEADERS }
        );
    }
}
