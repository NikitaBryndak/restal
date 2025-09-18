import { useUserProfile } from "@/hooks/useUserProfile";
import { NavLink } from "./nav-link";
import { useSession } from "next-auth/react";

export default function WideNavbar() {
    const { data: session } = useSession();
    const { userProfile } = useUserProfile();

    return (
        <ul className="hidden sm:flex items-center gap-8 list-none m-0 p-0">
            <li>
                <NavLink href="/tour-screener">
                    Підбір
                </NavLink>
            </li>
            <li>
                <NavLink href="/info">
                    Інфоцентр
                </NavLink>
            </li>
            <li>
                <NavLink href="/contact">
                    Менеджер
                </NavLink>
            </li>
            <li>
                {session && userProfile && (
                    <NavLink href="/info/cashback" className="bg-accent p-1 rounded-md mr-2 hover:text-black hover:bg-white">{userProfile?.cashbackAmount}₴</NavLink>
                )}
                <NavLink href="/login" variant="button">
                    {session ? "Аккаунт" : "Стати клієнтом"}
                </NavLink>
            </li>
        </ul>
    )
}