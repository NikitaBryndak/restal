"use client";

import { Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import React from "react";
import { NavLink } from "./nav-link";
import { useUserProfile } from "@/hooks/useUserProfile";
import NotificationBell from "./NotificationBell";
import { MANAGER_PRIVILEGE_LEVEL, ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";

export default function SmallNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const { data: session } = useSession();
    const { userProfile } = useUserProfile();

    function toggleMobileMenu() {
        setIsMobileMenuOpen((prev) => !prev);
    }

    return (
        <div className="lg:hidden flex items-center gap-2">
            {/* Notification bell for mobile - visible outside menu */}
            {session && userProfile && <NotificationBell />}

            <button
                onClick={toggleMobileMenu}
                className="z-50 flex items-center gap-2 px-3 py-2 text-sm font-medium text-white border border-white/20 rounded-md hover:bg-white/10 transition-colors"
                aria-label={isMobileMenuOpen ? "Закрити меню" : "Відкрити меню"}
                aria-expanded={isMobileMenuOpen}
            >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span>{isMobileMenuOpen ? "Закрити" : "Меню"}</span>
            </button>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black pt-20 lg:pt-24 flex flex-col h-dvh text-white">
                    <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-4">
                        <div className="flex flex-col space-y-6">
                            {/* Main Navigation */}
                            <div className="flex flex-col space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b">
                                    Меню
                                </h3>
                                <NavLink href="/tour-screener" onClick={toggleMobileMenu} className="text-lg font-medium">
                                    Підбір туру
                                </NavLink>
                                <NavLink href="/search" onClick={toggleMobileMenu} className="text-lg font-medium">
                                    ШІ Пошук
                                </NavLink>
                                <NavLink href="/info" onClick={toggleMobileMenu} className="text-lg font-medium">
                                    Інфо центр
                                </NavLink>
                                <NavLink href="/contact" onClick={toggleMobileMenu} className="text-lg font-medium">
                                    Контакти
                                </NavLink>
                                <NavLink href="/managers" onClick={toggleMobileMenu} className="text-lg font-medium">
                                    Менеджери
                                </NavLink>
                            </div>

                            {/* Dashboard Navigation - Only if logged in */}
                            {session && userProfile && (
                                <div className="flex flex-col space-y-4 pt-4">
                                    <div className="flex flex-col space-y-2">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b">
                                            Кабінет
                                        </h3>
                                        <NavLink href="/dashboard/profile" onClick={toggleMobileMenu} className="text-lg">
                                            Профіль
                                        </NavLink>
                                        <NavLink href="/dashboard/trips" onClick={toggleMobileMenu} className="text-lg">
                                            Мої подорожі
                                        </NavLink>
                                        <NavLink href="/cashback" onClick={toggleMobileMenu} className="text-lg">
                                            Бонуси
                                        </NavLink>
                                        <NavLink href="/dashboard/settings" onClick={toggleMobileMenu} className="text-lg">
                                            Налаштування
                                        </NavLink>
                                    </div>

                                    {userProfile.privilegeLevel >= MANAGER_PRIVILEGE_LEVEL && (
                                        <div className="flex flex-col space-y-2 pt-2">
                                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Manager
                                            </h3>
                                            <NavLink href="/dashboard/add-tour" onClick={toggleMobileMenu} className="text-lg">
                                                Додати тур
                                            </NavLink>
                                            <NavLink href="/dashboard/manage-tour" onClick={toggleMobileMenu} className="text-lg">
                                                Керування турами
                                            </NavLink>
                                            <NavLink href="/dashboard/promo-codes" onClick={toggleMobileMenu} className="text-lg">
                                                Промокоди
                                            </NavLink>
                                            <NavLink href="/dashboard/contact-requests" onClick={toggleMobileMenu} className="text-lg">
                                                Запити
                                            </NavLink>
                                        </div>
                                    )}
                                    {userProfile.privilegeLevel >= ADMIN_PRIVILEGE_LEVEL && (
                                        <div className="flex flex-col space-y-2 pt-2">
                                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Admin
                                            </h3>
                                            <NavLink href="/dashboard/add-article" onClick={toggleMobileMenu} className="text-lg">
                                                Додати статтю
                                            </NavLink>
                                            <NavLink href="/dashboard/manage-articles" onClick={toggleMobileMenu} className="text-lg">
                                                Керування статтями
                                            </NavLink>
                                            <NavLink href="/dashboard/analytics" onClick={toggleMobileMenu} className="text-lg">
                                                Аналітика
                                            </NavLink>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Section */}
                    <div className="p-6 border-t bg-black">
                        <div className="flex flex-col space-y-4">
                            {session && userProfile && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Бонуси</span>
                                    <NavLink href="/cashback" onClick={toggleMobileMenu} className="bg-accent p-1 rounded-md hover:text-black hover:bg-white">
                                        {(userProfile?.cashbackAmount ?? 0).toFixed(2)}₴
                                    </NavLink>
                                </div>
                            )}
                            {session ? (
                                <button
                                    onClick={() => {
                                        toggleMobileMenu();
                                        signOut({ callbackUrl: "/" });
                                    }}
                                    className="w-full text-center text-base text-red-400 hover:text-red-300 transition-colors py-2 px-3 rounded hover:bg-red-900/20 border border-red-400/30"
                                >
                                    Вийти
                                </button>
                            ) : (
                                <NavLink href="/login" variant="button" onClick={toggleMobileMenu} className="w-full flex justify-center">
                                    Стати клієнтом
                                </NavLink>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
