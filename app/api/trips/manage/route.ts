import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import User from "@/models/user";
import { ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/trips/manage
 *
 * Returns all active (non-archived, non-completed) trips.
 * Admin-only endpoint (privilegeLevel >= 3).
 */
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Forbidden: No phone number in session." }, { status: 403 });
        }

        if ((session.user.privilegeLevel ?? 0) < ADMIN_PRIVILEGE_LEVEL) {
            return NextResponse.json({ message: "Forbidden: Admin access required." }, { status: 403 });
        }

        const rateLimitResult = checkRateLimit("manage-trips-list", session.user.phoneNumber, 30, 60 * 1000);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ message: "Too many requests" }, { status: 429 });
        }

        await connectToDatabase();

        const url = new URL(request.url);
        const pageParam = Number.parseInt(url.searchParams.get("page") || "1", 10);
        const limitParam = Number.parseInt(url.searchParams.get("limit") || "50", 10);
        const page = Math.max(1, Number.isNaN(pageParam) ? 1 : pageParam);
        const limit = Math.min(200, Math.max(1, Number.isNaN(limitParam) ? 50 : limitParam));
        const skip = (page - 1) * limit;

        // Active = not Completed and not Archived
        const query = {
            status: { $nin: ["Completed", "Archived"] },
        };

        const [trips, totalCount] = await Promise.all([
            Trip.find(query)
                .select("number country status managerPhone tripStartDate tripEndDate payment.totalAmount payment.paidAmount createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Trip.countDocuments(query),
        ]);

        // Collect unique manager phones and fetch names in bulk
        const managerPhones = [...new Set(
            (trips as any[]).map(t => t.managerPhone).filter(Boolean)
        )];

        const managers = managerPhones.length > 0
            ? await User.find({ phoneNumber: { $in: managerPhones } })
                  .select("phoneNumber name")
                  .lean()
            : [];

        const managerNameMap = new Map(
            (managers as any[]).map(m => [m.phoneNumber, m.name || ""])
        );

        const enrichedTrips = (trips as any[]).map(trip => ({
            ...trip,
            managerName: managerNameMap.get(trip.managerPhone) || "",
        }));

        return NextResponse.json({
            trips: enrichedTrips,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Unable to fetch active trips" }, { status: 500 });
    }
}
