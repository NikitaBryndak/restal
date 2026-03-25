export enum RoleLevel {
    CLIENT = 1,
    EDITOR = 2,
    MANAGER = 3,
    ADMIN = 4,
}

export type PageAccessControl = {
    path: string;
    minLevel: number;
};

// Define access rules for dashboard pages and other protected routes
export const PAGE_ACCESS_CONTROLS: PageAccessControl[] = [
    // Client pages (Accessible by everyone level 1+)
    { path: '/dashboard/profile', minLevel: RoleLevel.CLIENT },
    { path: '/dashboard/trips', minLevel: RoleLevel.CLIENT },
    { path: '/dashboard/settings', minLevel: RoleLevel.CLIENT },
    { path: '/cashback', minLevel: RoleLevel.CLIENT },

    // Editor pages (Accessible by level 2+)
    { path: '/dashboard/manage-articles', minLevel: RoleLevel.EDITOR },
    { path: '/dashboard/add-article', minLevel: RoleLevel.EDITOR },

    // Manager pages (Accessible by level 3+)
    { path: '/dashboard/manage-tour', minLevel: RoleLevel.MANAGER },
    { path: '/dashboard/add-tour', minLevel: RoleLevel.MANAGER },
    { path: '/dashboard/promo-codes', minLevel: RoleLevel.MANAGER },
    { path: '/dashboard/contact-requests', minLevel: RoleLevel.MANAGER },

    // Admin pages (Accessible by level 4+)
    { path: '/dashboard/analytics', minLevel: RoleLevel.ADMIN },
    { path: '/dashboard/audit-log', minLevel: RoleLevel.ADMIN },
    { path: '/dashboard/manager-performance', minLevel: RoleLevel.ADMIN },
];

/**
 * Checks if a user can access a specific path.
 */
export function canAccessPath(path: string, userLevel: number): boolean {
    // If it's the exact dashboard root, allow any authed user (CLIENT)
    if (path === '/dashboard') return userLevel >= RoleLevel.CLIENT;

    // Find the most specific rule that matches the path
    const rules = PAGE_ACCESS_CONTROLS.filter(rule => path.startsWith(rule.path));
    if (rules.length === 0) {
        // Default to not requiring extra permissions beyond being logged in
        // for paths not explicitly mapped (or you can dictate otherwise)
        return true;
    }

    // Must satisfy all matching rules (or rather, the highest required minLevel of the matching path)
    const requiredLevel = Math.max(...rules.map(r => r.minLevel));

    // Admin can access everything
    if (userLevel === RoleLevel.ADMIN) return true;

    // Client pages are accessible by anyone logged in
    if (requiredLevel === RoleLevel.CLIENT) return userLevel >= RoleLevel.CLIENT;

    // Editor pages are accessible ONLY by Editor (and Admin, which is handled above)
    if (requiredLevel === RoleLevel.EDITOR) return userLevel === RoleLevel.EDITOR;

    // Manager pages are accessible ONLY by Manager (and Admin, which is handled above)
    if (requiredLevel === RoleLevel.MANAGER) return userLevel === RoleLevel.MANAGER;

    // Admin pages require Admin level (handled above, so here we return false)
    return false;
}
