import { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import FormInput from '@/components/ui/form-input';
import { Hotel } from '@/types';
import { TourFormValues } from '../schema';

type StayField = keyof Hotel;

type StaySectionProps = {
    variant?: 'create' | 'edit';
    values?: Hotel;
    onChange?: (field: StayField, value: string) => void;
    includeMealPlan?: boolean;
    includeNights?: boolean;
    title?: string;
    description?: string;
};

type StayFieldConfig = { field: StayField; label: string; placeholder: string; name: keyof TourFormValues; formatType?: 'date' };

const stayFieldConfig: StayFieldConfig[] = [
    { field: 'name', label: 'Hotel name', placeholder: 'Resort or hotel name', name: 'hotelName' },
    { field: 'checkIn', label: 'Check-in', placeholder: '30/01/2021', name: 'hotelCheckIn', formatType: 'date' },
    { field: 'checkOut', label: 'Check-out', placeholder: '30/01/2021', name: 'hotelCheckOut', formatType: 'date' },
    { field: 'roomType', label: 'Room type', placeholder: 'e.g. Double deluxe', name: 'roomType' },
];

export const StaySection = ({
    variant = 'create',
    values,
    onChange,
    includeMealPlan = false,
    includeNights = false,
    title = 'Stay',
    description = 'Where travellers will be staying during the tour.',
}: StaySectionProps) => {
    const context = useFormContext<TourFormValues>();
    const register = context?.register ?? (() => ({} as any));
    const errors = context?.formState?.errors ?? {};
    const controlled = variant === 'edit' && values && onChange;

    const buildInputProps = (field: StayField, name: keyof TourFormValues) => {
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

    const optionalFields: StayFieldConfig[] = [];

    if (includeMealPlan) {
        optionalFields.push({ field: 'food', label: 'Meal plan', placeholder: 'e.g. All inclusive', name: 'food' });
    }

    if (includeNights) {
        optionalFields.push({ field: 'nights', label: 'Nights', placeholder: 'e.g. 7', name: 'hotelNights' });
    }

    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-foreground/60">{description}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {[...stayFieldConfig, ...optionalFields].map(({ field, label, placeholder, name, formatType }) => (
                    <div key={field}>
                        <FormInput
                            labelText={label}
                            placeholder={placeholder}
                            autoComplete="off"
                            formatType={formatType}
                            type={field === 'nights' ? 'number' : 'text'}
                            inputMode={field === 'nights' ? 'numeric' : undefined}
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
