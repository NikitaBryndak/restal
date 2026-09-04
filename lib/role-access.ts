import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IRole } from "@/models/role";
import { getRoleBySlug, listAllRoles, listRolesWithCounts, invalidateRoleCache } from "@/lib/role-cache";
import { canAccessPage, hasAnyScope, allowedPagesForRole, type RolePermissions } from "./role-eval";
// Re-export the pure evaluation helpers and cached loaders so route code imports everything from one place.
export { canAccessPage, hasAnyScope, allowedPagesForRole };
export { getRoleBySlug, listAllRoles, listRolesWithCounts, invalidateRoleCache };
export type { RolePermissions };

/** Resolve the session user's role from the DB (cached). Null when unauthenticated or unknown. */
export async function getSessionRole(session: Session | null): Promise<IRole | null> {
    const slug = (session?.user as { role?: string } | undefined)?.role;
    return getRoleBySlug(slug);
}

/** Slugs of all roles that grant a given page (for "find users who can do X" queries). */
export async function getRoleSlugsGrantingPage(pageSlug: string): Promise<string[]> {
    const roles = await listAllRoles();
    return roles.filter((r) => canAccessPage(r, pageSlug)).map((r) => r.slug);
}

/**
 * One-call guard for API routes: authenticates, resolves the user's role and
 * checks it against a set of page scopes (OR semantics — access to any one
 * scope is enough, matching "this API serves those pages").
 */
export async function requireSessionAccess(scopes: string[]): Promise<
    | { ok: true; session: Session; role: IRole }
    | { ok: false; response: NextResponse }
> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phoneNumber) {
        return { ok: false, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    }
    const role = await getSessionRole(session);
    if (!role || !hasAnyScope(role, scopes)) {
        return { ok: false, response: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
    }
    return { ok: true, session, role };
}
