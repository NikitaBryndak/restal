"use client"

import { usePathname } from "next/navigation";
import { NavLink } from "./nav-link";
import { Send } from "lucide-react";

const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);
const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);
const TikTokIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);
const ThreadsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.17 12.34c-.46 2.08-2.5 3.54-5.17 3.54-3.04 0-5.5-2.12-5.5-4.74 0-2.62 2.46-4.74 5.5-4.74 1.52 0 2.9.53 3.88 1.39l-1.57 1.52A3.82 3.82 0 0 0 12 9.4c-1.96 0-3.5 1.42-3.5 2.74s1.54 2.74 3.5 2.74c1.42 0 2.63-.7 3.12-1.74H12v-2h5.5c.05.33.08.67.08 1.02 0 .73-.14 1.43-.41 2.08z" />
    </svg>
);

const socials = [
    { icon: InstagramIcon, href: "https://www.instagram.com/restal.in.ua", label: "Instagram" },
    { icon: FacebookIcon, href: "https://www.facebook.com/share/1CSq5T82h6/", label: "Facebook" },
    { icon: TikTokIcon, href: "https://www.tiktok.com/@restal.in.ua", label: "TikTok" },
    { icon: ThreadsIcon, href: "https://www.threads.net/@restal.in.ua", label: "Threads" },
    { icon: Send, href: "https://t.me/RestAL_travel", label: "Telegram" },
];

export default function Footer() {
    const pathname = usePathname();

    return (
        pathname !== '/register' &&
        pathname !== '/login' &&

            <footer className="bottom-0 left-0 right-0 flex flex-col items-center my-6 gap-4 text-sm text-white/50 px-4">
                <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                    <NavLink href="/contact">Контакти</NavLink>
                    <NavLink href="/info">Допомога</NavLink>
                </div>
                <div className="flex justify-center gap-4">
                    {socials.map((s) => (
                        <a
                            key={s.label}
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={s.label}
                            className="text-white/40 transition-colors hover:text-white/70"
                        >
                            <s.icon />
                        </a>
                    ))}
                </div>
                <div className="text-center">
                    © {new Date().getFullYear()} Restal. Усі права захищені.
                </div>
            </footer>
        )

}