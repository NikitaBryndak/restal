import { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import FormInput from '@/components/ui/form-input';
import { FlightInfo } from '@/types';
import { TourFormValues } from '../schema';

type FlightSegment = 'departure' | 'arrival';
type FlightField = keyof FlightInfo['departure'];

type FlightsSectionProps = {
    variant?: 'create' | 'edit';
    values?: FlightInfo;
    onChange?: (segment: FlightSegment, field: FlightField, value: string) => void;
    title?: string;
    description?: string;
};

const segmentCopy: Record<FlightSegment, { heading: string }> = {
    departure: { heading: 'Виліт' },
    arrival: { heading: 'Повернення' },
};

const fieldMeta: Record<FlightField, { label: string; placeholder: string; nameSuffix: string; formatType?: 'date' | 'time' }> = {
    country: { label: 'Країна', placeholder: 'напр. Іспанія', nameSuffix: 'Country' },
    airportCode: { label: 'Код аеропорту', placeholder: 'напр. MAD', nameSuffix: 'Airport' },
    flightNumber: { label: 'Номер рейсу', placeholder: 'напр. IB1234', nameSuffix: 'Flight' },
    date: { label: 'Дата', placeholder: '30/01/2021', nameSuffix: 'Date', formatType: 'date' },
    time: { label: 'Час', placeholder: '11:35', nameSuffix: 'Time', formatType: 'time' },
};

export const FlightsSection = ({
    variant = 'create',
    values,
    onChange,
    title = 'Рейси',
    description = 'Деталі рейсів туди та назад для маршруту.',
}: FlightsSectionProps) => {
    const context = useFormContext<TourFormValues>();
    const register = context?.register ?? (() => ({} as any));
    const errors = context?.formState?.errors ?? {};
    const controlled = variant === 'edit' && values && onChange;

    const handleFieldChange = (
        segment: FlightSegment,
        field: FlightField,
    ) => (event: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(segment, field, event.target.value);
        }
    };

    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-foreground/60">{description}</p>
            </div>
            <div className="grid gap-6">
                {(['departure', 'arrival'] as const).map((segment) => (
                    <div key={segment} className="rounded-2xl border border-border/40 bg-white/70 p-5 dark:bg-white/5">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                            {segmentCopy[segment].heading}
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {(Object.keys(fieldMeta) as FlightField[]).map((field) => {
                                const meta = fieldMeta[field];
                                const fieldName = `${segment}${meta.nameSuffix}` as keyof TourFormValues;

                                const inputProps = controlled
                                    ? {
                                          value: values?.[segment]?.[field] ?? '',
                                          onChange: handleFieldChange(segment, field),
                                      }
                                    : register(fieldName);

                                return (
                                    <div key={`${segment}-${field}`}>
                                        <FormInput
                                            labelText={meta.label}
                                            placeholder={meta.placeholder}
                                            autoComplete="off"
                                            formatType={meta.formatType}
                                            {...inputProps}
                                        />
                                        {!controlled && errors[fieldName] && (
                                            <p className="text-xs text-red-500 mt-1">{errors[fieldName]?.message as string}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
