import { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import { Addons } from '@/types';
import { TourFormValues } from '../schema';
import { Sparkles, Shield, Car } from 'lucide-react';

type ExtrasField = keyof Addons;

type ExtrasSectionProps = {
    variant?: 'create' | 'edit';
    values?: Addons;
    onChange?: (field: ExtrasField, value: boolean) => void;
    title?: string;
    description?: string;
};

const extrasOptions: Array<{ field: ExtrasField; label: string; name: keyof TourFormValues }> = [
    { field: 'insurance', label: 'Туристична страховка', name: 'insurance' },
    { field: 'transfer', label: 'Трансфер з аеропорту', name: 'transfer' },
];

export const ExtrasSection = ({
    variant = 'create',
    values,
    onChange,
    title = 'Додатково',
    description = 'Опціональні доповнення для туру.',
}: ExtrasSectionProps) => {
    const context = useFormContext<TourFormValues>();
    const register = context?.register ?? (() => ({} as any));
    const controlled = variant === 'edit' && values && onChange;

    const buildInputProps = (field: ExtrasField, name: keyof TourFormValues) => {
        if (controlled) {
            return {
                checked: Boolean(values?.[field]),
                onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(field, event.target.checked),
            };
        }
        return register(name);
    };

    return (
        <section className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-linear-to-r from-purple-500/10 via-violet-500/10 to-fuchsia-500/10 border border-purple-500/20">
                <div className="p-2 rounded-lg bg-purple-500/20">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <p className="text-sm text-white/50">{description}</p>
                </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                {extrasOptions.map(({ field, label, name }) => (
                    <label
                        key={field}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            className="size-5 rounded border border-white/10 text-accent focus:ring-accent/20"
                            {...buildInputProps(field, name)}
                        />
                        <div className="flex items-center gap-2">
                            {field === 'insurance' ? <Shield className="w-4 h-4 text-purple-400" /> : <Car className="w-4 h-4 text-purple-400" />}
                            <span className="text-sm font-medium text-white/60">{label}</span>
                        </div>
                    </label>
                ))}
            </div>
        </section>
    );
};
