'use client';

import { useUserProfile } from '@/hooks/useUserProfile';
import { PageSkeleton } from '@/components/ui/skeleton';
import { BadgePercent, ArrowRight, XCircle } from 'lucide-react';
import { MANAGER_PRIVILEGE_LEVEL } from '@/config/constants';
import Link from 'next/link';

export default function PromoCodesManagerPage() {
    const { userProfile, loading: profileLoading } = useUserProfile();

    const isManager = userProfile && userProfile.privilegeLevel >= MANAGER_PRIVILEGE_LEVEL;

    if (profileLoading) {
        return <PageSkeleton />;
    }

    if (!isManager) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-semibold mb-2">Доступ заборонено</h1>
                    <p className="text-white/50">Ця сторінка доступна лише для менеджерів.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-8 md:py-12">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-light mb-2 text-white">Промокоди</h1>
                    <p className="text-white/50">Промокоди тепер застосовуються безпосередньо при створенні туру.</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/25">
                            <BadgePercent className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-white">Як застосувати промокод?</h2>
                            <p className="text-sm text-white/60 leading-relaxed">
                                Промокоди клієнтів тепер вводяться безпосередньо у формі створення нового туру.
                                Знижка автоматично вираховується із загальної суми туру при його створенні.
                            </p>
                            <p className="text-sm text-white/60 leading-relaxed">
                                Один промокод прив'язується до одного туру та не може бути використаний повторно.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/dashboard/add-tour"
                        className="flex items-center justify-center gap-2 w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors"
                    >
                        Створити тур з промокодом
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
