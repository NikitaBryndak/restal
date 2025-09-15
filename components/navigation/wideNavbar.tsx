import { NavLink } from "./nav-link";
import { useSession } from "next-auth/react";

export default function WideNavbar() {
    const { data: session } = useSession();

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
                <NavLink href="/login" variant="button">
                    {session ? "Аккаунт" : "Стати клієнтом"}
                </NavLink>
            </li>
        </ul>
    )
}