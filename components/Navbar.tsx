"use client"

import Link from "next/link";
import { usePathname } from 'next/navigation';

export default function Navbar() {
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
                    <Link 
                        href="/" 
                        className="text-foreground/70 hover:text-foreground transition-colors"
                    >
                        Головна
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/info" 
                        className="text-foreground/70 hover:text-foreground transition-colors"
                    >
                        Інформація
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/login" 
                        className="border rounded-md border-foreground/20 px-4 py-2 hover:bg-accent transition-colors hover:bg-white/90 hover:text-black"
                    >
                        Увійти
                    </Link>
                </li>
            </ul>
        </nav>
    )
}