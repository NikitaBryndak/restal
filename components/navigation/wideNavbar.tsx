"use client";

import { NavLink } from "./nav-link";
import { useSession } from "next-auth/react";
import NotificationBell from "./NotificationBell";

interface UserProfile {
    userName: string;
    cashbackAmount: number;
    privilegeLevel: number;
    [key: string]: unknown;
}

export default function WideNavbar({ userProfile }: { userProfile: UserProfile | null }) {
    const { data: session } = useSession();

    return (
        <ul className="hidden lg:flex items-center gap-8 list-none m-0 p-0">
            <li key="tour-screener">
                <NavLink href="/tour-screener">
                    Підбір туру
                </NavLink>
            </li>
            <li key="search">
                <NavLink href="/search">
                    ШІ Пошук
                </NavLink>
            </li>
            <li key="info">
                <NavLink href="/info">
                    Інфо центр
                </NavLink>
            </li>
            <li key="contact">
                <NavLink href="/contact">
                    Контакти
                </NavLink>
            </li>
            <li key="managers">
                <NavLink href="/managers">
                    Менеджери
                </NavLink>
            </li>
            <li key="user-actions" className="flex items-center gap-4">
                {session && userProfile && (
                    <>
                        <NotificationBell />
                        <NavLink href="/cashback" className="bg-accent p-1 rounded-md hover:text-black hover:bg-white">{(userProfile?.cashbackAmount ?? 0).toFixed(2)}₴</NavLink>
                    </>
                )}
                <NavLink href={session ? "/dashboard/profile" : "/login"} variant="button">
                    {session ? "Кабінет" : "Стати клієнтом"}
                </NavLink>
            </li>
        </ul>
    )
}