import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Role from "@/models/role";
import User from "@/models/user";
import { requireSessionAccess, invalidateRoleCache } from "@/lib/role-access";
import { ACCESS_GROUPS, ALL_PAGE_SLUGS } from "@/config/access";
import { logAudit } from "@/lib/audit";

const GROUP_SLUGS = new Set(ACCESS_GROUPS.map((g) => g.slug));
const PAGE_SLUGS = new Set(ALL_PAGE_SLUGS);

/**
 * PATCH /api/roles/[slug] — rename a role and/or edit its permissions.
 * Body: { name?, description?, groups?, pageOverrides? } (all optional).
 * Rules:
 *  - system roles cannot be renamed;
 *  - the admin role's permissions are locked (edit via DB only);
 *  - custom roles can rename freely and edit all permissions.
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
    try {
        const gate = await requireSessionAccess(["users", "roles"]);
        if (!gate.ok) return gate.response;

        const { slug } = await context.params;
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ message: "Invalid body" }, { status: 400 });
        }

        await connectToDatabase();
        const role = await Role.findOne({ slug }).lean() as any;
        if (!role) {
            return NextResponse.json({ message: "Role not found" }, { status: 404 });
        }

        // Validate name (system roles keep their names).
        let newName: string | undefined;
        if (body.name !== undefined) {
            const trimmed = typeof body.name === "string" ? body.name.trim() : "";
            if (!trimmed || trimmed.length > 60) {
                return NextResponse.json({ message: "Invalid role name" }, { status: 400 });
            }
            if (role.isSystem && trimmed !== role.name) {
                return NextResponse.json({ message: "Системну роль не можна перейменувати" }, { status: 400 });
            }
            newName = trimmed;
        }

        // Validate permissions.
        let newGroups: string[] | undefined;
        if (body.groups !== undefined) {
            if (!Array.isArray(body.groups) || body.groups.some((g: unknown) => typeof g !== "string" || !GROUP_SLUGS.has(g))) {
                return NextResponse.json({ message: "Invalid permission groups" }, { status: 400 });
            }
            newGroups = [...new Set(body.groups as string[])];
        }

        let newOverrides: Record<string, boolean> | undefined;
        if (body.pageOverrides !== undefined) {
            const po = body.pageOverrides;
            if (!po || typeof po !== "object" || Array.isArray(po)) {
                return NextResponse.json({ message: "Invalid page overrides" }, { status: 400 });
            }
            for (const [page, value] of Object.entries(po as Record<string, unknown>)) {
                if (!PAGE_SLUGS.has(page) || typeof value !== "boolean") {
                    return NextResponse.json({ message: `Invalid page override: ${page}` }, { status: 400 });
                }
            }
            newOverrides = po as Record<string, boolean>;
        }

        // Admin role permissions are locked.
        const touchingPermissions = body.groups !== undefined || body.pageOverrides !== undefined;
        if (role.slug === "admin" && touchingPermissions) {
            return NextResponse.json({ message: "Права адмін-ролі налаштовуються лише вручну через базу даних" }, { status: 403 });
        }

        const description = typeof body.description === "string" ? body.description.trim() : undefined;

        await Role.updateOne(
            { slug },
            {
                ...(newName !== undefined && { name: newName }),
                ...(description !== undefined && { description }),
                ...(newGroups !== undefined && { groups: newGroups }),
                ...(newOverrides !== undefined && { pageOverrides: newOverrides }),
            }
        );

        invalidateRoleCache();
        logAudit({
            action: "role.updated",
            entityType: "role",
            entityId: slug,
            userId: gate.session.user.phoneNumber!,
            details: {
                ...(newName !== undefined && { name: newName }),
                ...(newGroups !== undefined && { groups: newGroups }),
                ...(newOverrides !== undefined && { pageOverrides: newOverrides }),
            },
        });

        return NextResponse.json({ ok: true, slug }, { status: 200 });
    } catch (error) {
        console.error("Update role error:", error);
        return NextResponse.json({ message: "Error updating role" }, { status: 500 });
    }
}

/**
 * DELETE /api/roles/[slug] — delete a custom role.
 * System roles cannot be deleted; roles still assigned to users are rejected (409).
 */
export async function DELETE(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
    try {
        const gate = await requireSessionAccess(["users", "roles"]);
        if (!gate.ok) return gate.response;

        const { slug } = await context.params;
        await connectToDatabase();

        const role = await Role.findOne({ slug }).lean() as any;
        if (!role) {
            return NextResponse.json({ message: "Role not found" }, { status: 404 });
        }
        if (role.isSystem) {
            return NextResponse.json({ message: "Системну роль не можна видалити" }, { status: 400 });
        }

        const userCount = await User.countDocuments({ role: slug });
        if (userCount > 0) {
            return NextResponse.json(
                { message: `Роль використовується ${userCount} користувачами. Спочатку змініть їхню роль.` },
                { status: 409 }
            );
        }

        await Role.deleteOne({ slug });
        invalidateRoleCache();
        logAudit({
            action: "role.deleted",
            entityType: "role",
            entityId: slug,
            userId: gate.session.user.phoneNumber!,
            details: { name: role.name },
        });

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error("Delete role error:", error);
        return NextResponse.json({ message: "Error deleting role" }, { status: 500 });
    }
}
