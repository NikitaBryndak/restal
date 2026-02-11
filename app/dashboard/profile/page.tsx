"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderOne } from "@/components/ui/loader";
import { useUserProfile } from "@/hooks/useUserProfile";
import { User, Phone, Calendar, Wallet, Shield, Plus,  } from "lucide-react";
import type { TouristInfo } from "@/types";

import Link from "next/link";

export default function ProfilePage() {
    const { userProfile, loading, error } = useUserProfile();

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
                                                {userProfile?.cashbackAmount || 0} грн
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
