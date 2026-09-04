import { IRole } from "@/models/role";
import { ALL_PAGE_SLUGS, PAGE_GROUP_OF } from "@/config/access";

/** Shape any role-like object (mongoose doc or lean) must have for evaluation. */
export type RolePermissions = Pick<IRole, "groups" | "pageOverrides">;

/**
 * Does the role grant a specific page?
 * Explicit per-page override wins; otherwise the page follows its group.
 */
export function canAccessPage(role: RolePermissions | null, pageSlug: string): boolean {
    if (!role) return false;
    const overrides = (role.pageOverrides ?? {}) as Record<string, unknown>;
    const override = overrides[pageSlug];
    if (typeof override === "boolean") return override;
    const group = PAGE_GROUP_OF[pageSlug];
    return !!group && role.groups.includes(group);
}

/** True if the role grants at least one of the given page slugs. */
export function hasAnyScope(role: RolePermissions | null, scopes: string[]): boolean {
    return scopes.some((s) => canAccessPage(role, s));
}

/** Flatten a role's permissions into the list of allowed page slugs (session token payload). */
export function allowedPagesForRole(role: RolePermissions | null): string[] {
    if (!role) return [];
    return ALL_PAGE_SLUGS.filter((slug) => canAccessPage(role, slug));
}
