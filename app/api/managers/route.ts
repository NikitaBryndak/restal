import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { MANAGER_PRIVILEGE_LEVEL } from "@/config/constants";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/managers
 *
 * Returns a list of users with privilegeLevel >= MANAGER_PRIVILEGE_LEVEL (2).
 * Used for the manager assignment dropdown in manage-tour.
 * Accessible by managers and admins.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        if ((session.user.privilegeLevel ?? 0) < MANAGER_PRIVILEGE_LEVEL) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const rateLimitResult = checkRateLimit("managers-list", session.user.phoneNumber, 20, 60 * 1000);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ message: "Too many requests" }, { status: 429 });
        }

        await connectToDatabase();

        const managers = await User.find(
            { privilegeLevel: { $gte: MANAGER_PRIVILEGE_LEVEL } },
            { name: 1, phoneNumber: 1, privilegeLevel: 1, _id: 0 }
        )
            .sort({ name: 1 })
            .lean();

        return NextResponse.json({ managers }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Unable to fetch managers" }, { status: 500 });
    }
}
