"use client"

import './Navbar.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();
    return (
        pathname !== '/login' && 
        pathname !== '/register' &&

        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
            <Link href="/" className='flex items-center '>
                <img src="/logo.png" alt="RestAll Logo" className="w-10" />
                <h1 className="navbar-title hidden sm:block">RestAll</h1>
            </Link>
            <ul className="flex items-center gap-8">
                <li><Link href="/">Головна</Link></li>
                <li><Link href="/info">Інформація</Link></li>
                <li><Link href="/login" className="border rounded-md border-foreground/20 p-2 hover:bg-accent">Увійти</Link></li>
            </ul>
        </nav>
    )
}