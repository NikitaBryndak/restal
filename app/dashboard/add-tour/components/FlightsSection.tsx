import { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import FormInput from '@/components/ui/form-input';
import { FlightInfo } from '@/types';
import { TourFormValues } from '../schema';
import { Plane, PlaneTakeoff, PlaneLanding } from 'lucide-react';

type FlightSegment = 'departure' | 'arrival';
type FlightField = keyof FlightInfo['departure'];

type FlightsSectionProps = {
    variant?: 'create' | 'edit';
    values?: FlightInfo;
    onChange?: (segment: FlightSegment, field: FlightField, value: string) => void;
    title?: string;
    description?: string;
    // Auto-fill props (for display info only)
    tripStartDate?: string;
    tripEndDate?: string;
    tourCountry?: string;
};

const segmentCopy: Record<FlightSegment, { heading: string }> = {
    departure: { heading: 'Виліт' },
    arrival: { heading: 'Повернення' },
};

// Fields that need manual input for departure: country, airport, flight number, time
// Fields that need manual input for arrival: airport, flight number, time (country auto-fills from tour country)
const departureFields: FlightField[] = ['country', 'airportCode', 'flightNumber', 'time'];
const arrivalFields: FlightField[] = ['airportCode', 'flightNumber', 'time'];

const fieldMeta: Record<FlightField, { label: string; placeholder: string; nameSuffix: string; formatType?: 'date' | 'time' }> = {
    country: { label: 'Країна', placeholder: 'напр. Україна', nameSuffix: 'Country' },
    airportCode: { label: 'Код аеропорту', placeholder: 'напр. KBP', nameSuffix: 'Airport' },
    flightNumber: { label: 'Номер рейсу', placeholder: 'напр. PS101', nameSuffix: 'Flight' },
    date: { label: 'Дата', placeholder: '30/01/2021', nameSuffix: 'Date', formatType: 'date' },
    time: { label: 'Час', placeholder: '11:35', nameSuffix: 'Time', formatType: 'time' },
};

export const FlightsSection = ({
    variant = 'create',
    values,
    onChange,
    title = 'Рейси',
    description = 'Деталі рейсів туди та назад. Дата вильоту = дата початку туру, дата прильоту = дата закінчення туру, країна повернення = країна туру.',
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

    // Get the fields to display for each segment
    const getFieldsForSegment = (segment: FlightSegment): FlightField[] => {
        return segment === 'departure' ? departureFields : arrivalFields;
    };

    return (
        <section className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-linear-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 border border-sky-500/20">
                <div className="p-2 rounded-lg bg-sky-500/20">
                    <Plane className="w-5 h-5 text-sky-400" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <p className="text-sm text-white/50">{description}</p>
                </div>
            </div>
            <div className="grid gap-6">
                {(['departure', 'arrival'] as const).map((segment) => (
                    <div key={segment} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            {segment === 'departure' ? (
                                <PlaneTakeoff className="w-4 h-4 text-sky-500" />
                            ) : (
                                <PlaneLanding className="w-4 h-4 text-indigo-500" />
                            )}
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                                {segmentCopy[segment].heading}
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {getFieldsForSegment(segment).map((field) => {
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
