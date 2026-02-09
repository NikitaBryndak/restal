"use client";

import { NavLink } from "./nav-link";
import { useUserProfile } from "@/hooks/useUserProfile";
import { signOut } from "next-auth/react";

export default function SubDashboardNavbar() {
    const { userProfile, loading } = useUserProfile();

    const handleLogout = () => {
        signOut({ callbackUrl: "/" });
    };

    // Check if user has admin privileges (level 2 or higher)
    const isAdmin = userProfile && userProfile.privilegeLevel >= 2;

    return (
        <nav className="hidden sm:flex sm:flex-col sticky top-20 w-40 z-10 min-h-[calc(100vh-5rem)]">
            <div className="flex flex-col p-6 flex-1">
                <ul className="flex flex-col space-y-4 flex-1">
                    {!loading && isAdmin && (
                        <li>
                            <NavLink href="/dashboard/add-tour" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                                Додати тур
                            </NavLink>
                        </li>
                    )}

                    {!loading && isAdmin && (
                        <li>
                            <NavLink href="/dashboard/manage-tour" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                                Керування турами
                            </NavLink>
                        </li>
                    )}

                    <li>
                        <NavLink href="/dashboard/trips" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                            Мої подорожі
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/dashboard/settings" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                            Налаштування
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/dashboard/profile" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                            Профіль
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/cashback" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                            Бонуси
                        </NavLink>
                    </li>

                    {!loading && isAdmin && (
                        <li>
                            <NavLink href="/dashboard/add-article" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                                Додати статтю
                            </NavLink>
                        </li>
                    )}

                    {!loading && isAdmin && (
                        <li>
                            <NavLink href="/dashboard/promo-codes" className="block text-base text-white hover:text-blue-400 transition-colors py-2 px-3 rounded">
                                Промокоди
                            </NavLink>
                        </li>
                    )}

                    <li>
                        <div className="mt-auto pt-4 border-t border-gray-700">
                            <button
                                onClick={handleLogout}
                                className="w-full text-left text-base text-red-400 hover:text-red-300 transition-colors py-2 px-3 rounded hover:bg-red-900/20"
                            >
                                Вийти
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
    )
}