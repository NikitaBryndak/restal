import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionRole, hasAnyScope, listAllRoles } from "@/lib/role-access";
import { logAudit } from "@/lib/audit";

async function requireUsersAccess() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phoneNumber) {
        return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    }
    const role = await getSessionRole(session);
    if (!hasAnyScope(role, ["users"])) {
        return { error: NextResponse.json({ message: "Forbidden: access to the users page required" }, { status: 403 }) };
    }
    return { session };
}

/**
 * GET /api/users/roles — list users with their roles (requires the users page scope).
 * Query params: page (default 1), search (case-insensitive match on name or phone,
 * applied to the full user base before pagination). Fixed page size of 50.
 */
const PAGE_SIZE = 50;

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
    try {
        const auth = await requireUsersAccess();
        if (auth.error) return auth.error;

        const pageParam = Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
        const page = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;
        const search = (request.nextUrl.searchParams.get("search") ?? "").trim();

        await connectToDatabase();
        const filter: Record<string, unknown> = {};
        if (search) {
            const rx = new RegExp(escapeRegex(search), "i");
            filter.$or = [{ name: rx }, { phoneNumber: rx }];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("name phoneNumber role createdAt")
                .sort({ name: 1 })
                .skip((page - 1) * PAGE_SIZE)
                .limit(PAGE_SIZE)
                .lean(),
            User.countDocuments(filter),
        ]);

        // Attach the display name of each user's role (cached lookup).
        const roles = await listAllRoles();
        const roleNameBySlug: Record<string, string> = {};
        for (const r of roles) roleNameBySlug[r.slug] = r.name;
        const usersWithRoleName = (users as Array<Record<string, unknown>>).map((u) => ({
            ...u,
            role: u.role ?? "client",
            roleName: roleNameBySlug[String(u.role)] ?? String(u.role),
        }));

        return NextResponse.json({ users: usersWithRoleName, total, page, pageSize: PAGE_SIZE }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Error fetching users" }, { status: 500 });
    }
}

/**
 * PATCH /api/users/roles — change a user's role (requires the users page scope).
 * Body: { phone: string, role: string } — role is an existing role slug.
 * Self-modification is rejected to prevent admin lockout.
 */
export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireUsersAccess();
        if (auth.error) return auth.error;
        const session = auth.session!;

        const body = await request.json().catch(() => null);
        const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
        const roleSlug = typeof body?.role === "string" ? body.role.trim().toLowerCase() : "";

        if (!phone || !roleSlug) {
            return NextResponse.json({ message: "Invalid phone or role" }, { status: 400 });
        }
        if (phone === session.user.phoneNumber) {
            return NextResponse.json({ message: "You cannot change your own role" }, { status: 400 });
        }

        await connectToDatabase();
        const roles = await listAllRoles();
        const targetRole = roles.find((r) => r.slug === roleSlug);
        if (!targetRole) {
            return NextResponse.json({ message: "Unknown role" }, { status: 400 });
        }

        const user = await User.findOne({ phoneNumber: phone });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const prevRole = user.role ?? "client";
        if (prevRole !== roleSlug) {
            user.role = roleSlug;
            await user.save();

            logAudit({
                action: "user.role.changed",
                entityType: "user",
                entityId: String(user._id),
                userId: session.user.phoneNumber,
                details: { targetPhone: phone, from: prevRole, to: roleSlug },
            });
        }

        return NextResponse.json({ ok: true, role: roleSlug, roleName: targetRole.name }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Error updating user role" }, { status: 500 });
    }
}
