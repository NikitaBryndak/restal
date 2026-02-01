import { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import FormInput from '@/components/ui/form-input';
import { Payment } from '@/types';
import { TourFormValues } from '../schema';
import { CreditCard } from 'lucide-react';

type PaymentField = keyof Payment;

type PaymentSectionProps = {
    variant?: 'create' | 'edit';
    values?: Payment;
    onChange?: (field: PaymentField, value: string) => void;
    title?: string;
    description?: string;
};

const paymentConfig: Array<{ field: PaymentField; label: string; placeholder: string; name: keyof TourFormValues; type?: string; formatType?: 'date' }> = [
    { field: 'totalAmount', label: 'Загальна сума', placeholder: 'напр. 1299.99', name: 'paymentTotal', type: 'number' },
    { field: 'paidAmount', label: 'Сплачено', placeholder: 'напр. 500', name: 'paymentPaid', type: 'number' },
    { field: 'deadline', label: 'Термін оплати', placeholder: '30/01/2021', name: 'paymentDeadline', formatType: 'date' },
];

export const PaymentSection = ({
    variant = 'create',
    values,
    onChange,
    title = 'Оплата',
    description = 'Внесіть фінансову інформацію для прозорого розрахунку.',
}: PaymentSectionProps) => {
    const context = useFormContext<TourFormValues>();
    const register = context?.register ?? (() => ({} as any));
    const errors = context?.formState?.errors ?? {};
    const controlled = variant === 'edit' && values && onChange;

    const buildInputProps = (field: PaymentField, name: keyof TourFormValues) => {
        if (controlled) {
            const rawValue = values?.[field];
            const value = typeof rawValue === 'number' ? String(rawValue ?? '') : rawValue ?? '';
            return {
                value,
                onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(field, event.target.value),
            };
        }
        return register(name);
    };

    return (
        <section className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-500/20">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <p className="text-sm text-foreground/60">{description}</p>
                </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {paymentConfig.map(({ field, label, placeholder, name, type, formatType }) => (
                    <div key={field}>
                        <FormInput
                            labelText={label}
                            placeholder={placeholder}
                            type={type}
                            autoComplete="off"
                            inputMode={type === 'number' ? 'decimal' : undefined}
                            step={type === 'number' ? '0.01' : undefined}
                            formatType={formatType}
                            {...buildInputProps(field, name)}
                        />
                        {!controlled && errors[name] && (
                            <p className="text-xs text-red-500 mt-1">{errors[name]?.message as string}</p>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};
