import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CLIENT_PRIVILEGE_LEVEL, ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import { logAudit } from "@/lib/audit";

const VALID_LEVELS = [1, 2, 3, 4]; // CLIENT..ADMIN — mirrors config/access.ts RoleLevel

async function requireAdmin() {
    const session = (await getServerSession(authOptions as any) as any);
    if (!session) {
        return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    }
    if ((session.user.privilegeLevel ?? 1) < ADMIN_PRIVILEGE_LEVEL) {
        return { error: NextResponse.json({ message: "Forbidden: admin access required" }, { status: 403 }) };
    }
    return { session };
}

/**
 * GET /api/users/roles — list users with their roles (admin only).
 */
export async function GET() {
    try {
        const auth = await requireAdmin();
        if (auth.error) return auth.error;

        await connectToDatabase();
        const users = await User.find()
            .select("name phoneNumber privilegeLevel createdAt")
            .sort({ name: 1 })
            .limit(500)
            .lean();

        return NextResponse.json({ users }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Error fetching users" }, { status: 500 });
    }
}

/**
 * PATCH /api/users/roles — change a user's role (admin only).
 * Body: { phone: string, privilegeLevel: number }
 * Self-modification is rejected to prevent admin lockout.
 */
export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return auth.error;
        const session = auth.session!;

        const body = await request.json().catch(() => null);
        const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
        const level = Number(body?.privilegeLevel);

        if (!phone || !VALID_LEVELS.includes(level)) {
            return NextResponse.json({ message: "Invalid phone or privilegeLevel" }, { status: 400 });
        }
        if (phone === session.user.phoneNumber) {
            return NextResponse.json({ message: "You cannot change your own role" }, { status: 400 });
        }

        await connectToDatabase();
        const user = await User.findOne({ phoneNumber: phone });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const prevLevel = user.privilegeLevel ?? CLIENT_PRIVILEGE_LEVEL;
        if (prevLevel === level) {
            return NextResponse.json({ ok: true, privilegeLevel: level }, { status: 200 });
        }

        user.privilegeLevel = level;
        await user.save();

        logAudit({
            action: "user.role.changed",
            entityType: "user",
            entityId: String(user._id),
            userId: session.user.phoneNumber,
            details: { targetPhone: phone, from: prevLevel, to: level },
        });

        return NextResponse.json({ ok: true, privilegeLevel: level }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Error updating user role" }, { status: 500 });
    }
}
