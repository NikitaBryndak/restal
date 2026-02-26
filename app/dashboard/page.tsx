"use client"

import { useSession } from "next-auth/react";
import { CardSkeleton } from "@/components/ui/skeleton";
import {
    User, Plane, Wallet, Settings, ArrowRight, Phone,
    Globe, CreditCard, MessageCircle
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { MANAGER_PRIVILEGE_LEVEL } from "@/config/constants";
import RecentlyViewed from "@/components/trip/recently-viewed";

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Доброго ранку";
    if (hour >= 12 && hour < 18) return "Доброго дня";
    if (hour >= 18 && hour < 23) return "Доброго вечора";
    return "Доброї ночі";
}

export default function DashboardPage() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            window.location.href = '/login';
        },
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (status === "loading") {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-5rem)] flex-col gap-3 p-4">
                <div className="w-full max-w-[400px]">
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    const greeting = getGreeting();
    const isManager = (session?.user?.privilegeLevel ?? 1) >= MANAGER_PRIVILEGE_LEVEL;

    const quickLinks = [
        { href: "/dashboard/profile", icon: User, label: "Профіль", desc: "Переглянути інформацію", color: "text-blue-400", bg: "bg-blue-500/20" },
        { href: "/dashboard/trips", icon: Plane, label: "Мої подорожі", desc: "Перегляд бронювань", color: "text-accent", bg: "bg-accent/20" },
        { href: "/cashback", icon: Wallet, label: "Бонуси", desc: "Бонусна програма", color: "text-emerald-400", bg: "bg-emerald-500/20" },
        { href: "/dashboard/settings", icon: Settings, label: "Налаштування", desc: "Акаунт та безпека", color: "text-purple-400", bg: "bg-purple-500/20" },
    ];

    const managerLinks = [
        { href: "/dashboard/manage-tour", icon: Globe, label: "Керування турами", color: "text-accent", bg: "bg-accent/20" },
        { href: "/dashboard/add-tour", icon: Plane, label: "Додати тур", color: "text-blue-400", bg: "bg-blue-500/20" },
        { href: "/dashboard/promo-codes", icon: CreditCard, label: "Промокоди", color: "text-emerald-400", bg: "bg-emerald-500/20" },
        { href: "/dashboard/contact-requests", icon: MessageCircle, label: "Запити", color: "text-amber-400", bg: "bg-amber-500/20" },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 max-sm:px-3 py-8 sm:py-12 space-y-6">
            {/* Hero Welcome */}
            <div className={`relative rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="absolute inset-0 bg-linear-to-br from-accent/6 via-accent/2 to-transparent" />
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/30 to-transparent" />
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-accent/8 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 p-6 sm:p-8 md:p-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-blue-500 via-accent to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                            <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <p className="text-accent text-sm font-medium mb-1">{greeting} 👋</p>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                                {session?.user?.name}
                            </h1>
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-white/40 text-sm">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{session?.user?.phoneNumber}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Navigation */}
            <div className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 px-1">Швидке меню</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickLinks.map(({ href, icon: Icon, label, desc, color, bg }) => (
                        <Link key={href} href={href}>
                            <div className="group relative rounded-2xl border border-white/5 overflow-hidden hover:border-white/15 transition-all duration-300 cursor-pointer">
                                <div className="absolute inset-0 bg-white/3 group-hover:bg-white/5 transition-colors duration-300" />
                                <div className="relative z-10 p-4 sm:p-5">
                                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>
                                    <h3 className="text-sm font-semibold text-white mb-0.5">{label}</h3>
                                    <p className="text-xs text-white/40 hidden sm:block">{desc}</p>
                                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-accent absolute top-4 right-4 transition-colors duration-300" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recently Viewed Trips */}
            <div className={`transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <RecentlyViewed />
            </div>

            {/* Manager Section */}
            {isManager && (
                <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 px-1">Менеджер</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {managerLinks.map(({ href, icon: Icon, label, color, bg }) => (
                            <Link key={href} href={href}>
                                <div className="group relative rounded-2xl border border-white/5 overflow-hidden hover:border-white/15 transition-all duration-300 cursor-pointer">
                                    <div className="absolute inset-0 bg-white/3 group-hover:bg-white/5 transition-colors duration-300" />
                                    <div className="relative z-10 p-4 sm:p-5">
                                        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                                            <Icon className={`w-5 h-5 ${color}`} />
                                        </div>
                                        <h3 className="text-sm font-semibold text-white">{label}</h3>
                                        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-accent absolute top-4 right-4 transition-colors duration-300" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}