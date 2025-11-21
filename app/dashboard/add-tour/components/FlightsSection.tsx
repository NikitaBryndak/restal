import { ChangeEvent } from 'react';

import FormInput from '@/components/ui/form-input';
import { FlightInfo } from '@/types';

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
    departure: { heading: 'Departure' },
    arrival: { heading: 'Return' },
};

const fieldMeta: Record<FlightField, { label: string; placeholder: string; name: string; formatType?: 'date' | 'time' }> = {
    country: { label: 'Country', placeholder: 'e.g. Spain', name: 'country' },
    airportCode: { label: 'Airport code', placeholder: 'e.g. MAD', name: 'airport' },
    flightNumber: { label: 'Flight number', placeholder: 'e.g. IB1234', name: 'flight' },
    date: { label: 'Date', placeholder: '30/01/2021', name: 'date', formatType: 'date' },
    time: { label: 'Time', placeholder: '11:35', name: 'time', formatType: 'time' },
};

export const FlightsSection = ({
    variant = 'create',
    values,
    onChange,
    title = 'Flights',
    description = 'Outbound and return flight details for the itinerary.',
}: FlightsSectionProps) => {
    const handleFieldChange = (
        segment: FlightSegment,
        field: FlightField,
    ) => (event: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(segment, field, event.target.value);
        }
    };

    const controlled = variant === 'edit' && values && onChange;

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
                                const inputProps = controlled
                                    ? {
                                          value: values?.[segment]?.[field] ?? '',
                                          onChange: handleFieldChange(segment, field),
                                      }
                                    : {};

                                return (
                                    <FormInput
                                        key={`${segment}-${field}`}
                                        labelText={meta.label}
                                        placeholder={meta.placeholder}
                                        name={`${segment}${meta.name.charAt(0).toUpperCase()}${meta.name.slice(1)}`}
                                        autoComplete="off"
                                        formatType={meta.formatType}
                                        {...inputProps}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
