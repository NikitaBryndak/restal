import { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import FormInput from '@/components/ui/form-input';
import { TourFormValues } from '../schema';
import { Globe } from 'lucide-react';
import { DESTINATIONS } from '@/data';

export type BasicDetailsField = 'number' | 'country' | 'region' | 'hotelNights' | 'tripStartDate' | 'tripEndDate' | 'food';

type BasicDetailsValues = Partial<Record<BasicDetailsField, string | number>>;

type BasicDetailsSectionProps = {
    variant?: 'create' | 'edit';
    values?: BasicDetailsValues;
    onChange?: (field: BasicDetailsField, value: string) => void;
    title?: string;
    description?: string;
    showHotelNights?: boolean;
    showMealPlan?: boolean;
    showNumber?: boolean;
};

const primaryFields: Array<{
    field: BasicDetailsField;
    label: string;
    placeholder: string;
    name: keyof TourFormValues;
    formatType?: 'date';
    inputMode?: 'numeric';
    pattern?: string;
    isSelect?: boolean;
}> = [
    { field: 'number', label: 'Номер туру', placeholder: 'напр. 12345', name: 'number', inputMode: 'numeric', pattern: '[0-9]*' },
    { field: 'country', label: 'Країна призначення', placeholder: 'Виберіть країну', name: 'country', isSelect: true },
    { field: 'region', label: 'Регіон', placeholder: 'Хургада, Тоскана, Санторіні...', name: 'region' },
    { field: 'hotelNights', label: 'Ночей у готелі', placeholder: 'напр. 7', name: 'hotelNights', inputMode: 'numeric', pattern: '[0-9]*' },
];

const dateFields: Array<{ field: Extract<BasicDetailsField, 'tripStartDate' | 'tripEndDate'>; label: string; name: keyof TourFormValues }> = [
    { field: 'tripStartDate', label: 'Дата вильоту', name: 'tripStartDate' },
    { field: 'tripEndDate', label: 'Дата повернення', name: 'tripEndDate' },
];

export const BasicDetailsSection = ({
    variant = 'create',
    values,
    onChange,
    title = 'Основні деталі',
    description = 'Почніть з головної інформації про цю подорож.',
    showHotelNights = true,
    showMealPlan = true,
    showNumber = true,
}: BasicDetailsSectionProps) => {
    const context = useFormContext<TourFormValues>();
    const register = context?.register ?? (() => ({} as any));
    const errors = context?.formState?.errors ?? {};
    const controlled = variant === 'edit' && values && onChange;

    const buildInputProps = (field: BasicDetailsField, name: keyof TourFormValues) => {
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

    const buildSelectProps = (field: BasicDetailsField, name: keyof TourFormValues) => {
        if (controlled) {
            const rawValue = values?.[field];
            const value = typeof rawValue === 'string' ? rawValue : '';
            return {
                value,
                onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange(field, event.target.value),
            };
        }

        return register(name);
    };

    const mealPlanProps = controlled
        ? {
              value: typeof values?.food === 'string' ? values.food : '',
              onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange('food', event.target.value),
          }
        : register('food');

    return (
        <section className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-linear-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border border-blue-500/20">
                <div className="p-2 rounded-lg bg-blue-500/20">
                    <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <p className="text-sm text-white/50">{description}</p>
                </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {primaryFields
                    .filter((f) => (f.field !== 'hotelNights' || showHotelNights) && (f.field !== 'number' || showNumber))
                    .map(({ field, label, placeholder, name, inputMode, pattern, isSelect }) => (
                        <div key={field}>
                            {isSelect ? (
                                <>
                                    <label className="mb-2 block text-sm font-medium text-white/60">{label}</label>
                                    <select
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                                        {...buildSelectProps(field, name)}
                                    >
                                        <option value="" disabled>
                                            {placeholder}
                                        </option>
                                        {DESTINATIONS.map((destination) => (
                                            <option key={destination} value={destination}>
                                                {destination}
                                            </option>
                                        ))}
                                    </select>
                                </>
                            ) : (
                                <FormInput
                                    labelText={label}
                                    placeholder={placeholder}
                                    autoComplete="off"
                                    inputMode={inputMode}
                                    pattern={pattern}
                                    {...buildInputProps(field, name)}
                                />
                            )}
                            {!controlled && errors[name] && (
                                <p className="text-xs text-red-500 mt-1">{errors[name]?.message as string}</p>
                            )}
                        </div>
                    ))}
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {dateFields.map(({ field, label, name }) => (
                    <div key={field}>
                        <FormInput
                            labelText={label}
                            placeholder="30/01/2021"
                            autoComplete="off"
                            formatType="date"
                            {...buildInputProps(field, name)}
                        />
                        {!controlled && errors[name] && (
                            <p className="text-xs text-red-500 mt-1">{errors[name]?.message as string}</p>
                        )}
                    </div>
                ))}
            </div>
            {showMealPlan && (
                <div>
                    <label className="mb-2 block text-sm font-medium text-white/60">Харчування</label>
                    <select
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                        {...mealPlanProps}
                    >
                        <option value="" disabled>
                            Виберіть опцію
                        </option>
                        <option value="Breakfast">Сніданок</option>
                        <option value="Half Board">Напівпансіон</option>
                        <option value="Full Board">Повний пансіон</option>
                        <option value="All Inclusive">Все включено</option>
                    </select>
                    {!controlled && errors.food && (
                        <p className="text-xs text-red-500 mt-1">{errors.food.message as string}</p>
                    )}
                </div>
            )}
        </section>
    );
};
