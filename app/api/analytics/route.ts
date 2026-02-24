import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";
import ContactRequest from "@/models/contactRequest";
import { ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import { checkRateLimit } from "@/lib/rate-limit";

// Security headers for sensitive data
const SECURITY_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
};

const ALLOWED_PERIODS = ["7d", "30d", "90d", "12m", "all"] as const;
type Period = typeof ALLOWED_PERIODS[number];

/** Returns { periodStart, previousPeriodStart, previousPeriodEnd } for a given period string */
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
            periodStart = null;
            previousPeriodStart = null;
            break;
    }

    return {
        periodStart,
        previousPeriodStart,
        previousPeriodEnd: periodStart, // previous period ends where current begins
    };
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.phoneNumber) {
            return NextResponse.json(
                { message: "Не авторизовано" },
                { status: 401, headers: SECURITY_HEADERS }
            );
        }

        // Rate limit by phone number (max 30 per 5 min)
        const rl = checkRateLimit("analytics", session.user.phoneNumber, 30, 5 * 60 * 1000);
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

        // Parse period from query params
        const { searchParams } = new URL(request.url);
        const rawPeriod = searchParams.get("period") || "all";
        const period: Period = ALLOWED_PERIODS.includes(rawPeriod as Period) ? (rawPeriod as Period) : "all";
        const { periodStart, previousPeriodStart, previousPeriodEnd } = getPeriodDates(period);

        const dateFilter = periodStart ? { createdAt: { $gte: periodStart } } : {};
        const prevDateFilter = previousPeriodStart && previousPeriodEnd
            ? { createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } }
            : {};

        // Determine chart time range (use period for shorter ranges, last 12 months for "all")
        const chartDateStart = periodStart || new Date(new Date().setMonth(new Date().getMonth() - 12));

        // Run all queries in parallel
        const [
            totalTrips,
            totalUsers,
            totalContactRequests,
            tripsByStatus,
            tripsByCountry,
            tripsOverTime,
            revenueData,
            recentTrips,
            newContactRequests,
            userGrowth,
            topManagers,
            // Previous period data for comparison
            prevTrips,
            prevUsers,
            prevContactRequests,
            prevRevenueData,
            // Conversion funnel data
            conversionFunnel,
            // Avg response time
            avgResponseTimeData,
        ] = await Promise.all([
            // Total counts (filtered by period)
            Trip.countDocuments(dateFilter),
            User.countDocuments(dateFilter),
            ContactRequest.countDocuments(dateFilter),

            // Trips grouped by status (filtered)
            Trip.aggregate([
                ...(periodStart ? [{ $match: { createdAt: { $gte: periodStart } } }] : []),
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),

            // Trips by country (top 10, filtered)
            Trip.aggregate([
                ...(periodStart ? [{ $match: { createdAt: { $gte: periodStart } } }] : []),
                { $group: { _id: "$country", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),

            // Trips created over time
            Trip.aggregate([
                {
                    $match: {
                        createdAt: { $gte: chartDateStart },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                        },
                        count: { $sum: 1 },
                        revenue: { $sum: "$payment.totalAmount" },
                        paid: { $sum: "$payment.paidAmount" },
                    },
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
            ]),

            // Revenue totals (filtered)
            Trip.aggregate([
                ...(periodStart ? [{ $match: { createdAt: { $gte: periodStart } } }] : []),
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$payment.totalAmount" },
                        totalPaid: { $sum: "$payment.paidAmount" },
                        totalCashback: { $sum: "$cashbackAmount" },
                        avgTripValue: { $avg: "$payment.totalAmount" },
                    },
                },
            ]),

            // Recent 10 trips
            Trip.find(dateFilter)
                .sort({ createdAt: -1 })
                .limit(10)
                .select("number country status payment.totalAmount payment.paidAmount tripStartDate createdAt ownerPhone managerName")
                .lean(),

            // New contact requests (last 7 days)
            ContactRequest.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            }),

            // User growth
            User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: chartDateStart },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
            ]),

            // Top managers by trip count (filtered)
            Trip.aggregate([
                ...(periodStart ? [{ $match: { createdAt: { $gte: periodStart }, managerName: { $ne: "" } } }] : [{ $match: { managerName: { $ne: "" } } }]),
                {
                    $group: {
                        _id: "$managerName",
                        tripCount: { $sum: 1 },
                        totalRevenue: { $sum: "$payment.totalAmount" },
                        totalPaid: { $sum: "$payment.paidAmount" },
                    },
                },
                { $sort: { tripCount: -1 } },
                { $limit: 5 },
            ]),

            // ── Previous period comparison queries ──
            previousPeriodStart && previousPeriodEnd
                ? Trip.countDocuments(prevDateFilter)
                : Promise.resolve(0),
            previousPeriodStart && previousPeriodEnd
                ? User.countDocuments(prevDateFilter)
                : Promise.resolve(0),
            previousPeriodStart && previousPeriodEnd
                ? ContactRequest.countDocuments(prevDateFilter)
                : Promise.resolve(0),
            previousPeriodStart && previousPeriodEnd
                ? Trip.aggregate([
                    { $match: { createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } } },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: "$payment.totalAmount" },
                            totalPaid: { $sum: "$payment.paidAmount" },
                            avgTripValue: { $avg: "$payment.totalAmount" },
                        },
                    },
                ])
                : Promise.resolve([]),

            // Conversion funnel
            Trip.aggregate([
                ...(periodStart ? [{ $match: { createdAt: { $gte: periodStart } } }] : []),
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        totalRevenue: { $sum: "$payment.totalAmount" },
                    },
                },
            ]),

            // Average response time for contact requests (ms between createdAt and respondedAt)
            ContactRequest.aggregate([
                {
                    $match: {
                        respondedAt: { $ne: null },
                        ...(periodStart ? { createdAt: { $gte: periodStart } } : {}),
                    },
                },
                {
                    $project: {
                        responseTimeMs: { $subtract: ["$respondedAt", "$createdAt"] },
                    },
                },
                {
                    $group: {
                        _id: null,
                        avgResponseTimeMs: { $avg: "$responseTimeMs" },
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const monthNames = [
            "Січ", "Лют", "Бер", "Кві", "Тра", "Чер",
            "Лип", "Сер", "Вер", "Жов", "Лис", "Гру",
        ];

        const formattedTripsOverTime = tripsOverTime.map((item: { _id: { month: number; year: number }; count: number; revenue: number; paid: number }) => ({
            month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
            count: item.count,
            revenue: item.revenue,
            paid: item.paid,
        }));

        const formattedUserGrowth = userGrowth.map((item: { _id: { month: number; year: number }; count: number }) => ({
            month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
            count: item.count,
        }));

        const revenue = revenueData[0] || {
            totalRevenue: 0,
            totalPaid: 0,
            totalCashback: 0,
            avgTripValue: 0,
        };

        const prevRevenue = (prevRevenueData as { totalRevenue: number; totalPaid: number; avgTripValue: number }[])[0] || {
            totalRevenue: 0,
            totalPaid: 0,
            avgTripValue: 0,
        };

        // Calculate percentage changes
        function calcChange(current: number, previous: number): number | null {
            if (!previousPeriodStart || previous === 0) return null;
            return Math.round(((current - previous) / previous) * 100);
        }

        // Build conversion funnel
        const funnelOrder = ["In Booking", "Booked", "Paid", "In Progress", "Completed", "Archived"];
        const funnelData = funnelOrder.map((status) => {
            const found = (conversionFunnel as { _id: string; count: number; totalRevenue: number }[]).find((f) => f._id === status);
            return {
                status,
                count: found?.count || 0,
                revenue: found?.totalRevenue || 0,
            };
        });

        const collectionRate = revenue.totalRevenue > 0
            ? Math.round((revenue.totalPaid / revenue.totalRevenue) * 100)
            : 0;

        // Average response time in minutes
        const avgResponseRaw = (avgResponseTimeData as { avgResponseTimeMs: number; count: number }[])[0];
        const avgResponseTimeMinutes = avgResponseRaw
            ? Math.round(avgResponseRaw.avgResponseTimeMs / 60000)
            : null;
        const respondedCount = avgResponseRaw?.count || 0;

        return NextResponse.json(
            {
                period,
                overview: {
                    totalTrips,
                    totalUsers,
                    totalContactRequests,
                    newContactRequests,
                    totalRevenue: revenue.totalRevenue,
                    totalPaid: revenue.totalPaid,
                    totalCashback: revenue.totalCashback,
                    avgTripValue: Math.round(revenue.avgTripValue || 0),
                    outstandingPayments: revenue.totalRevenue - revenue.totalPaid,
                    collectionRate,
                    avgResponseTimeMinutes,
                    respondedCount,
                },
                comparison: previousPeriodStart ? {
                    trips: calcChange(totalTrips, prevTrips as number),
                    users: calcChange(totalUsers, prevUsers as number),
                    contactRequests: calcChange(totalContactRequests, prevContactRequests as number),
                    revenue: calcChange(revenue.totalRevenue, prevRevenue.totalRevenue),
                    paid: calcChange(revenue.totalPaid, prevRevenue.totalPaid),
                    avgTripValue: calcChange(Math.round(revenue.avgTripValue || 0), Math.round(prevRevenue.avgTripValue || 0)),
                } : null,
                tripsByStatus,
                tripsByCountry,
                tripsOverTime: formattedTripsOverTime,
                userGrowth: formattedUserGrowth,
                recentTrips,
                topManagers,
                conversionFunnel: funnelData,
            },
            { headers: SECURITY_HEADERS }
        );
    } catch (error) {
        console.error("Analytics API error:", error);
        return NextResponse.json(
            { message: "Помилка сервера" },
            { status: 500, headers: SECURITY_HEADERS }
        );
    }
}
