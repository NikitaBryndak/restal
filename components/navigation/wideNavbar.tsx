import { useUserProfile } from "@/hooks/useUserProfile";
import { NavLink } from "./nav-link";
import { useSession } from "next-auth/react";
import NotificationBell from "./NotificationBell";

export default function WideNavbar() {
    const { data: session } = useSession();
    const { userProfile } = useUserProfile();

    return (
        <ul className="hidden sm:flex items-center gap-8 list-none m-0 p-0">
            <li>
                <NavLink href="/tour-screener">
                    Підбір туру
                </NavLink>
            </li>
            <li>
                <NavLink href="/info">
                    Інфо центр
                </NavLink>
            </li>
            <li>
                <NavLink href="/contact">
                    Контакти
                </NavLink>
            </li>
            <li>
                <NavLink href="/managers">
                    Менеджери
                </NavLink>
            </li>
            <li className="flex items-center gap-4">
                {session && userProfile && (
                    <>
                        <NotificationBell />
                        <NavLink href="/cashback" className="bg-accent p-1 rounded-md hover:text-black hover:bg-white">{(userProfile?.cashbackAmount ?? 0).toFixed(2)}₴</NavLink>
                    </>
                )}
                <NavLink href="/login" variant="button">
                    {session ? "Кабінет" : "Стати клієнтом"}
                </NavLink>
            </li>
        </ul>
    )
}