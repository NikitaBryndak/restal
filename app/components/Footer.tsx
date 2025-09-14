"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
export default function Footer() {
    const pathname = usePathname();
    return (
         pathname !== '/register' &&
          pathname !== '/login' && 
            <div className="absolute bottom-0 left-0 right-0 flex justify-center my-6 gap-8 text-sm text-foreground/50">
                <Link href="/" className="hover:text-foreground transition-colors">Умови використання</Link>
                <Link href="/" className="hover:text-foreground transition-colors">Конфіденційність</Link>
                <Link href="/" className="hover:text-foreground transition-colors">Допомога</Link>
            </div>
        )
}