"use client"

import { usePathname } from 'next/navigation';
import WideNavbar from "./wideNavbar";
import SmallNavbar from "./smallNavbar";
import NavLogo from "./NavLogo";

export default function Navbar() {


    const pathname = usePathname();

    return (
        pathname !== '/login' &&
        pathname !== '/register' &&

        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-background/80 backdrop-blur-sm">
            <NavLogo className="relative z-50" />

            <WideNavbar />

            <SmallNavbar />
        </nav>
    )
}