"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderOne } from "@/components/ui/loader";
import { useUserProfile } from "@/hooks/useUserProfile";
import { User, Phone, Calendar, Wallet, Shield, Plus, MapPin, Loader } from "lucide-react";
import type { TouristInfo } from "@/types";
import { useState, useEffect } from "react";
import { getCountryImageName } from "@/data";

import Link from "next/link";

interface UserStatistics {
    totalTrips: number;
    topDestination: string | null;
    topDestinationCount?: number;
}

export default function ProfilePage() {
    const { userProfile, loading, error } = useUserProfile();
    const [statistics, setStatistics] = useState<UserStatistics | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatistics = async () => {
            setStatsLoading(true);
            setStatsError(null);
            try {
                const response = await fetch("/api/auth/user-statistics");
                if (!response.ok) {
                    throw new Error("Failed to fetch statistics");
                }
                const data = await response.json();
                setStatistics(data);
            } catch (err) {
                setStatsError(err instanceof Error ? err.message : "Failed to fetch statistics");
                setStatistics(null);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStatistics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center">
                <LoaderOne />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-950 flex items-center justify-center">
                <div className="text-center backdrop-blur-sm bg-white/10 rounded-2xl p-8 border border-white/20 shadow-xl">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-lg font-semibold text-red-400 mb-2">Помилка завантаження</p>
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            </div>
        );
    }

    const accountTourists: TouristInfo[] = [
        {
            id: 1,
            name: "John Smith",
            passportExpiryDate: "2025-12-31"
        },
        {
            id: 2,
            name: "Mary Johnson",
            passportExpiryDate: "2026-06-15"
        },

    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen relative">
            <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="mb-6 sm:mb-8 text-center lg:text-left">
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-linear-to-r from-white via-blue-200 to-accent bg-clip-text text-transparent mb-3 sm:mb-4">
                            Профіль користувача
                        </h1>
                        <p className="text-sm sm:text-lg text-blue-200 font-medium">Керуйте своїм профілем та туристами</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* Profile Information */}
                        <div className="lg:col-span-1">
                            <div className="backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl p-5 sm:p-8 hover:bg-white/10 transition-all duration-300">
                                <div className="flex items-center mb-6 sm:mb-8">
                                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-linear-to-br from-blue-500 to-accent rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-5 shadow-lg shrink-0">
                                        <User className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 truncate">{userProfile?.userName}</h2>
                                        <p className="text-blue-200 font-medium">Основна інформація</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="name" className="flex items-center gap-3 text-sm font-semibold text-blue-200 mb-3">
                                            <User className="w-5 h-5 text-accent" />
                                            Ім'я
                                        </Label>
                                        <Input
                                            type="text"
                                            id="name"
                                            value={userProfile?.userName || ''}
                                            placeholder="Ім'я"
                                            readOnly
                                            className="bg-white/10 border-white/20 backdrop-blur-sm h-12 text-white font-medium rounded-xl placeholder:text-gray-400"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="phone" className="flex items-center gap-3 text-sm font-semibold text-blue-200 mb-3">
                                            <Phone className="w-5 h-5 text-accent" />
                                            Номер телефону
                                        </Label>
                                        <Input
                                            type="tel"
                                            id="phone"
                                            value={userProfile?.phoneNumber || ''}
                                            placeholder="Номер телефону"
                                            readOnly
                                            className="bg-white/10 border-white/20 backdrop-blur-sm h-12 text-white font-medium rounded-xl placeholder:text-gray-400"
                                        />
                                    </div>

                                    <div>
                                        <Label className="flex items-center gap-3 text-sm font-semibold text-blue-200 mb-3">
                                            <Calendar className="w-5 h-5 text-accent" />
                                            Дата реєстрації
                                        </Label>
                                        <div className="p-4 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl text-white font-medium">
                                            {userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'Н/Д'}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="flex items-center gap-3 text-sm font-semibold text-blue-200 mb-3">
                                            <Wallet className="w-5 h-5 text-accent" />
                                            Баланс бонусів
                                        </Label>
                                        <div className="p-4 bg-linear-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 backdrop-blur-sm rounded-xl">
                                            <span className="text-xl font-bold text-emerald-300">
                                                {(userProfile?.cashbackAmount || 0).toFixed(2)} грн
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statistics Card */}
                        <div className="lg:col-span-1 lg:col-start-3">
                            {statsLoading ? (
                                <div className="backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl p-5 sm:p-8 flex items-center justify-center min-h-[300px]">
                                    <Loader className="w-8 h-8 text-accent animate-spin" />
                                </div>
                            ) : (
                                <div className="backdrop-blur-sm bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl p-5 sm:p-8 hover:bg-white/10 transition-all duration-300">
                                    <div className="flex items-center mb-6 sm:mb-8">
                                        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-5 shadow-lg shrink-0">
                                            <MapPin className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Статистика</h2>
                                            <p className="text-blue-200 font-medium">Ваші подорожі</p>
                                        </div>
                                    </div>

                                    {!statistics || statistics.totalTrips === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-white/80 font-medium mb-4">
                                                This section is to be discovered.. Book your trip now!
                                            </p>
                                            <Link href="/contact">
                                                <Button className="bg-accent hover:bg-accent/90 text-white rounded-xl h-10">
                                                    Забронювати тур
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-sm text-blue-200 font-semibold mb-2">Загальна кількість турів</p>
                                                <div className="p-4 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl">
                                                    <span className="text-3xl font-bold text-accent">
                                                        {statistics.totalTrips}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-sm text-blue-200 font-semibold mb-2">Улюблена назва</p>
                                                <div className="p-4 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl">
                                                    <p className="text-lg font-bold text-white">{statistics.topDestination}</p>
                                                    <p className="text-xs text-white/60 mt-1">
                                                        {statistics.topDestinationCount} {statistics.topDestinationCount === 1 ? 'тур' : 'турів'}
                                                    </p>
                                                </div>
                                            </div>

                                            {statistics.topDestination && (
                                                <div>
                                                    <p className="text-sm text-blue-200 font-semibold mb-2">Фото направлення</p>
                                                    <div className="relative h-40 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                                                        <img
                                                            src={`/countryImages/${getCountryImageName(statistics.topDestination)}.jpg`}
                                                            alt={statistics.topDestination}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
