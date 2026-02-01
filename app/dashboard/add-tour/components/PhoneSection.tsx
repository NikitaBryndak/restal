import { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import FormInput from '@/components/ui/form-input';
import { TourFormValues } from '../schema';
import { Phone } from 'lucide-react';

type PhoneSectionProps = {
    variant?: 'create' | 'edit';
    value?: string;
    onChange?: (value: string) => void;
    title?: string;
    description?: string;
};

export const PhoneSection = ({
    variant = 'create',
    value,
    onChange,
    title = 'Телефон',
    description = 'Хто є основним контактом для цього туру?',
}: PhoneSectionProps) => {
    const context = useFormContext<TourFormValues>();
    const register = context?.register ?? (() => ({} as any));
    const errors = context?.formState?.errors ?? {};
    const controlled = variant === 'edit' && onChange;

    const inputProps = controlled
        ? {
              value: value ?? '',
              onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
          }
        : register('ownerPhone');

    return (
        <section className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-sky-500/10 border border-teal-500/20">
                <div className="p-2 rounded-lg bg-teal-500/20">
                    <Phone className="w-5 h-5 text-teal-400" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <p className="text-sm text-foreground/60">{description}</p>
                </div>
            </div>

            <div className="max-w-md">
                <FormInput
                    labelText="Номер телефону клієнта"
                    placeholder="напр. +380 (50) 000-0000"
                    type="tel"
                    autoComplete="off"
                    formatType="phone"
                    {...inputProps}
                />
                {!controlled && errors.ownerPhone && (
                    <p className="text-xs text-red-500 mt-1">{errors.ownerPhone.message}</p>
                )}
            </div>
        </section>
    );
};
