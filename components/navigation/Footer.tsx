"use client"

import { usePathname } from "next/navigation";
import { NavLink } from "./nav-link";

export default function Footer() {
    const pathname = usePathname();

    return (
        pathname !== '/register' &&
        pathname !== '/login' &&

            <footer className="bottom-0 left-0 right-0 flex flex-col items-center my-6 gap-4 text-sm text-white/50 px-4">
                <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                    <NavLink href="/contact">Контакти</NavLink>
                    <NavLink href="/info">Допомога</NavLink>
                </div>
                <div className="text-center">
                    © {new Date().getFullYear()} Restal. Усі права захищені.
                </div>
            </footer>
        )

}