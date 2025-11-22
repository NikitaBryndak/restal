import { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import { Addons } from '@/types';
import { TourFormValues } from '../schema';

type ExtrasField = keyof Addons;

type ExtrasSectionProps = {
    variant?: 'create' | 'edit';
    values?: Addons;
    onChange?: (field: ExtrasField, value: boolean) => void;
    title?: string;
    description?: string;
};

const extrasOptions: Array<{ field: ExtrasField; label: string; name: keyof TourFormValues }> = [
    { field: 'insurance', label: 'Travel insurance', name: 'insurance' },
    { field: 'transfer', label: 'Airport transfer', name: 'transfer' },
];

export const ExtrasSection = ({
    variant = 'create',
    values,
    onChange,
    title = 'Extras',
    description = 'Optional add-ons for peace of mind.',
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
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-foreground/60">{description}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                {extrasOptions.map(({ field, label, name }) => (
                    <label key={field} className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                        <input
                            type="checkbox"
                            className="size-4 rounded border border-border/60 text-primary focus:ring-primary/30"
                            {...buildInputProps(field, name)}
                        />
                        {label}
                    </label>
                ))}
            </div>
        </section>
    );
};
