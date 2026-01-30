import { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import FormInput from '@/components/ui/form-input';
import { TourFormValues } from '../schema';

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
    title = 'Phone',
    description = 'Who is the primary contact for this tour?',
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
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-foreground/60">{description}</p>
            </div>

            <div>
                <FormInput
                    labelText="Phone"
                    placeholder="e.g. +1 (555) 000-0000"
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
