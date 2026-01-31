"use client"

import { usePathname } from "next/navigation";
import { NavLink } from "./nav-link";

export default function Footer() {
    const pathname = usePathname();

    return (
        pathname !== '/register' &&
        pathname !== '/login' &&

            <div className="bottom-0 left-0 right-0 flex flex-col items-center my-6 gap-4 text-sm text-white/50">
                <div className="flex justify-center gap-8">
                    <NavLink href="/contact">Contacts</NavLink>
                    <NavLink href="/">Terms of Use</NavLink>
                    <NavLink href="/">Privacy</NavLink>
                    <NavLink href="/">Help</NavLink>
                </div>
                <div className="text-center">
                    © {new Date().getFullYear()} Restal. All rights reserved.
                </div>
            </div>
        )

}