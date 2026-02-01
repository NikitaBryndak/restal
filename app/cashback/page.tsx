'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Gift, Percent, Star, Users, Copy, Check, LogIn } from 'lucide-react';
import { LoaderOne } from '@/components/ui/loader';
import Link from 'next/link';

interface UserCashbackData {
    cashbackAmount: number;
    phoneNumber: string;
    userName: string;
}

interface TripCashbackInfo {
    tripNumber: string;
    country: string;
    totalAmount: number;
    cashbackAmount: number;
    status: string;
    completedAt?: string;
}

export default function CashbackPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [selectedTab, setSelectedTab] = useState<'bonuses' | 'overview' | 'claim'>('bonuses');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [copiedReferral, setCopiedReferral] = useState(false);
    const [userData, setUserData] = useState<UserCashbackData | null>(null);
    const [tripHistory, setTripHistory] = useState<TripCashbackInfo[]>([]);
    const [loading, setLoading] = useState(true);

    // Generate referral code from phone number
    const referralCode = userData?.phoneNumber
        ? `RESTAL-${userData.phoneNumber.slice(-6).toUpperCase()}`
        : "RESTAL-XXXXXX";

    useEffect(() => {
        const fetchCashbackData = async () => {
            if (sessionStatus === 'loading') return;

            if (!session?.user?.phoneNumber) {
                setLoading(false);
                return;
            }

            try {
                // Fetch user profile data
                const profileResponse = await fetch('/api/profileFetch');
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    setUserData({
                        cashbackAmount: profileData.cashbackAmount || 0,
                        phoneNumber: profileData.phoneNumber || '',
                        userName: profileData.userName || ''
                    });
                }

                // Fetch completed trips for cashback history
                const tripsResponse = await fetch('/api/trips?status=Completed');
                if (tripsResponse.ok) {
                    const tripsData = await tripsResponse.json();
                    const completedTrips = tripsData.trips?.filter((t: { cashbackProcessed?: boolean }) => t.cashbackProcessed) || [];
                    setTripHistory(completedTrips.map((trip: { number: string; country: string; payment?: { totalAmount?: number }; cashbackAmount?: number; status: string; updatedAt?: string }) => ({
                        tripNumber: trip.number,
                        country: trip.country,
                        totalAmount: trip.payment?.totalAmount || 0,
                        cashbackAmount: trip.cashbackAmount || 0,
                        status: trip.status,
                        completedAt: trip.updatedAt
                    })));
                }
            } catch (error) {
                console.error('Error fetching cashback data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCashbackData();
    }, [session, sessionStatus]);

    const cashbackBalance = userData?.cashbackAmount || 0;
    const totalEarned = tripHistory.reduce((sum, trip) => sum + trip.cashbackAmount, 0) + 1000; // +1000 welcome bonus
    const bookingsCount = tripHistory.length;

    const copyReferralCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopiedReferral(true);
        setTimeout(() => setCopiedReferral(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoaderOne />
            </div>
        );
    }

    // Show login prompt for unauthenticated users
    if (!session?.user) {
        return (
            <div className="min-h-screen px-4 py-12 md:py-20">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-light mb-4">Бонусна програма</h1>
                        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                            Отримуйте бонуси за кожне бронювання та використовуйте їх для знижок на майбутні подорожі
                        </p>
                    </div>

                    {/* Login Prompt */}
                    <div className="max-w-md mx-auto text-center">
                        <div className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <LogIn className="w-10 h-10 text-accent" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-4">Увійдіть в акаунт</h2>
                                <p className="text-foreground/70 mb-6">
                                    Щоб переглянути свій баланс бонусів та історію кешбеку, увійдіть у свій обліковий запис.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <Link href="/login">
                                        <Button className="w-full bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl h-12">
                                            Увійти
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button variant="outline" className="w-full border-accent/30 text-accent hover:bg-accent/10 rounded-xl h-12">
                                            Зареєструватися
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 py-12 md:py-20">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-light mb-4">Бонусна програма</h1>
                    <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                        Отримуйте бонуси за кожне бронювання та використовуйте їх для знижок на майбутні подорожі
                    </p>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-8 md:p-12 mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative z-10">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div>
                                <p className="text-sm text-foreground/60 mb-2">Доступний баланс</p>
                                <p className="text-4xl md:text-5xl font-light text-accent">{cashbackBalance.toLocaleString()} грн</p>
                            </div>
                            <div>
                                <p className="text-sm text-foreground/60 mb-2">Всього накопиченно</p>
                                <p className="text-3xl md:text-4xl font-light">{totalEarned.toLocaleString()} грн</p>
                            </div>
                            <div>
                                <p className="text-sm text-foreground/60 mb-2">Бронювань здійснено</p>
                                <p className="text-3xl md:text-4xl font-light">{bookingsCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8 border-b border-foreground/10">
                    <button
                        onClick={() => setSelectedTab('bonuses')}
                        className={`pb-4 px-2 font-medium transition-colors relative ${
                            selectedTab === 'bonuses'
                                ? 'text-accent'
                                : 'text-foreground/60 hover:text-foreground'
                        }`}
                    >
                        Бонуси
                        {selectedTab === 'bonuses' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                    <button
                        onClick={() => setSelectedTab('overview')}
                        className={`pb-4 px-2 font-medium transition-colors relative ${
                            selectedTab === 'overview'
                                ? 'text-accent'
                                : 'text-foreground/60 hover:text-foreground'
                        }`}
                    >
                        Як це працює
                        {selectedTab === 'overview' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                    <button
                        onClick={() => setSelectedTab('claim')}
                        className={`pb-4 px-2 font-medium transition-colors relative ${
                            selectedTab === 'claim'
                                ? 'text-accent'
                                : 'text-foreground/60 hover:text-foreground'
                        }`}
                    >
                        Отримати cashback
                        {selectedTab === 'claim' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                </div>

                {/* Bonuses Tab */}
                {selectedTab === 'bonuses' && (
                    <div className="space-y-8">
                        {/* Bonus Cards Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Bonus 1 - Welcome Bonus */}
                            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-8 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                                            <Gift className="w-7 h-7 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-400 font-medium mb-1">Бонус №1</p>
                                            <h3 className="text-xl font-semibold">Вітальний бонус</h3>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-4xl font-light text-emerald-400 mb-2">1 000 грн</p>
                                        <p className="text-foreground/70">
                                            Отримайте вітальний бонус на ваш рахунок при першій реєстрації.
                                            Використовуйте його для знижки на перше бронювання туру.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Автоматично при реєстрації</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bonus 2 - Cashback for Booking */}
                            <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-2xl p-8 relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                                            <Percent className="w-7 h-7 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-400 font-medium mb-1">Бонус №2</p>
                                            <h3 className="text-xl font-semibold">Cash-back за бронювання</h3>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-4xl font-light text-blue-400 mb-2">2%</p>
                                        <p className="text-foreground/70">
                                            Отримуйте 2% від суми туру на ваш бонусний рахунок.
                                            Нарахування відбувається автоматично після завершення подорожі.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-blue-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Після завершення туру</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bonus 3 - Activity Bonus */}
                            <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 rounded-2xl p-8 relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
                                            <Star className="w-7 h-7 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-purple-400 font-medium mb-1">Бонус №3</p>
                                            <h3 className="text-xl font-semibold">За активність туриста</h3>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-4xl font-light text-purple-400 mb-2">+1%</p>
                                        <p className="text-foreground/70">
                                            Додатковий 1% cash-back при самостійному підборі туру на нашому сайті.
                                            Надайте менеджеру конкретний код туру, який Ви знайшли.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-purple-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Разом до 3% cash-back</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bonus 4 - Referral Bonus */}
                            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-8 relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center">
                                            <Users className="w-7 h-7 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-400 font-medium mb-1">Бонус №4</p>
                                            <h3 className="text-xl font-semibold">За залучення друга</h3>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-4xl font-light text-amber-400 mb-2">до 2 000 грн</p>
                                        <p className="text-foreground/70">
                                            Отримайте до 2 000 грн за кожного друга, якого Ви залучите.
                                            А ваш друг отримає ваучер на 800 грн для першого бронювання.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-amber-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Необмежена кількість друзів</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Referral Code Section */}
                        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-8">
                            <h3 className="text-xl font-semibold mb-4">Ваш реферальний код</h3>
                            <p className="text-foreground/70 mb-6">
                                Поділіться цим кодом з друзями. Коли вони зареєструються та здійснять перше бронювання,
                                ви отримаєте бонус, а вони — знижку 800 грн.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 bg-background border border-foreground/20 rounded-xl p-4 flex items-center justify-between">
                                    <span className="text-xl font-mono tracking-wider text-accent">{referralCode}</span>
                                    <button
                                        onClick={copyReferralCode}
                                        className="ml-4 p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                                    >
                                        {copiedReferral ? (
                                            <Check className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <Copy className="w-5 h-5 text-foreground/60" />
                                        )}
                                    </button>
                                </div>
                                <Button className="bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl px-6">
                                    Поділитися
                                </Button>
                            </div>
                        </div>

                        {/* Bonus Summary Table */}
                        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-foreground/10">
                                <h3 className="text-xl font-semibold">Зведена таблиця бонусів</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-foreground/10">
                                            <th className="text-left p-4 text-sm font-medium text-foreground/60">Бонус</th>
                                            <th className="text-left p-4 text-sm font-medium text-foreground/60">Розмір</th>
                                            <th className="text-left p-4 text-sm font-medium text-foreground/60">Умови</th>
                                            <th className="text-left p-4 text-sm font-medium text-foreground/60">Коли нараховується</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-foreground/10 hover:bg-foreground/5">
                                            <td className="p-4 font-medium">Вітальний бонус</td>
                                            <td className="p-4 text-emerald-400">1 000 грн</td>
                                            <td className="p-4 text-foreground/70">Перша реєстрація</td>
                                            <td className="p-4 text-foreground/70">Одразу</td>
                                        </tr>
                                        <tr className="border-b border-foreground/10 hover:bg-foreground/5">
                                            <td className="p-4 font-medium">Cash-back за бронювання</td>
                                            <td className="p-4 text-blue-400">2% від суми туру</td>
                                            <td className="p-4 text-foreground/70">Будь-яке бронювання</td>
                                            <td className="p-4 text-foreground/70">Після завершення туру</td>
                                        </tr>
                                        <tr className="border-b border-foreground/10 hover:bg-foreground/5">
                                            <td className="p-4 font-medium">За активність туриста</td>
                                            <td className="p-4 text-purple-400">+1% cash-back</td>
                                            <td className="p-4 text-foreground/70">Самостійний підбір туру</td>
                                            <td className="p-4 text-foreground/70">Після завершення туру</td>
                                        </tr>
                                        <tr className="hover:bg-foreground/5">
                                            <td className="p-4 font-medium">За залучення друга</td>
                                            <td className="p-4 text-amber-400">до 2 000 грн</td>
                                            <td className="p-4 text-foreground/70">Друг здійснив бронювання</td>
                                            <td className="p-4 text-foreground/70">Після оплати туру другом</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Overview Tab */}
                {selectedTab === 'overview' && (
                    <div className="space-y-12">
                        {/* How Cashback Accumulates */}
                        <section>
                            <h2 className="text-2xl font-light mb-6">Як накопичується Cash-back</h2>
                            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 md:p-8">
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                                            <span className="text-accent font-semibold">2%</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">Базовий Cash-back за кожне бронювання</h3>
                                            <p className="text-foreground/70">
                                                Отримуйте 2% cash-back від загальної вартості кожного туру, який ви бронюєте через нашу платформу.
                                                Cash-back автоматично зараховується на ваш рахунок після завершення подорожі.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                            <span className="text-purple-400 font-semibold">+1%</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">Додатковий бонус за активність</h3>
                                            <p className="text-foreground/70">
                                                Якщо ви самостійно підберете тур та надасте менеджеру конкретний код туру,
                                                отримаєте додатковий 1% cash-back. Разом — до 3% від вартості туру!
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">Приклад розрахунку</h3>
                                            <p className="text-foreground/70">
                                                Тур вартістю 50 000 грн → Отримаєте 1 000 грн cash-back (2%)<br />
                                                Тур вартістю 100 000 грн → Отримаєте 2 000 грн cash-back (2%)<br />
                                                З бонусом за активність: 100 000 грн → 3 000 грн cash-back (3%)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Terms of Use */}
                        <section>
                            <h2 className="text-2xl font-light mb-6">Умови використання</h2>
                            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 md:p-8">
                                <ul className="space-y-4">
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">Без виведення готівки:</strong> Cash-back не можна перевести на банківський рахунок або зняти готівкою
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">Знижка на майбутні бронювання:</strong> Cash-back можна використовувати лише як знижку на майбутні бронювання турів
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">Генерація коду:</strong> Для використання cash-back згенеруйте унікальний код знижки та надайте його менеджеру при наступному бронюванні
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">Одноразове використання:</strong> Кожен згенерований код можна використати лише один раз, термін дії — 30 днів
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">Мінімальна сума:</strong> Для генерації коду знижки необхідний мінімальний баланс 100 грн
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-foreground/80">
                                            <strong className="text-foreground">Не передається:</strong> Cash-back та коди знижок прив&apos;язані до вашого облікового запису і не можуть бути передані іншим особам
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* FAQ */}
                        <section>
                            <h2 className="text-2xl font-light mb-6">Часті запитання</h2>
                            <div className="space-y-4">
                                <details className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 group">
                                    <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                                        <span>Коли cash-back зараховується на мій рахунок?</span>
                                        <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <p className="mt-4 text-foreground/70">
                                        Cash-back автоматично зараховується на ваш рахунок після завершення туру. Ви отримаєте сповіщення електронною поштою, коли бонус буде додано.
                                    </p>
                                </details>
                                <details className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 group">
                                    <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                                        <span>Чи можу я використати кілька кодів знижки на одне бронювання?</span>
                                        <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <p className="mt-4 text-foreground/70">
                                        Ні, на одне бронювання можна застосувати лише один код знижки cash-back. Проте ви можете згенерувати код на весь доступний баланс.
                                    </p>
                                </details>
                                <details className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 group">
                                    <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                                        <span>Що станеться, якщо я скасую бронювання?</span>
                                        <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <p className="mt-4 text-foreground/70">
                                        Якщо ви скасуєте бронювання, cash-back, отриманий за це бронювання, буде знято з вашого балансу. Якщо ви використали код знижки для бронювання, сума коду буде повернута на ваш рахунок.
                                    </p>
                                </details>
                                <details className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 group">
                                    <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                                        <span>Як отримати вітальний бонус 1 000 грн?</span>
                                        <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <p className="mt-4 text-foreground/70">
                                        Вітальний бонус автоматично зараховується на ваш рахунок при першій реєстрації на платформі. Ви можете використати його для знижки на перше бронювання туру.
                                    </p>
                                </details>
                                <details className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 group">
                                    <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                                        <span>Як працює реферальна програма?</span>
                                        <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <p className="mt-4 text-foreground/70">
                                        Поділіться своїм реферальним кодом з друзями. Коли ваш друг зареєструється за вашим кодом та здійснить перше бронювання, ви отримаєте до 2 000 грн на свій бонусний рахунок, а ваш друг отримає ваучер на 800 грн для першого бронювання.
                                    </p>
                                </details>
                            </div>
                        </section>
                    </div>
                )}

                {/* Claim Tab */}
                {selectedTab === 'claim' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-8 md:p-10">
                            <h2 className="text-2xl font-light mb-6">Отримати Cash-back</h2>

                            {/* Step-by-step guide */}
                            <div className="space-y-6 mb-8">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-sm font-semibold">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Вкажіть суму</h3>
                                        <p className="text-sm text-foreground/70">
                                            Вкажіть скільки cash-back ви хочете використати (мінімум 100 грн, максимум: ваш доступний баланс)
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-sm font-semibold">
                                        2
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Згенеруйте код</h3>
                                        <p className="text-sm text-foreground/70">
                                            Натисніть кнопку для генерації унікального коду знижки
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-sm font-semibold">
                                        3
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Зв&apos;яжіться з менеджером</h3>
                                        <p className="text-sm text-foreground/70">
                                            Надайте згенерований код нашому менеджеру при наступному бронюванні
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-sm font-semibold">
                                        4
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Отримайте знижку</h3>
                                        <p className="text-sm text-foreground/70">
                                            Менеджер застосує знижку до загальної суми вашого бронювання
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Claim Form */}
                            <div className="border-t border-foreground/10 pt-8">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-3">
                                        Сума для використання
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="100"
                                            max={cashbackBalance}
                                            step="1"
                                            placeholder="0"
                                            className="w-full h-12 bg-background border border-foreground/20 rounded-lg pl-4 pr-12 focus:outline-none focus:border-accent transition-colors"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/60">
                                            грн
                                        </span>
                                    </div>
                                    <p className="text-xs text-foreground/60 mt-2">
                                        Доступний баланс: {cashbackBalance.toLocaleString()} грн
                                    </p>
                                </div>

                                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-sm text-foreground/80">
                                            Після генерації код буде дійсний протягом 30 днів і може бути використаний лише один раз. Вказана сума буде негайно списана з вашого балансу.
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-foreground/20 bg-background text-accent focus:ring-2 focus:ring-accent/20"
                                        />
                                        <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                                            Я погоджуюся з умовами та розумію, що цей cash-back буде використано як знижку на моє наступне бронювання і не може бути виведено готівкою
                                        </span>
                                    </label>
                                </div>

                                <Button
                                    disabled={!agreedToTerms}
                                    className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Згенерувати код знижки
                                </Button>

                                {/* Code Display Area (shown after generation) */}
                                <div className="mt-8 p-6 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 rounded-lg hidden">
                                    <p className="text-sm text-foreground/70 mb-3 text-center">
                                        Ваш код знижки
                                    </p>
                                    <div className="bg-background border border-accent/20 rounded-lg p-4 mb-4">
                                        <p className="text-2xl font-mono text-center tracking-wider text-accent">
                                            CASHBACK-XXXX-YYYY
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-accent/30 hover:bg-accent/10"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Скопіювати
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-accent/30 hover:bg-accent/10"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Завантажити
                                        </Button>
                                    </div>
                                    <p className="text-xs text-foreground/60 text-center mt-4">
                                        Код дійсний 30 днів • Надайте його менеджеру при бронюванні
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Claims History */}
                        <div className="mt-8 bg-foreground/5 border border-foreground/10 rounded-xl p-8">
                            <h3 className="text-lg font-semibold mb-4">Історія використання</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-3 border-b border-foreground/10">
                                    <div>
                                        <p className="font-medium">CASHBACK-A1B2-C3D4</p>
                                        <p className="text-xs text-foreground/60">Згенеровано 15 жовтня 2025</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">500 грн</p>
                                        <p className="text-xs text-green-500">Активний</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-foreground/10">
                                    <div>
                                        <p className="font-medium">CASHBACK-E5F6-G7H8</p>
                                        <p className="text-xs text-foreground/60">Згенеровано 28 вересня 2025</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">750 грн</p>
                                        <p className="text-xs text-foreground/60">Використано</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <div>
                                        <p className="font-medium">CASHBACK-I9J0-K1L2</p>
                                        <p className="text-xs text-foreground/60">Згенеровано 12 серпня 2025</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">1 000 грн</p>
                                        <p className="text-xs text-foreground/60">Використано</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}