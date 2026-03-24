"use client";

import { NavLink } from "./nav-link";
import { useUserProfile } from "@/hooks/useUserProfile";
import { signOut } from "next-auth/react";
import { EDITOR_PRIVILEGE_LEVEL, MANAGER_PRIVILEGE_LEVEL, ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";

const NAV_ITEM_CLASS = "block text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 py-2 px-3 rounded-lg";

export default function SubDashboardNavbar() {
    const { userProfile, loading } = useUserProfile();

    const handleLogout = () => {
        signOut({ callbackUrl: "/" });
    };

    // Check if user has specific privileges
    const isAdmin = userProfile && userProfile.privilegeLevel === ADMIN_PRIVILEGE_LEVEL;
    const isEditor = userProfile && (userProfile.privilegeLevel === EDITOR_PRIVILEGE_LEVEL || isAdmin);
    const isManager = userProfile && (userProfile.privilegeLevel === MANAGER_PRIVILEGE_LEVEL || isAdmin);

    return (
        <nav className="hidden sm:flex sm:flex-col sticky top-20 w-44 z-10 h-[calc(100vh-7rem)]">
            <div className="flex flex-col py-6 px-3 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex flex-col space-y-5 flex-1">

                    {/* Client Section */}
                    <div className="flex flex-col space-y-0.5">
                        <div className="px-3 text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em] mb-2">
                           Клієнт
                        </div>
                        <NavLink href="/dashboard/profile" className={NAV_ITEM_CLASS}>
                            Профіль
                        </NavLink>

                        <NavLink href="/dashboard/trips" className={NAV_ITEM_CLASS}>
                            Мої подорожі
                        </NavLink>

                        <NavLink href="/cashback" className={NAV_ITEM_CLASS}>
                            Бонуси
                        </NavLink>

                        <NavLink href="/dashboard/settings" className={NAV_ITEM_CLASS}>
                            Налаштування
                        </NavLink>
                    </div>

                    {/* Editor Section */}
                    {!loading && isEditor && (
                        <div className="flex flex-col space-y-0.5 pt-4 border-t border-white/5">
                            <div className="px-3 text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em] mb-2">
                                Редактор
                            </div>
                            <NavLink href="/dashboard/manage-articles" className={NAV_ITEM_CLASS}>
                                Керування статтями
                            </NavLink>

                            <NavLink href="/dashboard/add-article" className={NAV_ITEM_CLASS}>
                                Додати статтю
                            </NavLink>
                        </div>
                    )}

                    {/* Manager Section */}
                    {!loading && isManager && (
                        <div className="flex flex-col space-y-0.5 pt-4 border-t border-white/5">
                            <div className="px-3 text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em] mb-2">
                                Менеджер
                            </div>

                            <NavLink href="/dashboard/manage-tour" className={NAV_ITEM_CLASS}>
                                Керування турами
                            </NavLink>

                            <NavLink href="/dashboard/add-tour" className={NAV_ITEM_CLASS}>
                                Додати тур
                            </NavLink>

                            <NavLink href="/dashboard/promo-codes" className={NAV_ITEM_CLASS}>
                                Промокоди
                            </NavLink>

                            <NavLink href="/dashboard/contact-requests" className={NAV_ITEM_CLASS}>
                                Запити
                            </NavLink>
                        </div>
                    )}

                    {/* Admin Section */}
                    {!loading && isAdmin && (
                        <div className="flex flex-col space-y-0.5 pt-4 border-t border-white/5">
                            <div className="px-3 text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em] mb-2">
                                Адмін
                            </div>

                            <NavLink href="/dashboard/analytics" className={NAV_ITEM_CLASS}>
                                Аналітика
                            </NavLink>

                            <NavLink href="/dashboard/audit-log" className={NAV_ITEM_CLASS}>
                                Журнал дій
                            </NavLink>

                            <NavLink href="/dashboard/manager-performance" className={NAV_ITEM_CLASS}>
                                Менеджери
                            </NavLink>

                            <NavLink href="/dashboard/clients" className={NAV_ITEM_CLASS}>
                                Клієнти
                            </NavLink>
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