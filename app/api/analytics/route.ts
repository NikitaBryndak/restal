import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";
import ContactRequest from "@/models/contactRequest";

// In-memory rate limiter: max 30 requests per admin per 5 minutes
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 30;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(identifier);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) return false;
    entry.count++;
    return true;
}

// Security headers for sensitive data
const SECURITY_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
};

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.phoneNumber) {
            return NextResponse.json(
                { message: "Не авторизовано" },
                { status: 401, headers: SECURITY_HEADERS }
            );
        }

        // Rate limit by phone number
        if (!checkRateLimit(session.user.phoneNumber)) {
            return NextResponse.json(
                { message: "Забагато запитів. Спробуйте пізніше." },
                { status: 429, headers: SECURITY_HEADERS }
            );
        }

        await connectToDatabase();

        const user = await User.findOne({ phoneNumber: session.user.phoneNumber }).lean() as { privilegeLevel?: number } | null;
        if (!user || (user.privilegeLevel ?? 1) < 3) {
            return NextResponse.json(
                { message: "Недостатньо прав" },
                { status: 403, headers: SECURITY_HEADERS }
            );
        }

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
        ] = await Promise.all([
            // Total counts
            Trip.countDocuments(),
            User.countDocuments(),
            ContactRequest.countDocuments(),

            // Trips grouped by status
            Trip.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),

            // Trips by country (top 10)
            Trip.aggregate([
                { $group: { _id: "$country", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),

            // Trips created over time (last 12 months)
            Trip.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
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

            // Revenue totals
            Trip.aggregate([
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

            // Recent 5 trips
            Trip.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select("number country status payment.totalAmount payment.paidAmount tripStartDate createdAt ownerPhone managerName")
                .lean(),

            // New contact requests (last 7 days)
            ContactRequest.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            }),

            // User growth (last 12 months)
            User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
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

            // Top managers by trip count
            Trip.aggregate([
                { $match: { managerName: { $ne: "" } } },
                {
                    $group: {
                        _id: "$managerName",
                        tripCount: { $sum: 1 },
                        totalRevenue: { $sum: "$payment.totalAmount" },
                    },
                },
                { $sort: { tripCount: -1 } },
                { $limit: 5 },
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

        return NextResponse.json(
            {
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
                },
                tripsByStatus,
                tripsByCountry,
                tripsOverTime: formattedTripsOverTime,
                userGrowth: formattedUserGrowth,
                recentTrips,
                topManagers,
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
