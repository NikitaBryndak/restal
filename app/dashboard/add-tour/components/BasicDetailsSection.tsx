import { ChangeEvent } from 'react';

import FormInput from '@/components/ui/form-input';

export type BasicDetailsField = 'country' | 'region' | 'hotelNights' | 'tripStartDate' | 'tripEndDate' | 'food';

type BasicDetailsValues = Partial<Record<BasicDetailsField, string | number>>;

type BasicDetailsSectionProps = {
    variant?: 'create' | 'edit';
    values?: BasicDetailsValues;
    onChange?: (field: BasicDetailsField, value: string) => void;
    title?: string;
    description?: string;
    showHotelNights?: boolean;
    showMealPlan?: boolean;
};

const primaryFields: Array<{
    field: BasicDetailsField;
    label: string;
    placeholder: string;
    name: string;
    formatType?: 'date';
    inputMode?: 'numeric';
    pattern?: string;
}> = [
    { field: 'country', label: 'Destination', placeholder: 'Spain, Italy, Greece...', name: 'country' },
    { field: 'region', label: 'Region', placeholder: 'Hurghada, Tuscany, Santorini...', name: 'region' },
    { field: 'hotelNights', label: 'Hotel nights', placeholder: 'e.g. 7', name: 'hotelNights', inputMode: 'numeric', pattern: '[0-9]*' },
];

const dateFields: Array<{ field: Extract<BasicDetailsField, 'tripStartDate' | 'tripEndDate'>; label: string; name: string }> = [
    { field: 'tripStartDate', label: 'Departure date', name: 'tripStartDate' },
    { field: 'tripEndDate', label: 'Return date', name: 'tripEndDate' },
];

export const BasicDetailsSection = ({
    variant = 'create',
    values,
    onChange,
    title = 'Basic details',
    description = 'Start with the headline facts about this getaway.',
    showHotelNights = true,
    showMealPlan = true,
}: BasicDetailsSectionProps) => {
    const controlled = variant === 'edit' && values && onChange;

    const buildInputProps = (field: BasicDetailsField) => {
        if (!controlled) {
            return {};
        }

        const rawValue = values?.[field];
        const value = typeof rawValue === 'number' ? String(rawValue ?? '') : rawValue ?? '';

        return {
            value,
            onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(field, event.target.value),
        };
    };

    const mealPlanProps = controlled
        ? {
              value: typeof values?.food === 'string' ? values.food : '',
              onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange('food', event.target.value),
          }
        : { defaultValue: '' };

    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-foreground/60">{description}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {primaryFields
                    .filter((field) => field.field !== 'hotelNights' || showHotelNights)
                    .map(({ field, label, placeholder, name, inputMode, pattern }) => (
                        <FormInput
                            key={field}
                            labelText={label}
                            placeholder={placeholder}
                            name={name}
                            autoComplete="off"
                            inputMode={inputMode}
                            pattern={pattern}
                            {...buildInputProps(field)}
                        />
                    ))}
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {dateFields.map(({ field, label, name }) => (
                    <FormInput
                        key={field}
                        labelText={label}
                        placeholder="30/01/2021"
                        name={name}
                        autoComplete="off"
                        formatType="date"
                        {...buildInputProps(field)}
                    />
                ))}
            </div>
            {showMealPlan && (
                <div>
                    <label className="mb-2 block text-sm font-medium text-foreground/80">Meal plan</label>
                    <select
                        name="food"
                        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        {...mealPlanProps}
                    >
                        <option value="" disabled>
                            Select an option
                        </option>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Half Board">Half board</option>
                        <option value="Full Board">Full board</option>
                        <option value="All Inclusive">All inclusive</option>
                    </select>
                </div>
            )}
        </section>
    );
};
