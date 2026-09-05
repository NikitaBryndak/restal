import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { getSessionRole, hasAnyScope, getRoleSlugsGrantingPage } from "@/lib/role-access";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/config/constants";

/**
 * GET /api/managers
 *
 * Returns a list of users whose role grants tour management.
 * Used for the manager assignment dropdown in manage-tour.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const role = await getSessionRole(session);
        if (!hasAnyScope(role, ["manage-tour"])) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const rateLimitResult = checkRateLimit("managers-list", session.user.phoneNumber, RATE_LIMITS["managers-list"].max, RATE_LIMITS["managers-list"].windowMs);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ message: "Too many requests" }, { status: 429 });
        }

        await connectToDatabase();

        const managerRoleSlugs = await getRoleSlugsGrantingPage("manage-tour");
        const managers = await User.find(
            { role: { $in: managerRoleSlugs } },
            { name: 1, phoneNumber: 1, role: 1, _id: 0 }
        )
            .sort({ name: 1 })
            .lean();

        return NextResponse.json({ managers }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Unable to fetch managers" }, { status: 500 });
    }
}
