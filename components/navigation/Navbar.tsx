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

        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 bg-background/80 backdrop-blur-sm">
            <NavLogo className="relative z-50" />

            <WideNavbar userProfile={userProfile} />

            <SmallNavbar userProfile={userProfile} />
        </nav>
    )
}