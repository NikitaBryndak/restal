"use client"

import Link from "next/link";
import { usePathname } from 'next/navigation';
import WideNavbar from "./wideNavbar";
import SmallNavbar from "./smallNavbar";
import NavLogo from "./NavLogo";

export default function Navbar() {

    
    const pathname = usePathname();

    return (
        pathname !== '/login' && 
        pathname !== '/register' &&

        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-sm">
            <NavLogo />
            
            <WideNavbar />

            <SmallNavbar />
        </nav>
    )
}