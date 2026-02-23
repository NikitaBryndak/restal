'use client';

import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { MANAGER_PRIVILEGE_LEVEL } from '@/config/constants';

interface ValidatedCode {
    valid: boolean;
    code: string;
    amount: number;
    status: string;
    ownerName: string;
    ownerPhone: string;
    createdAt: string;
    expiresAt: string;
    usedAt: string | null;
}

export default function PromoCodesManagerPage() {
    const { userProfile, loading: profileLoading } = useUserProfile();

    // Validation state
    const [searchCode, setSearchCode] = useState('');
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidatedCode | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Redeem state
    const [redeeming, setRedeeming] = useState(false);
    const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

    const isManager = userProfile && userProfile.privilegeLevel >= MANAGER_PRIVILEGE_LEVEL;

    const handleValidate = async () => {
        if (!searchCode.trim()) return;

        setValidating(true);
        setValidationResult(null);
        setValidationError(null);
        setRedeemSuccess(null);

        try {
            const res = await fetch(`/api/promo-codes/${encodeURIComponent(searchCode.trim())}`);
            const data = await res.json();

            if (!res.ok) {
                setValidationError(data.message || 'Код не знайдено');
                return;
            }

            setValidationResult(data);
        } catch {
            setValidationError('Помилка мережі');
        } finally {
            setValidating(false);
        }
    };

    const handleRedeem = async (code: string) => {
        setRedeeming(true);
        setRedeemSuccess(null);

        try {
            const res = await fetch(`/api/promo-codes/${encodeURIComponent(code)}`, {
                method: 'POST',
            });
            const data = await res.json();

            if (!res.ok) {
                setValidationError(data.message || 'Помилка при використанні');
                return;
            }

            setRedeemSuccess(`Код ${code} успішно використано на суму ${data.amount} грн для клієнта ${data.ownerName} (${data.ownerPhone})`);
            setValidationResult(null);
            setSearchCode('');
        } catch {
            setValidationError('Помилка мережі');
        } finally {
            setRedeeming(false);
        }
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('uk-UA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Активний';
            case 'used': return 'Використано';
            case 'expired': return 'Прострочено';
            default: return status;
        }
    };

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
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-light mb-2 text-white">Перевірка промокоду</h1>
                    <p className="text-white/50">Введіть код клієнта для перевірки його дійсності та застосування знижки</p>
                </div>

                {/* Validate Code Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => { setSearchCode(e.target.value.toUpperCase()); setValidationError(null); setRedeemSuccess(null); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                                placeholder="Введіть код, наприклад CB-XXXX-YYYY"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 text-white focus:outline-none focus:border-accent transition-colors font-mono tracking-wider uppercase placeholder:text-white/25"
                            />
                        </div>
                        <Button
                            onClick={handleValidate}
                            disabled={validating || !searchCode.trim()}
                            className="h-12 px-8 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg disabled:opacity-50"
                        >
                            {validating ? 'Перевірка...' : 'Перевірити'}
                        </Button>
                    </div>

                    {/* Validation Error */}
                    {validationError && (
                        <div className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                            <p className="text-sm text-red-400">{validationError}</p>
                        </div>
                    )}

                    {/* Redeem Success */}
                    {redeemSuccess && (
                        <div className="mt-4 flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                            <p className="text-sm text-green-400">{redeemSuccess}</p>
                        </div>
                    )}

                    {/* Validation Result */}
                    {validationResult && (
                        <div className={`mt-6 border rounded-xl p-6 ${validationResult.valid
                            ? 'bg-green-500/5 border-green-500/30'
                            : 'bg-red-500/5 border-red-500/30'
                        }`}>
                            <div className="flex items-center gap-3 mb-5">
                                {validationResult.valid ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-400" />
                                )}
                                <span className={`text-lg font-semibold ${validationResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                                    {validationResult.valid ? 'Код дійсний' : `Код недійсний (${statusLabel(validationResult.status)})`}
                                </span>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4 mb-5">
                                <div>
                                    <p className="text-xs text-white/40 mb-1">Код</p>
                                    <p className="font-mono tracking-wider text-lg text-white">{validationResult.code}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 mb-1">Сума знижки</p>
                                    <p className="text-lg font-semibold text-accent">{validationResult.amount.toLocaleString()} грн</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 mb-1">Власник</p>
                                    <p className="text-white">{validationResult.ownerName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 mb-1">Телефон</p>
                                    <p className="text-white">{validationResult.ownerPhone}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 mb-1">Створено</p>
                                    <p className="text-white">{formatDateTime(validationResult.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 mb-1">Дійсний до</p>
                                    <p className="text-white">{formatDateTime(validationResult.expiresAt)}</p>
                                </div>
                            </div>
                            {validationResult.valid && (
                                <Button
                                    onClick={() => handleRedeem(validationResult.code)}
                                    disabled={redeeming}
                                    className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                                >
                                    {redeeming ? 'Застосування...' : `Використати код (знижка ${validationResult.amount.toLocaleString()} грн)`}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
