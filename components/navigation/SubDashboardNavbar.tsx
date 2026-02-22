"use client";

import { NavLink } from "./nav-link";
import { useUserProfile } from "@/hooks/useUserProfile";
import { signOut } from "next-auth/react";

const NAV_ITEM_CLASS = "block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded";

export default function SubDashboardNavbar() {
    const { userProfile, loading } = useUserProfile();

    const handleLogout = () => {
        signOut({ callbackUrl: "/" });
    };

    // Check if user has admin privileges (level 2 or higher)
    const isAdmin = userProfile && userProfile.privilegeLevel >= 2;

    return (
        <nav className="hidden sm:flex sm:flex-col sticky top-20 w-40 z-10 h-[calc(100vh-7rem)]">
            <div className="flex flex-col p-6 flex-1">
                <div className="flex flex-col space-y-6 flex-1">

                    {/* General Section */}
                    <div className="flex flex-col space-y-2">
                        <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                           Меню
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

                    {/* Admin Section */}
                    {!loading && isAdmin && (
                        <div className="flex flex-col space-y-2 pt-4 border-t border-gray-700">
                            <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Admin
                            </div>

                            <NavLink href="/dashboard/manage-tour" className={NAV_ITEM_CLASS}>
                                Керування турами
                            </NavLink>

                            <NavLink href="/dashboard/add-tour" className={NAV_ITEM_CLASS}>
                                Додати тур
                            </NavLink>

                            <NavLink href="/dashboard/add-article" className={NAV_ITEM_CLASS}>
                                Додати статтю
                            </NavLink>

                            <NavLink href="/dashboard/manage-articles" className={NAV_ITEM_CLASS}>
                                Керування статтями
                            </NavLink>

                            <NavLink href="/dashboard/promo-codes" className={NAV_ITEM_CLASS}>
                                Промокоди
                            </NavLink>

                            <NavLink href="/dashboard/contact-requests" className={NAV_ITEM_CLASS}>
                                Запити
                            </NavLink>
                        </div>
                    )}

                    {/* Footer Section */}
                    <div className="mt-auto pt-4 border-t border-gray-700">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left text-base text-red-400 hover:text-red-300 transition-colors py-2 px-3 rounded hover:bg-red-900/20"
                        >
                            Вийти
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}