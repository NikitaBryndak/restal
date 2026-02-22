"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileSkeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
    User, Phone, Calendar, Wallet, MapPin, Loader,
    Settings, CreditCard, Globe,
    ArrowRight, Plane, Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface UserStatistics {
    totalTrips: number;
    topDestination: string | null;
    topDestinationCount?: number;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Доброго ранку";
    if (hour >= 12 && hour < 18) return "Доброго дня";
    if (hour >= 18 && hour < 23) return "Доброго вечора";
    return "Доброї ночі";
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getMemberSince(dateString: string): string {
    const created = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} дн.`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} міс.`;
    const years = Math.floor(months / 12);
    const remainMonths = months % 12;
    return remainMonths > 0 ? `${years} р. ${remainMonths} міс.` : `${years} р.`;
}

export default function ProfilePage() {
    const { userProfile, loading, error } = useUserProfile();
    const [statistics, setStatistics] = useState<UserStatistics | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchStatistics = async () => {
            setStatsLoading(true);
            try {
                const response = await fetch("/api/auth/user-statistics");
                if (!response.ok) throw new Error("Failed to fetch statistics");
                const data = await response.json();
                setStatistics(data);
            } catch {
                setStatistics(null);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStatistics();
    }, []);

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="text-center backdrop-blur-sm bg-white/5 rounded-2xl p-8 border border-white/10 shadow-xl max-w-md w-full">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-lg font-semibold text-red-400 mb-2">Помилка завантаження</p>
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const greeting = getGreeting();

    return (
        <div className="min-h-screen relative">
            <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Hero Header with Avatar */}
                    <div className={`backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl p-6 sm:p-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-blue-500 via-accent to-purple-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg shadow-accent/20 group-hover:shadow-accent/40 transition-shadow duration-300">
                                    <span className="text-2xl sm:text-3xl font-bold text-white select-none">
                                        {userProfile?.userName ? getInitials(userProfile.userName) : "?"}
                                    </span>
                                </div>
                            </div>

                            {/* Greeting & info */}
                            <div className="flex-1 text-center sm:text-left min-w-0">
                                <p className="text-blue-300 text-sm font-medium mb-1">{greeting} 👋</p>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 truncate">
                                    {userProfile?.userName}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-white/60">
                                    {userProfile?.createdAt && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            З нами {getMemberSince(userProfile.createdAt)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Quick action */}
                            <div className="hidden sm:flex items-center">
                                <Link href="/dashboard/settings">
                                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl gap-2">
                                        <Settings className="w-4 h-4" />
                                        Налаштування
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Stats Overview Cards */}
                    <div className={`grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {/* Bonus Balance */}
                        <div className="backdrop-blur-sm bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-5 hover:bg-white/10 transition-all duration-300 group">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                    <Wallet className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-xs text-white/50 font-medium">Бонуси</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-300 mb-0.5">
                                {(userProfile?.cashbackAmount || 0).toFixed(0)}
                                <span className="text-sm font-normal text-emerald-400/70 ml-1">грн</span>
                            </p>
                            <Link href="/cashback" className="text-xs text-white/40 group-hover:text-accent transition-colors flex items-center gap-1">
                                Детальніше <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>

                        {/* Total Tours */}
                        <div className="backdrop-blur-sm bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-5 hover:bg-white/10 transition-all duration-300 group">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <Plane className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="text-xs text-white/50 font-medium">Подорожі</span>
                            </div>
                            {statsLoading ? (
                                <Loader className="w-5 h-5 text-accent animate-spin" />
                            ) : (
                                <>
                                    <p className="text-xl sm:text-2xl font-bold text-white mb-0.5">
                                        {statistics?.totalTrips || 0}
                                    </p>
                                    <Link href="/dashboard/trips" className="text-xs text-white/40 group-hover:text-accent transition-colors flex items-center gap-1">
                                        Переглянути <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Top Destination */}
                        <div className="backdrop-blur-sm bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-5 hover:bg-white/10 transition-all duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-purple-400" />
                                </div>
                                <span className="text-xs text-white/50 font-medium">Топ напрямок</span>
                            </div>
                            {statsLoading ? (
                                <Loader className="w-5 h-5 text-accent animate-spin" />
                            ) : (
                                <>
                                    <p className="text-lg sm:text-xl font-bold text-white truncate mb-0.5">
                                        {statistics?.topDestination || "—"}
                                    </p>
                                    {statistics?.topDestinationCount && (
                                        <p className="text-xs text-white/40">
                                            {statistics.topDestinationCount} {statistics.topDestinationCount === 1 ? 'тур' : 'турів'}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                    </div>

                    {/* Main Content Grid */}
                    <div className={`grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {/* Profile Information - wider */}
                        <div className="lg:col-span-3">
                            <div className="h-full backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl p-5 sm:p-8 hover:bg-white/[0.07] transition-all duration-300">
                                <div className="flex items-center justify-between mb-6 sm:mb-8">
                                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                        <User className="w-5 h-5 text-accent" />
                                        Особиста інформація
                                    </h2>
                                    <Link href="/dashboard/settings" className="text-xs text-white/40 hover:text-accent transition-colors flex items-center gap-1">
                                        Редагувати <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                                            <User className="w-4 h-4 text-accent/70" />
                                            Ім'я
                                        </Label>
                                        <Input
                                            type="text"
                                            id="name"
                                            value={userProfile?.userName || ''}
                                            readOnly
                                            className="bg-white/[0.07] border-white/10 backdrop-blur-sm h-12 text-white font-medium rounded-xl focus:border-accent/50 cursor-default"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                                            <Phone className="w-4 h-4 text-accent/70" />
                                            Телефон
                                        </Label>
                                        <Input
                                            type="tel"
                                            id="phone"
                                            value={userProfile?.phoneNumber || ''}
                                            readOnly
                                            className="bg-white/[0.07] border-white/10 backdrop-blur-sm h-12 text-white font-medium rounded-xl focus:border-accent/50 cursor-default"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                                            <Calendar className="w-4 h-4 text-accent/70" />
                                            Дата реєстрації
                                        </Label>
                                        <div className="p-3.5 bg-white/[0.07] border border-white/10 backdrop-blur-sm rounded-xl text-white font-medium h-12 flex items-center">
                                            {userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'Н/Д'}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                                            <Wallet className="w-4 h-4 text-emerald-400/70" />
                                            Баланс бонусів
                                        </Label>
                                        <div className="p-3.5 bg-linear-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 backdrop-blur-sm rounded-xl h-12 flex items-center">
                                            <span className="text-lg font-bold text-emerald-300">
                                                {(userProfile?.cashbackAmount || 0).toFixed(2)} грн
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Statistics & Actions */}
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                            {/* Travel Stats */}
                            <div className="backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl p-5 sm:p-6 hover:bg-white/[0.07] transition-all duration-300">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <MapPin className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Подорожі</h2>
                                        <p className="text-xs text-white/50">Ваша статистика</p>
                                    </div>
                                </div>

                                {statsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader className="w-6 h-6 text-accent animate-spin" />
                                    </div>
                                ) : !statistics || statistics.totalTrips === 0 ? (
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Plane className="w-8 h-8 text-white/20" />
                                        </div>
                                        <p className="text-sm text-white/60 mb-4">
                                            Ваша перша подорож чекає!
                                        </p>
                                        <Link href="/contact">
                                            <Button className="bg-accent hover:bg-accent/90 text-white rounded-xl h-10 w-full gap-2">
                                                <Plane className="w-4 h-4" />
                                                Забронювати тур
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                                            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                                                <span className="text-xl font-bold text-accent">{statistics.totalTrips}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">Оформлених турів</p>
                                                <p className="text-xs text-white/40">За весь час</p>
                                            </div>
                                        </div>

                                        {statistics.topDestination && (
                                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                                    <Globe className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{statistics.topDestination}</p>
                                                    <p className="text-xs text-white/40">
                                                        Улюблений • {statistics.topDestinationCount} {statistics.topDestinationCount === 1 ? 'тур' : 'турів'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl p-5 sm:p-6 hover:bg-white/[0.07] transition-all duration-300">
                                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Швидкі дії</h3>
                                <div className="space-y-2">
                                    <Link href="/dashboard/trips" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors group">
                                        <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                            <Plane className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <span className="text-sm text-white/80 font-medium flex-1">Мої подорожі</span>
                                        <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-accent transition-colors" />
                                    </Link>
                                    <Link href="/cashback" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors group">
                                        <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                            <CreditCard className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-white/80 font-medium flex-1">Кешбек програма</span>
                                        <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-accent transition-colors" />
                                    </Link>
                                    <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors group">
                                        <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                                            <Settings className="w-4 h-4 text-white/60" />
                                        </div>
                                        <span className="text-sm text-white/80 font-medium flex-1">Налаштування</span>
                                        <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-accent transition-colors" />
                                    </Link>
                                    <Link href="/contact" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors group">
                                        <div className="w-9 h-9 bg-accent/20 rounded-lg flex items-center justify-center">
                                            <Phone className="w-4 h-4 text-accent" />
                                        </div>
                                        <span className="text-sm text-white/80 font-medium flex-1">Зв'язатися з нами</span>
                                        <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-accent transition-colors" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
