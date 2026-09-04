import Role, { IRole } from "@/models/role";
import User from "@/models/user";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * In-memory cache of all roles. Vercel serverless instances are short-lived,
 * so a plain TTL cache is safe: permission changes propagate within the TTL
 * (or immediately on the instance that made the change via invalidateRoleCache).
 */
const ROLE_CACHE_TTL_MS = 30_000;

let roleCache: { at: number; bySlug: Record<string, IRole> } | null = null;

/** Drop the cache — call after any role mutation. */
export function invalidateRoleCache(): void {
    roleCache = null;
}

async function loadRoles(): Promise<Record<string, IRole>> {
    const now = Date.now();
    if (roleCache && now - roleCache.at < ROLE_CACHE_TTL_MS) {
        return roleCache.bySlug;
    }
    await connectToDatabase();
    const docs = (await Role.find().lean()) as unknown as IRole[];
    const bySlug: Record<string, IRole> = {};
    for (const d of docs) bySlug[d.slug] = d;
    roleCache = { at: now, bySlug };
    return bySlug;
}

/** Resolve a single role by slug (cached). Null if unknown. */
export async function getRoleBySlug(slug: string | null | undefined): Promise<IRole | null> {
    if (!slug) return null;
    const bySlug = await loadRoles();
    return bySlug[slug.toLowerCase()] ?? null;
}

/** All roles (cached), no user counts — for permission queries like "which roles grant page X". */
export async function listAllRoles(): Promise<IRole[]> {
    return Object.values(await loadRoles());
}

/** All roles with the number of users assigned to each (for admin UIs). */
export async function listRolesWithCounts(): Promise<Array<IRole & { userCount: number }>> {
    const bySlug = await loadRoles();
    await connectToDatabase();
    const counts = await User.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    const countBySlug: Record<string, number> = {};
    for (const c of counts) countBySlug[String(c._id)] = c.count;
    return Object.values(bySlug).map((r) => ({ ...r, userCount: countBySlug[r.slug] ?? 0 }));
}
