"use client";

import { NavLink } from "./nav-link";
import { useUserProfile } from "@/hooks/useUserProfile";
import { signOut } from "next-auth/react";
import { ACCESS_GROUPS } from "@/config/access";

const NAV_ITEM_CLASS = "block text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 py-2 px-3 rounded-lg";

export default function SubDashboardNavbar() {
    const { userProfile, loading } = useUserProfile();

    const handleLogout = () => {
        signOut({ callbackUrl: "/" });
    };

    // Page visibility comes from the session's allowedPages (role-driven).
    // While the profile is still loading, show only the client section.
    const allowed = new Set(userProfile?.allowedPages ?? []);

    return (
        <nav className="hidden sm:flex sm:flex-col sticky top-20 w-44 z-10 h-[calc(100vh-7rem)]">
            <div className="flex flex-col py-6 px-3 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex flex-col space-y-5 flex-1">

                    {/* Access sections — rendered from the catalog for whatever pages this role allows */}
                    {!loading && ACCESS_GROUPS.map((group) => {
                        const visiblePages = group.pages.filter((p) => allowed.has(p.slug));
                        if (visiblePages.length === 0) return null;
                        return (
                            <div key={group.slug} className="flex flex-col space-y-0.5 pt-4 border-t border-white/5 first:pt-0 first:border-t-0">
                                <div className="px-3 text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em] mb-2">
                                    {group.label}
                                </div>
                                {visiblePages.map((page) => (
                                    <NavLink key={page.slug} href={page.paths[0]} className={NAV_ITEM_CLASS}>
                                        {page.label}
                                    </NavLink>
                                ))}
                            </div>
                        );
                    })}

                    {/* Loading fallback — client section only */}
                    {loading && (
                        <div className="flex flex-col space-y-0.5">
                            <div className="px-3 text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em] mb-2">
                               Клієнт
                            </div>
                            {ACCESS_GROUPS[0].pages.map((page) => (
                                <NavLink key={page.slug} href={page.paths[0]} className={NAV_ITEM_CLASS}>
                                    {page.label}
                                </NavLink>
                            ))}
                        </div>
                    )}

                    {/* Footer Section */}
                    <div className="mt-auto pt-4 border-t border-white/5 pb-4">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 py-2 px-3 rounded-lg"
                        >
                            Вийти
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}