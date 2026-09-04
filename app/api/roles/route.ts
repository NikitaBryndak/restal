import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Role from "@/models/role";
import { requireSessionAccess, listRolesWithCounts, invalidateRoleCache } from "@/lib/role-access";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/roles — all roles with user counts (requires users or roles page scope).
 */
export async function GET() {
    try {
        const gate = await requireSessionAccess(["users", "roles"]);
        if (!gate.ok) return gate.response;

        await connectToDatabase();
        const roles = await listRolesWithCounts();
        return NextResponse.json({ roles }, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Error fetching roles" }, { status: 500 });
    }
}

// Ukrainian -> Latin transliteration for auto-generated role slugs.
const TRANSLIT: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh", з: "z",
    и: "y", і: "i", ї: "ii", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
    р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
    щ: "shch", ь: "", ю: "yu", я: "ya",
};

function slugifyRoleName(name: string): string {
    const transliterated = name
        .toLowerCase()
        .split("")
        .map((ch) => TRANSLIT[ch] ?? ch)
        .join("");
    return (
        transliterated
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40) || "role"
    );
}

/**
 * POST /api/roles — create a custom role (requires users or roles page scope).
 * Body: { name: string, slug?: string }
 * New roles start with the client group enabled so assigned users keep cabinet access.
 */
export async function POST(request: NextRequest) {
    try {
        const gate = await requireSessionAccess(["users", "roles"]);
        if (!gate.ok) return gate.response;

        const body = await request.json().catch(() => null);
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        if (!name || name.length > 60) {
            return NextResponse.json({ message: "Invalid role name" }, { status: 400 });
        }

        await connectToDatabase();

        let slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
        if (slug && !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) {
            return NextResponse.json({ message: "Invalid slug: use lowercase letters, digits and dashes" }, { status: 400 });
        }

        const existing = await Role.find().select("slug").lean();
        const takenSlugs = new Set(existing.map((r) => r.slug));
        if (!slug || takenSlugs.has(slug)) {
            slug = slugifyRoleName(name);
            let candidate = slug;
            let n = 2;
            while (takenSlugs.has(candidate)) {
                candidate = `${slug}-${n}`;
                n += 1;
            }
            slug = candidate;
        }

        const role = await Role.create({
            slug,
            name,
            isSystem: false,
            groups: ["client"],
            pageOverrides: {},
        });

        invalidateRoleCache();
        logAudit({
            action: "role.created",
            entityType: "role",
            entityId: role.slug,
            userId: gate.session.user.phoneNumber!,
            details: { name },
        });

        return NextResponse.json({ ok: true, slug, name }, { status: 201 });
    } catch (error) {
        console.error("Create role error:", error);
        return NextResponse.json({ message: "Error creating role" }, { status: 500 });
    }
}
