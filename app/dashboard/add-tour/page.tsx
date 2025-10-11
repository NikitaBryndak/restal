'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import TripCard from '@/components/trip/trip-card';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';

type PreviewState = {
    country: string;
    bookingDate: string;
    tripStartDate: string;
    tripEndDate: string;
    hotelNights: string;
    food: string;
    hotelName: string;
    departure: {
        country: string;
        airportCode: string;
        flightNumber: string;
        date: string;
        time: string;
    };
    arrival: {
        country: string;
        airportCode: string;
        flightNumber: string;
        date: string;
        time: string;
    };
    addons: {
        insurance: boolean;
        transfer: boolean;
    };
    travellerName: string;
    travellerSurname: string;
    travellerPassportExpiry: string;
    travellerDOB: string;
};

const blankPreview: PreviewState = {
    country: '',
    bookingDate: '',
    tripStartDate: '',
    tripEndDate: '',
    hotelNights: '',
    food: '',
    hotelName: '',
    departure: {
        country: '',
        airportCode: '',
        flightNumber: '',
        date: '',
        time: '',
    },
    arrival: {
        country: '',
        airportCode: '',
        flightNumber: '',
        date: '',
        time: '',
    },
    addons: {
        insurance: false,
        transfer: false,
    },
    travellerName: '',
    travellerSurname: '',
    travellerPassportExpiry: '',
    travellerDOB: '',
};

export default function AddTourPage() {
    const formRef = useRef<HTMLFormElement | null>(null);
    const [previewState, setPreviewState] = useState<PreviewState>(blankPreview);

    const parseForm = useCallback(() => {
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);

        const value = (key: string) => (formData.get(key) as string) ?? '';
        const boolValue = (key: string) => formData.get(key) === 'on';

        setPreviewState({
            country: value('country').trim(),
            bookingDate: value('bookingDate').trim(),
            tripStartDate: value('tripStartDate').trim(),
            tripEndDate: value('tripEndDate').trim(),
            hotelNights: value('hotelNights').trim(),
            food: value('food').trim(),
            hotelName: value('hotelName').trim(),
            departure: {
                country: value('departureCountry').trim(),
                airportCode: value('departureAirport').trim(),
                flightNumber: value('departureFlight').trim(),
                date: value('departureDate').trim(),
                time: value('departureTime').trim(),
            },
            arrival: {
                country: value('arrivalCountry').trim(),
                airportCode: value('arrivalAirport').trim(),
                flightNumber: value('arrivalFlight').trim(),
                date: value('arrivalDate').trim(),
                time: value('arrivalTime').trim(),
            },
            addons: {
                insurance: boolValue('insurance'),
                transfer: boolValue('transfer'),
            },
            travellerName: value('travellerName').trim(),
            travellerSurname: value('travellerSurname').trim(),
            travellerPassportExpiry: value('travellerPassportExpiry').trim(),
            travellerDOB: value('travellerDOB').trim(),
        });
    }, []);

    useEffect(() => {
        parseForm();
    }, [parseForm]);

    const handleFormInteraction = useCallback(() => {
        parseForm();
    }, [parseForm]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const traveller = {
            name: formData.get('travellerName') as string || 'Traveller',
            surname: formData.get('travellerSurname') as string || 'Pending',
            pasportExpiryDate: formData.get('travellerPassportExpiry') as string || '',
            DOB: formData.get('travellerDOB') as string || ''
        };

        const payload = {
            country: formData.get('country') as string,
            bookingDate: formData.get('bookingDate') as string,
            tripStartDate: formData.get('tripStartDate') as string,
            tripEndDate: formData.get('tripEndDate') as string,
            hotelNights: Number(formData.get('hotelNights') ?? 0),
            food: formData.get('food') as string,
            hotel: {
                name: formData.get('hotelName') as string,
            },
            flightInfo: {
                departure: {
                    country: (formData.get('departureCountry') as string) || (formData.get('country') as string) || '',
                    airportCode: formData.get('departureAirport') as string,
                    flightNumber: formData.get('departureFlight') as string,
                    date: formData.get('departureDate') as string,
                    time: formData.get('departureTime') as string,
                },
                arrival: {
                    country: (formData.get('arrivalCountry') as string) || (formData.get('country') as string) || '',
                    airportCode: formData.get('arrivalAirport') as string,
                    flightNumber: formData.get('arrivalFlight') as string,
                    date: formData.get('arrivalDate') as string,
                    time: formData.get('arrivalTime') as string,
                },
            },
            tourists: [traveller],
            addons: {
                insurance: formData.get('insurance') === 'on',
                transfer: formData.get('transfer') === 'on',
            },
        };

        console.log('Create tour payload', payload);
        // Send payload to server API to create trip associated with current user
        fetch('/api/trips', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).then(async (res) => {
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert('Error creating trip: ' + (data.message || res.statusText));
                return;
            }

            alert('Trip created');
            // Optionally, you may redirect to /dashboard/trips or clear the form
            window.location.href = '/dashboard/trips';
        }).catch((err) => {
            console.error('Create trip error', err);
            alert('Error creating trip');
        });
    };

    const previewData = useMemo(() => {
        const nights = Number.parseInt(previewState.hotelNights, 10);
        return {
            country: previewState.country || 'Destination',
            bookingDate: previewState.bookingDate || '—',
            tripStartDate: previewState.tripStartDate || '—',
            tripEndDate: previewState.tripEndDate || '—',
            hotelNights: Number.isNaN(nights) ? 0 : nights,
            food: previewState.food || 'Meal plan TBD',
            flightInfo: {
                departure: {
                    airportCode: previewState.departure.airportCode || '—',
                    country: '—',
                    flightNumber: previewState.departure.flightNumber || '—',
                    date: previewState.departure.date || '—',
                    time: previewState.departure.time || '—',
                },
                arrival: {
                    airportCode: previewState.arrival.airportCode || '—',
                    country: '—',
                    flightNumber: previewState.arrival.flightNumber || '—',
                    date: previewState.arrival.date || '—',
                    time: previewState.arrival.time || '—',
                },
            },
            hotel: {
                name: previewState.hotelName || 'Hotel to be confirmed',
            },
            tourists: [{ name: 'Traveller', surname: 'Pending', pasportExpiryDate: '—', DOB: '' }],
            addons: previewState.addons,
        };
    }, [previewState]);

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
                <header className="space-y-2 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/40">Tours</p>
                    <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">Add a new tour</h1>
                    <p className="text-sm text-foreground/60">Register a new tour for a client.</p>
                </header>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                    <form
                        ref={formRef}
                        onSubmit={handleSubmit}
                        onInput={handleFormInteraction}
                        onChange={handleFormInteraction}
                        className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8"
                    >
                        <div className="space-y-10">
                            {/* Basic details */}
                            <section className="space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-lg font-semibold text-foreground">Basic details</h2>
                                    <p className="text-sm text-foreground/60">Start with the headline facts about this getaway.</p>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                    <FormInput
                                        labelText="Destination"
                                        placeholder="Spain, Italy, Greece..."
                                        name="country"
                                        autoComplete="off"
                                    />
                                    <FormInput
                                        labelText="Booking date"
                                        placeholder="DD-MM-YYYY"
                                        name="bookingDate"
                                        autoComplete="off"
                                    />
                                    <FormInput
                                        labelText="Hotel nights"
                                        placeholder="e.g. 7"
                                        name="hotelNights"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                    />
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <FormInput
                                        labelText="Departure date"
                                        placeholder="DD-MM-YYYY"
                                        name="tripStartDate"
                                        autoComplete="off"
                                    />
                                    <FormInput
                                        labelText="Return date"
                                        placeholder="DD-MM-YYYY"
                                        name="tripEndDate"
                                        autoComplete="off"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground/80">Meal plan</label>
                                    <select
                                        name="food"
                                        defaultValue=""
                                        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                            </section>

                            {/* Flights */}
                            <section className="space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-lg font-semibold text-foreground">Flights</h2>
                                    <p className="text-sm text-foreground/60">Outbound and return flight details for the itinerary.</p>
                                </div>
                                <div className="grid gap-6">
                                    <div className="rounded-2xl border border-border/40 bg-white/70 p-5 dark:bg-white/5">
                                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                                            Departure
                                        </p>
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                                <FormInput
                                                    labelText="Country"
                                                    placeholder="e.g. Spain"
                                                    name="departureCountry"
                                                    autoComplete="off"
                                                />
                                                <FormInput
                                                    labelText="Airport code"
                                                    placeholder="e.g. MAD"
                                                    name="departureAirport"
                                                    autoComplete="off"
                                                />
                                            <FormInput
                                                labelText="Flight number"
                                                placeholder="e.g. IB1234"
                                                name="departureFlight"
                                                autoComplete="off"
                                            />
                                            <FormInput
                                                labelText="Date"
                                                placeholder="DD-MM-YYYY"
                                                name="departureDate"
                                                autoComplete="off"
                                            />
                                            <FormInput
                                                labelText="Time"
                                                placeholder="HH:MM"
                                                name="departureTime"
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-border/40 bg-white/70 p-5 dark:bg-white/5">
                                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                                            Return
                                        </p>
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                            <FormInput
                                                labelText="Country"
                                                placeholder="e.g. Spain"
                                                name="arrivalCountry"
                                                autoComplete="off"
                                            />
                                            <FormInput
                                                labelText="Airport code"
                                                placeholder="e.g. MAD"
                                                name="arrivalAirport"
                                                autoComplete="off"
                                            />
                                            <FormInput
                                                labelText="Flight number"
                                                placeholder="e.g. IB5678"
                                                name="arrivalFlight"
                                                autoComplete="off"
                                            />
                                            <FormInput
                                                labelText="Date"
                                                placeholder="DD-MM-YYYY"
                                                name="arrivalDate"
                                                autoComplete="off"
                                            />
                                            <FormInput
                                                labelText="Time"
                                                placeholder="HH:MM"
                                                name="arrivalTime"
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Primary traveller */}
                            <section className="space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-lg font-semibold text-foreground">Primary traveller</h2>
                                    <p className="text-sm text-foreground/60">Main traveller details — at least name and passport expiry.</p>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                                    <FormInput
                                        labelText="First name"
                                        placeholder="e.g. John"
                                        name="travellerName"
                                        autoComplete="off"
                                    />
                                    <FormInput
                                        labelText="Surname"
                                        placeholder="e.g. Doe"
                                        name="travellerSurname"
                                        autoComplete="off"
                                    />
                                    <FormInput
                                        labelText="Passport expiry"
                                        placeholder="DD-MM-YYYY"
                                        name="travellerPassportExpiry"
                                        autoComplete="off"
                                    />
                                    <FormInput
                                        labelText="DOB"
                                        placeholder="DD-MM-YYYY"
                                        name="travellerDOB"
                                        autoComplete="off"
                                    />
                                </div>
                            </section>

                            {/* Stay */}
                            <section className="space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-lg font-semibold text-foreground">Stay</h2>
                                    <p className="text-sm text-foreground/60">Where travellers will be staying during the tour.</p>
                                </div>
                                <div className="max-w-md">
                                    <FormInput
                                        labelText="Hotel name"
                                        placeholder="Resort or hotel name"
                                        name="hotelName"
                                        autoComplete="off"
                                    />
                                </div>
                            </section>

                            {/* Extras */}
                            <section className="space-y-4">
                                <div className="space-y-2">
                                    <h2 className="text-lg font-semibold text-foreground">Extras</h2>
                                    <p className="text-sm text-foreground/60">Optional add-ons for peace of mind.</p>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                                    <label className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                                        <input
                                            type="checkbox"
                                            name="insurance"
                                            className="size-4 rounded border border-border/60 text-primary focus:ring-primary/30"
                                        />
                                        Travel insurance
                                    </label>
                                    <label className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                                        <input
                                            type="checkbox"
                                            name="transfer"
                                            className="size-4 rounded border border-border/60 text-primary focus:ring-primary/30"
                                        />
                                        Airport transfer
                                    </label>
                                </div>
                            </section>
                        </div>

                        <div className="mt-10 flex justify-end border-t border-border/40 pt-6">
                            <Button type="submit" size="lg" className="px-8">
                                Create tour
                            </Button>
                        </div>
                    </form>

                    <aside className="sticky top-24 h-fit space-y-4">
                        <div className="rounded-3xl border border-border/40 bg-white/70 p-4 backdrop-blur-xl dark:bg-white/10">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                                Live preview
                            </p>
                        </div>
                        {previewState.country ? (
                            <TripCard data={previewData} />
                        ) : (
                            <div className="rounded-3xl border border-dashed border-border/50 p-6 text-center text-sm text-foreground/50">
                                Add a destination above to see the live preview.
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
