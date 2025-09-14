"use client"

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { NavLink } from "./ui/nav-link";

export default function Navbar() {

    const { data: session } = useSession();
    
    const pathname = usePathname();
    return (
        pathname !== '/login' && 
        pathname !== '/register' &&

        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-sm">
            <Link href="/" className="flex items-center gap-3">
                <img 
                    src="/logo.png" 
                    alt="RestAll Logo" 
                    className="w-10 h-10 object-contain" 
                />
                <h1 className="hidden sm:block text-3xl font-bold tracking-tight">
                    RestAll
                </h1>
            </Link>
            
            
            <ul className="flex items-center gap-8 list-none m-0 p-0">
                <li>
                    <NavLink href="/tour-search">
                        Підбір
                    </NavLink>
                </li>
                <li>
                    <NavLink href="/info">
                        Інфоцентр
                    </NavLink>
                </li>
                <li>
                    <NavLink href="/manager-contact">
                        Менеджер
                    </NavLink>
                </li>
                <li>
                    <NavLink href="/login" variant="button">
                        {session ? "Аккаунт" : "Стати клієнтом"}
                    </NavLink>
                </li>
            </ul>

            
        </nav>
    )
}