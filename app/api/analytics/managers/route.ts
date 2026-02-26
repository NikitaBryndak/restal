import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import TripModel from "@/models/trip";
import UserModel from "@/models/user";
import { ADMIN_PRIVILEGE_LEVEL, MANAGER_PRIVILEGE_LEVEL } from "@/config/constants";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const privilegeLevel = session.user.privilegeLevel ?? 1;
        if (privilegeLevel < ADMIN_PRIVILEGE_LEVEL) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Rate limit
        const rateLimitResult = checkRateLimit("manager-perf", session.user.phoneNumber, 20, 5 * 60 * 1000);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        await connectToDatabase();

        // Get all managers
        const managers = await UserModel.find(
            { privilegeLevel: { $gte: MANAGER_PRIVILEGE_LEVEL } },
            { name: 1, phoneNumber: 1, privilegeLevel: 1 }
        ).lean();

        // Get all trips with manager info
        const trips = await TripModel.find(
            {},
            {
                managerPhone: 1,
                status: 1,
                payment: 1,
                country: 1,
                createdAt: 1,
                cashbackAmount: 1,
            }
        ).lean();

        // Build per-manager stats
        const managerStats = managers.map((manager: any) => {
            const managerTrips = trips.filter(
                (t: any) => t.managerPhone === manager.phoneNumber
            );

            const totalTrips = managerTrips.length;
            const completedTrips = managerTrips.filter(
                (t: any) => t.status === "Completed" || t.status === "Archived"
            ).length;
            const activeTrips = managerTrips.filter(
                (t: any) => t.status !== "Completed" && t.status !== "Archived"
            ).length;
            const totalRevenue = managerTrips.reduce(
                (sum: number, t: any) => sum + (t.payment?.totalAmount || 0),
                0
            );
            const totalPaid = managerTrips.reduce(
                (sum: number, t: any) => sum + (t.payment?.paidAmount || 0),
                0
            );

            // Status breakdown
            const statusBreakdown: Record<string, number> = {};
            managerTrips.forEach((t: any) => {
                const s = t.status || "In Booking";
                statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
            });

            // Country breakdown (top 5)
            const countryMap: Record<string, number> = {};
            managerTrips.forEach((t: any) => {
                if (t.country) {
                    countryMap[t.country] = (countryMap[t.country] || 0) + 1;
                }
            });
            const topCountries = Object.entries(countryMap)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([country, count]) => ({ country, count }));

            // Monthly trend (last 6 months)
            const monthlyTrend: { month: string; count: number; revenue: number }[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const year = date.getFullYear();
                const month = date.getMonth();
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 1);

                const monthTrips = managerTrips.filter((t: any) => {
                    const created = new Date(t.createdAt);
                    return created >= monthStart && created < monthEnd;
                });

                monthlyTrend.push({
                    month: `${String(month + 1).padStart(2, "0")}/${year}`,
                    count: monthTrips.length,
                    revenue: monthTrips.reduce(
                        (sum: number, t: any) => sum + (t.payment?.totalAmount || 0),
                        0
                    ),
                });
            }

            return {
                name: manager.name || "Без імені",
                phone: manager.phoneNumber,
                isAdmin: manager.privilegeLevel >= ADMIN_PRIVILEGE_LEVEL,
                totalTrips,
                completedTrips,
                activeTrips,
                totalRevenue,
                totalPaid,
                conversionRate: totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0,
                avgDealSize: totalTrips > 0 ? Math.round(totalRevenue / totalTrips) : 0,
                statusBreakdown,
                topCountries,
                monthlyTrend,
            };
        });

        // Sort by total revenue descending
        managerStats.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

        return NextResponse.json({ managers: managerStats });
    } catch (error) {
        console.error("Manager performance API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
