import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import FormInput from '@/components/ui/form-input';
import { TourFormValues } from '../schema';
import { BadgePercent, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PromoCodeSectionProps = {
    variant?: 'create' | 'edit';
};

export const PromoCodeSection = ({ variant = 'create' }: PromoCodeSectionProps) => {
    const { register, setValue, watch, formState: { errors } } = useFormContext<TourFormValues>();
    const promoCode = watch('promoCode') || '';

    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        amount?: number;
        ownerName?: string;
        message?: string;
    } | null>(null);

    const handleValidate = useCallback(async () => {
        if (!promoCode.trim()) return;

        setValidating(true);
        setValidationResult(null);

        try {
            const res = await fetch(`/api/promo-codes/${encodeURIComponent(promoCode.trim())}`);
            const data = await res.json();

            if (!res.ok || !data.valid) {
                setValidationResult({
                    valid: false,
                    message: data.message || 'Код недійсний',
                });
                return;
            }

            setValidationResult({
                valid: true,
                amount: data.amount,
                ownerName: data.ownerName,
            });
        } catch {
            setValidationResult({ valid: false, message: 'Помилка мережі' });
        } finally {
            setValidating(false);
        }
    }, [promoCode]);

    const handleClear = useCallback(() => {
        setValue('promoCode', '');
        setValidationResult(null);
    }, [setValue]);

    if (variant === 'edit') return null;

    return (
        <section className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-linear-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10 border border-purple-500/20">
                <div className="p-2 rounded-lg bg-purple-500/20">
                    <BadgePercent className="w-5 h-5 text-purple-400" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white">Промокод</h2>
                    <p className="text-sm text-white/50">Необов&apos;язково. Введіть промокод клієнта для знижки на тур.</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <FormInput
                        labelText="Промокод"
                        placeholder="напр. CB-XXXX-YYYY"
                        autoComplete="off"
                        className="font-mono tracking-wider uppercase"
                        {...register('promoCode')}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setValue('promoCode', e.target.value.toUpperCase());
                            setValidationResult(null);
                        }}
                    />
                    {errors.promoCode && (
                        <p className="text-xs text-red-500 mt-1">{errors.promoCode.message as string}</p>
                    )}
                </div>
                <div className="flex gap-2 sm:mt-6">
                    <Button
                        type="button"
                        onClick={handleValidate}
                        disabled={validating || !promoCode.trim()}
                        className="h-10 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50"
                    >
                        {validating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            'Перевірити'
                        )}
                    </Button>
                    {promoCode.trim() && (
                        <Button
                            type="button"
                            onClick={handleClear}
                            variant="outline"
                            className="h-10 px-4 border-white/10 text-white/60 hover:text-white rounded-lg"
                        >
                            Очистити
                        </Button>
                    )}
                </div>
            </div>

            {validationResult && (
                <div className={`flex items-start gap-3 rounded-xl border p-4 ${
                    validationResult.valid
                        ? 'bg-green-500/10 border-green-500/25'
                        : 'bg-red-500/10 border-red-500/25'
                }`}>
                    {validationResult.valid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                        {validationResult.valid ? (
                            <>
                                <p className="text-sm font-semibold text-green-400">
                                    Код дійсний — знижка {validationResult.amount?.toLocaleString()} грн
                                </p>
                                <p className="text-xs text-green-400/70">
                                    Власник: {validationResult.ownerName}. Знижку буде автоматично вирахувано із загальної суми при створенні туру.
                                </p>
                            </>
                        ) : (
                            <p className="text-sm font-semibold text-red-400">
                                {validationResult.message}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};
