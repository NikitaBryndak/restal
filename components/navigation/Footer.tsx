"use client"

import { usePathname } from "next/navigation";
import { NavLink } from "./nav-link";
export default function Footer() {
    const pathname = usePathname();
    return (
          pathname !== '/register' &&
          pathname !== '/login' && 
            <div className="absolute bottom-0 left-0 right-0 flex justify-center my-6 gap-8 text-sm text-foreground/50">
                <NavLink href="/">Умови використання</NavLink>
                <NavLink href="/">Конфіденційність</NavLink>
                <NavLink href="/">Допомога</NavLink>
            </div>
        )
}