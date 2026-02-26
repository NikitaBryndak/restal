"use client"

import { usePathname } from 'next/navigation';
import WideNavbar from "./wideNavbar";
import SmallNavbar from "./smallNavbar";
import NavLogo from "./NavLogo";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Navbar() {
    const pathname = usePathname();
    const { userProfile } = useUserProfile();

    return (
        pathname !== '/login' &&
        pathname !== '/register' &&

        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 py-3 lg:py-4 bg-background/95 backdrop-blur-md border-b border-white/5">
            <NavLogo className="relative z-50 shrink-0" />

            <WideNavbar userProfile={userProfile} />

            <SmallNavbar userProfile={userProfile} />
        </nav>
    )
}