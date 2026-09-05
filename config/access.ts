// Access scope catalog — single source of truth for the app's protected pages,
// how they are grouped, and which URL paths each page owns.
//
// Roles (models/role.ts) grant access to whole groups and/or individual pages
// via overrides; evaluation lives in lib/role-access.ts. The session token
// carries the flattened `allowedPages` list so middleware and client nav can
// check access without a DB hit.

export interface AccessPage {
    slug: string;      // stable identifier used in role permissions & session token
    label: string;     // Ukrainian display name (nav + roles config UI)
    paths: string[];   // URL prefixes this page owns (longest match wins)
}

export interface AccessGroup {
    slug: string;
    label: string;
    pages: AccessPage[];
}

export const ACCESS_GROUPS: AccessGroup[] = [
    {
        slug: "client",
        label: "Кабінет",
        pages: [
            { slug: "profile", label: "Профіль", paths: ["/dashboard/profile"] },
            { slug: "my-trips", label: "Мої подорожі", paths: ["/dashboard/trips"] },
            { slug: "bonuses", label: "Бонуси", paths: ["/cashback"] },
            { slug: "settings", label: "Налаштування", paths: ["/dashboard/settings"] },
        ],
    },
    {
        slug: "articles",
        label: "Статті",
        pages: [
            { slug: "manage-articles", label: "Керування статтями", paths: ["/dashboard/manage-articles"] },
            { slug: "add-article", label: "Додати статтю", paths: ["/dashboard/add-article"] },
        ],
    },
    {
        slug: "tours",
        label: "Тури та маркетинг",
        pages: [
            { slug: "manage-tour", label: "Керування турами", paths: ["/dashboard/manage-tour"] },
            { slug: "add-tour", label: "Додати тур", paths: ["/dashboard/add-tour"] },
            { slug: "promo-codes", label: "Промокоди", paths: ["/dashboard/promo-codes"] },
            { slug: "contact-requests", label: "Запити", paths: ["/dashboard/contact-requests"] },
        ],
    },
    {
        slug: "admin",
        label: "Адміністрування",
        pages: [
            { slug: "analytics", label: "Аналітика", paths: ["/dashboard/analytics"] },
            { slug: "audit-log", label: "Журнал дій", paths: ["/dashboard/audit-log"] },
            { slug: "managers", label: "Менеджери", paths: ["/dashboard/manager-performance"] },
            { slug: "users", label: "Користувачі", paths: ["/dashboard/users"] },
            { slug: "roles", label: "Ролі та доступ", paths: ["/dashboard/roles"] },
            { slug: "cron", label: "Cron-завдання", paths: ["/dashboard/cron"] },
        ],
    },
];

/* Derived lookup tables (built once at module load). */

export const PAGE_BY_SLUG: Record<string, AccessPage> = {};
export const PAGE_GROUP_OF: Record<string, string> = {}; // page slug -> group slug

for (const group of ACCESS_GROUPS) {
    for (const page of group.pages) {
        PAGE_BY_SLUG[page.slug] = page;
        PAGE_GROUP_OF[page.slug] = group.slug;
    }
}

/** All page slugs in catalog order. */
export const ALL_PAGE_SLUGS: string[] = Object.keys(PAGE_BY_SLUG);

/**
 * Map a request path to the catalog page that owns it (longest prefix match).
 * Returns null for paths outside the catalog — e.g. `/dashboard` root and
 * trip detail pages, which are open to any authenticated user at the
 * middleware level (ownership is enforced by the server components themselves).
 */
export function findPageForPath(pathname: string): AccessPage | null {
    let best: AccessPage | null = null;
    let bestLen = 0;
    for (const page of Object.values(PAGE_BY_SLUG)) {
        for (const p of page.paths) {
            if ((pathname === p || pathname.startsWith(p + "/")) && p.length > bestLen) {
                best = page;
                bestLen = p.length;
            }
        }
    }
    return best;
}

/**
 * Seed permissions for the four system roles — mirrors the pre-migration
 * level map exactly (editor/manager areas were mutually exclusive, admin had
 * everything). Used by scripts/migrate-roles.mjs and as the DB fallback.
 */
export const SYSTEM_ROLE_SEEDS: Record<string, { name: string; groups: string[] }> = {
    client: { name: "Клієнт", groups: ["client"] },
    editor: { name: "Редактор", groups: ["client", "articles"] },
    manager: { name: "Менеджер", groups: ["client", "tours"] },
    admin: { name: "Адмін", groups: ["client", "articles", "tours", "admin"] },
};

export const SYSTEM_ROLE_SLUGS = Object.keys(SYSTEM_ROLE_SEEDS);
