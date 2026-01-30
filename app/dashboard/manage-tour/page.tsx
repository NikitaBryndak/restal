'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormInput from '@/components/ui/form-input';
import { Label } from '@/components/ui/label';
import { Trip, Documents, Tourist, FlightInfo, Hotel, Payment, Addons, DEFAULT_DOCUMENTS, DOCUMENT_KEYS, DOCUMENT_LABELS } from '@/types';
import { validateDate } from '@/lib/utils';
import {
    BasicDetailsSection,
    PhoneSection,
    FlightsSection,
    StaySection,
    ExtrasSection,
    PaymentSection,
    TravellerSection,
    DocumentsSection,
} from '../add-tour/components';
import type { BasicDetailsField } from '../add-tour/components';

type EditableTourist = Tourist & {
    PasportNumber?: string;
    PasportSeries?: string;
    PasportIsueDate?: string;
};

type EditableTrip = Omit<Trip, 'tourists' | 'documents'> & {
    tourists: EditableTourist[];
    documents: Documents;
    managerEmail?: string;
    region?: string;
};

type RawTrip = EditableTrip & {
    _id?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
};

const normalizeDocuments = (documents?: Partial<Documents>): Documents => {
    return DOCUMENT_KEYS.reduce((acc, key) => {
        const fallback = DEFAULT_DOCUMENTS[key];
        const original = documents?.[key];
        acc[key] = {
            uploaded: original?.uploaded ?? fallback.uploaded,
            url: original?.url ?? fallback.url,
        };
        return acc;
    }, {} as Documents);
};

const normalizeTourists = (tourists: any[] | undefined): EditableTourist[] => {
    if (!Array.isArray(tourists) || tourists.length === 0) {
        return [
            {
                name: '',
                surname: '',
                sex: '',
                pasportExpiryDate: '',
                DOB: '',
                PasportNumber: '',
                PasportSeries: '',
                PasportIsueDate: '',
            },
        ];
    }

    return tourists.map((tourist) => ({
        name: tourist?.name ?? '',
        surname: tourist?.surname ?? '',
        sex: tourist?.sex ?? '',
        pasportExpiryDate: tourist?.pasportExpiryDate ?? '',
        DOB: tourist?.DOB ?? '',
        PasportNumber: tourist?.PasportNumber ?? tourist?.passportNumber ?? '',
        PasportSeries: tourist?.PasportSeries ?? tourist?.passportSeries ?? '',
        PasportIsueDate: tourist?.PasportIsueDate ?? tourist?.passportIssueDate ?? '',
    }));
};

const normalizeTrip = (raw: any): RawTrip => {
    const documents = normalizeDocuments(raw?.documents);
    const tourists = normalizeTourists(raw?.tourists);

    return {
        _id: raw?._id ?? undefined,
        number: raw?.number ?? 0,
        bookingDate: raw?.bookingDate ?? '',
        tripStartDate: raw?.tripStartDate ?? '',
        tripEndDate: raw?.tripEndDate ?? '',
        country: raw?.country ?? '',
        flightInfo: {
            departure: {
                airportCode: raw?.flightInfo?.departure?.airportCode ?? '',
                country: raw?.flightInfo?.departure?.country ?? '',
                flightNumber: raw?.flightInfo?.departure?.flightNumber ?? '',
                date: raw?.flightInfo?.departure?.date ?? '',
                time: raw?.flightInfo?.departure?.time ?? '',
            },
            arrival: {
                airportCode: raw?.flightInfo?.arrival?.airportCode ?? '',
                country: raw?.flightInfo?.arrival?.country ?? '',
                flightNumber: raw?.flightInfo?.arrival?.flightNumber ?? '',
                date: raw?.flightInfo?.arrival?.date ?? '',
                time: raw?.flightInfo?.arrival?.time ?? '',
            },
        },
        hotel: {
            name: raw?.hotel?.name ?? '',
            checkIn: raw?.hotel?.checkIn ?? '',
            checkOut: raw?.hotel?.checkOut ?? '',
            food: raw?.hotel?.food ?? '',
            nights: Number(raw?.hotel?.nights ?? 0),
            roomType: raw?.hotel?.roomType ?? '',
        },
        tourists,
        addons: {
            insurance: Boolean(raw?.addons?.insurance),
            transfer: Boolean(raw?.addons?.transfer),
        },
        documents,
        payment: {
            totalAmount: Number(raw?.payment?.totalAmount ?? 0),
            paidAmount: Number(raw?.payment?.paidAmount ?? 0),
            deadline: raw?.payment?.deadline ?? '',
        },
        ownerPhone: raw?.ownerPhone ?? '',
        managerPhone: raw?.managerPhone ?? raw?.ownerPhone ?? undefined,
        region: raw?.region ?? '',
        createdAt: raw?.createdAt ?? undefined,
        updatedAt: raw?.updatedAt ?? undefined,
    };
};

const serialiseTourists = (tourists: EditableTourist[]) => {
    return tourists.map((tourist) => ({
        name: tourist.name ?? '',
        surname: tourist.surname ?? '',
        sex: tourist.sex ?? '',
        pasportExpiryDate: tourist.pasportExpiryDate ?? '',
        DOB: tourist.DOB ?? '',
        PasportNumber: tourist.PasportNumber ?? '',
        PasportSeries: tourist.PasportSeries ?? '',
        PasportIsueDate: tourist.PasportIsueDate ?? '',
    }));
};

const isBlank = (value: unknown): boolean => typeof value !== 'string' || value.trim().length === 0;

const validateTripData = (data: RawTrip): string | null => {
    if (isBlank(data.ownerPhone)) return 'Owner phone is required.';
    if (isBlank(data.country)) return 'Destination country is required.';
    if (isBlank(data.region)) return 'Region is required.';

    if (isBlank(data.bookingDate)) return 'Booking date is required.';
    if (validateDate(data.bookingDate)) return `Booking date: ${validateDate(data.bookingDate)}`;

    if (isBlank(data.tripStartDate)) return 'Trip start date is required.';
    if (validateDate(data.tripStartDate)) return `Trip start date: ${validateDate(data.tripStartDate)}`;

    if (isBlank(data.tripEndDate)) return 'Trip end date is required.';
    if (validateDate(data.tripEndDate)) return `Trip end date: ${validateDate(data.tripEndDate)}`;

    const { flightInfo } = data;
    if (isBlank(flightInfo.departure.country)) return 'Departure country is required.';
    if (isBlank(flightInfo.departure.airportCode)) return 'Departure airport code is required.';
    if (isBlank(flightInfo.departure.flightNumber)) return 'Departure flight number is required.';

    if (isBlank(flightInfo.departure.date)) return 'Departure date is required.';
    if (validateDate(flightInfo.departure.date)) return `Departure date: ${validateDate(flightInfo.departure.date)}`;

    if (isBlank(flightInfo.departure.time)) return 'Departure time is required.';

    if (isBlank(flightInfo.arrival.country)) return 'Return country is required.';
    if (isBlank(flightInfo.arrival.airportCode)) return 'Return airport code is required.';
    if (isBlank(flightInfo.arrival.flightNumber)) return 'Return flight number is required.';

    if (isBlank(flightInfo.arrival.date)) return 'Return date is required.';
    if (validateDate(flightInfo.arrival.date)) return `Return date: ${validateDate(flightInfo.arrival.date)}`;

    if (isBlank(flightInfo.arrival.time)) return 'Return time is required.';

    const { hotel } = data;
    if (isBlank(hotel.name)) return 'Hotel name is required.';

    if (isBlank(hotel.checkIn)) return 'Hotel check-in date is required.';
    if (validateDate(hotel.checkIn)) return `Hotel check-in date: ${validateDate(hotel.checkIn)}`;

    if (isBlank(hotel.checkOut)) return 'Hotel check-out date is required.';
    if (validateDate(hotel.checkOut)) return `Hotel check-out date: ${validateDate(hotel.checkOut)}`;

    if (isBlank(hotel.food)) return 'Meal plan is required.';
    if (!Number.isFinite(hotel.nights) || hotel.nights <= 0) return 'Hotel nights must be greater than zero.';
    if (isBlank(hotel.roomType)) return 'Room type is required.';

    const { payment } = data;
    if (!Number.isFinite(payment.totalAmount) || payment.totalAmount <= 0) return 'Total amount must be greater than zero.';
    if (!Number.isFinite(payment.paidAmount) || payment.paidAmount < 0) return 'Paid amount must be zero or a positive number.';
    if (payment.paidAmount > payment.totalAmount) return 'Paid amount cannot exceed total amount.';

    if (isBlank(payment.deadline)) return 'Payment deadline is required.';
    if (validateDate(payment.deadline)) return `Payment deadline: ${validateDate(payment.deadline)}`;

    if (!Array.isArray(data.tourists) || data.tourists.length === 0) {
        return 'At least one traveller is required.';
    }

    for (let index = 0; index < data.tourists.length; index += 1) {
        const traveller = data.tourists[index];
        if (isBlank(traveller.name)) return `Traveller #${index + 1} first name is required.`;
        if (isBlank(traveller.surname)) return `Traveller #${index + 1} surname is required.`;
        if (isBlank(traveller.sex)) return `Traveller #${index + 1} sex is required.`;

        if (isBlank(traveller.DOB)) return `Traveller #${index + 1} date of birth is required.`;
        if (validateDate(traveller.DOB ?? '')) return `Traveller #${index + 1} DOB: ${validateDate(traveller.DOB ?? '')}`;

        if (isBlank(traveller.pasportExpiryDate)) return `Traveller #${index + 1} passport expiry is required.`;
        if (validateDate(traveller.pasportExpiryDate)) return `Traveller #${index + 1} passport expiry: ${validateDate(traveller.pasportExpiryDate)}`;

        if (isBlank(traveller.PasportNumber)) return `Traveller #${index + 1} passport number is required.`;
        if (isBlank(traveller.PasportSeries)) return `Traveller #${index + 1} passport series is required.`;

        if (isBlank(traveller.PasportIsueDate)) return `Traveller #${index + 1} passport issue date is required.`;
        if (validateDate(traveller.PasportIsueDate ?? '')) return `Traveller #${index + 1} passport issue date: ${validateDate(traveller.PasportIsueDate ?? '')}`;
    }

    return null;
};

export default function ManageTourPage() {
    const [searchValue, setSearchValue] = useState('');
    const [trip, setTrip] = useState<RawTrip | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const documentKeys = useMemo(() => DOCUMENT_KEYS, []);
    const buildEmptyPendingFiles = useCallback(
        () =>
            documentKeys.reduce(
                (acc, key) => {
                    acc[key] = null;
                    return acc;
                },
                {} as Record<keyof Documents, File | null>,
            ),
        [documentKeys],
    );
    const [pendingFiles, setPendingFiles] = useState<Record<keyof Documents, File | null>>(buildEmptyPendingFiles);

    useEffect(() => {
        setPendingFiles(buildEmptyPendingFiles());
    }, [trip?._id, buildEmptyPendingFiles]);

    const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const identifier = searchValue.trim();

        if (!identifier) {
            setErrorMessage('Enter a tour number (e.g. Trip #5468189) or internal ID to continue.');
            setTrip(null);
            setActiveId(null);
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(`/api/trips/manage/${encodeURIComponent(identifier)}`);
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload?.message ?? 'Unable to locate the requested tour.');
            }

            const nextTrip = normalizeTrip(payload.trip);
            setTrip(nextTrip);
            setActiveId(identifier);
        } catch (error: any) {
            console.error('Manager lookup failed', error);
            setErrorMessage(error?.message ?? 'Unable to locate the requested tour.');
            setTrip(null);
            setActiveId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!trip || !activeId) {
            return;
        }

        const validationError = validateTripData(trip);
        if (validationError) {
            setErrorMessage(validationError);
            setSuccessMessage(null);
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            // 1. Upload pending documents first
            const currentDocuments = { ...trip.documents }; // Clone from state

            for (const key of DOCUMENT_KEYS) {
                const file = pendingFiles[key];
                if (file) {
                    console.log(`Uploading file for ${key}:`, file.name);
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('folder', 'documents');

                    try {
                        const uploadRes = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                        });

                        if (uploadRes.ok) {
                            const { url } = await uploadRes.json();
                            console.log(`Upload successful for ${key}. URL:`, url);
                            currentDocuments[key] = {
                                ...currentDocuments[key],
                                url: url,
                                uploaded: true // Mark as uploaded since we just did it
                            };
                        } else {
                            const errorText = await uploadRes.text();
                            console.error(`Failed to upload ${key}`, errorText);
                            throw new Error(`Failed to upload ${DOCUMENT_LABELS[key]}: ${errorText}`);
                        }
                    } catch (uploadError: any) {
                         console.error(`Upload error for ${key}:`, uploadError);
                         setErrorMessage(uploadError.message || `Error uploading ${DOCUMENT_LABELS[key]}`);
                         setIsSaving(false);
                         return; // Abort save on upload failure
                    }
                }
            }

            // 2. Prepare payload with updated documents
            const { createdAt, updatedAt, ...rest } = trip;
            const payload = {
                ...rest,
                hotel: {
                    ...rest.hotel,
                    nights: Number(rest.hotel.nights ?? 0),
                },
                payment: {
                    ...rest.payment,
                    totalAmount: Number(rest.payment.totalAmount ?? 0),
                    paidAmount: Number(rest.payment.paidAmount ?? 0),
                },
                tourists: serialiseTourists(trip.tourists),
                documents: currentDocuments,
            };

            const response = await fetch(`/api/trips/manage/${encodeURIComponent(activeId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data?.message ?? 'Unable to update the tour.');
            }

            setTrip(normalizeTrip(data.trip));
            setPendingFiles(buildEmptyPendingFiles()); // Clear pending files on success
            setSuccessMessage('Changes saved successfully.');
        } catch (error: any) {
            console.error('Manager update failed', error);
            setErrorMessage(error?.message ?? 'Unable to update the tour.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDocumentFileSelection = (key: keyof Documents, file: File) => {
        setPendingFiles((prev) => ({
            ...prev,
            [key]: file,
        }));
    };

    const clearPendingFile = (key: keyof Documents) => {
        setPendingFiles((prev) => ({
            ...prev,
            [key]: null,
        }));
    };


    const handleFlightFieldChange = useCallback(
        (segment: 'departure' | 'arrival', field: keyof FlightInfo['departure'], value: string) => {
            setTrip((prev) =>
                prev
                    ? {
                          ...prev,
                          flightInfo: {
                              ...prev.flightInfo,
                              [segment]: {
                                  ...prev.flightInfo[segment],
                                  [field]: value,
                              },
                          },
                      }
                    : prev,
            );
        },
        [],
    );

    const handleHotelFieldChange = useCallback(
        (field: keyof Hotel | 'nights', value: string) => {
            setTrip((prev) =>
                prev
                    ? {
                          ...prev,
                          hotel: {
                              ...prev.hotel,
                              ...(field === 'nights'
                                  ? { nights: Number.parseInt(value, 10) || 0 }
                                  : { [field]: value }),
                          },
                      }
                    : prev,
            );
        },
        [],
    );

    const handlePaymentFieldChange = useCallback(
        (field: keyof Payment, value: string) => {
            setTrip((prev) =>
                prev
                    ? {
                          ...prev,
                          payment: {
                              ...prev.payment,
                              [field]: field === 'totalAmount' || field === 'paidAmount' ? Number.parseFloat(value) || 0 : value,
                          },
                      }
                    : prev,
            );
        },
        [],
    );

    const handleAddonToggle = useCallback(
        (field: keyof Addons, value: boolean) => {
            setTrip((prev) =>
                prev
                    ? {
                          ...prev,
                          addons: {
                              ...prev.addons,
                              [field]: value,
                          },
                      }
                    : prev,
            );
        },
        [],
    );

    const handleBasicFieldChange = useCallback((field: BasicDetailsField, value: string) => {
        setTrip((prev) => {
            if (!prev) {
                return prev;
            }

            if (field === 'country' || field === 'region') {
                return {
                    ...prev,
                    [field]: value,
                };
            }

            if (field === 'tripStartDate') {
                return {
                    ...prev,
                    tripStartDate: value,
                    hotel: {
                        ...prev.hotel,
                        checkIn: prev.hotel.checkIn || value,
                    },
                };
            }

            if (field === 'tripEndDate') {
                return {
                    ...prev,
                    tripEndDate: value,
                    hotel: {
                        ...prev.hotel,
                        checkOut: prev.hotel.checkOut || value,
                    },
                };
            }

            if (field === 'hotelNights') {
                return {
                    ...prev,
                    hotel: {
                        ...prev.hotel,
                        nights: Number.parseInt(value, 10) || 0,
                    },
                };
            }

            if (field === 'food') {
                return {
                    ...prev,
                    hotel: {
                        ...prev.hotel,
                        food: value,
                    },
                };
            }

            return prev;
        });
    }, []);

    const handleOwnerPhoneChange = useCallback((value: string) => {
        setTrip((prev) => (prev ? { ...prev, ownerPhone: value } : prev));
    }, []);

    const handleTouristChange = useCallback((index: number, field: keyof Tourist, value: string) => {
        setTrip((prev) =>
            prev
                ? {
                      ...prev,
                      tourists: prev.tourists.map((entry, idx) =>
                          idx === index ? { ...entry, [field]: value } : entry,
                      ),
                  }
                : prev
        );
    }, []);

    const handleAddTourist = useCallback(() => {
        setTrip((prev) =>
            prev
                ? {
                      ...prev,
                      tourists: [
                          ...prev.tourists,
                          {
                              name: '',
                              surname: '',
                              sex: '',
                              pasportExpiryDate: '',
                              DOB: '',
                              PasportNumber: '',
                              PasportSeries: '',
                              PasportIsueDate: '',
                          },
                      ],
                  }
                : prev
        );
    }, []);

    const handleRemoveTourist = useCallback((index: number) => {
        setTrip((prev) =>
            prev
                ? {
                      ...prev,
                      tourists: prev.tourists.filter((_, idx) => idx !== index),
                  }
                : prev
        );
    }, []);

    const handleDocumentToggleReady = useCallback((key: keyof Documents, isReady: boolean) => {
        setTrip((prev) =>
            prev
                ? {
                      ...prev,
                      documents: {
                          ...prev.documents,
                          [key]: {
                              ...prev.documents[key],
                              uploaded: isReady,
                          },
                      },
                  }
                : prev
        );
    }, []);

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
                <header className="space-y-2 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/40">Tours</p>
                    <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">Manage existing tour</h1>
                    <p className="text-sm text-foreground/60">Find a tour by its public number (Trip #123456) or internal ID, adjust its details, and keep supporting documents up to date.</p>
                </header>

                <section className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8">
                    <form onSubmit={handleLookup} className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div className="w-full md:max-w-sm">
                            <Label htmlFor="tour-identifier">Tour number or ID</Label>
                            <Input
                                id="tour-identifier"
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.target.value)}
                                placeholder="e.g. Trip #5468189 or 6645cd8f..."
                                autoComplete="off"
                            />
                        </div>
                        <Button type="submit" size="lg" disabled={isLoading}>
                            {isLoading ? 'Searching…' : 'Find tour'}
                        </Button>
                        <div className="flex-1 text-sm text-foreground/60">
                            Only managers with elevated access can edit existing tours. Document upload controls are placeholders.
                        </div>
                    </form>
                    {errorMessage && (
                        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                            {errorMessage}
                        </p>
                    )}
                    {successMessage && (
                        <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600">
                            {successMessage}
                        </p>
                    )}
                </section>

                {trip ? (
                    <section className="space-y-6">
                        <div className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold text-foreground">General information</h2>
                                    <p className="text-sm text-foreground/60">Update headline tour details and timelines.</p>
                                </div>
                                <Button type="button" size="lg" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? 'Saving…' : 'Save changes'}
                                </Button>
                            </div>
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="tour-number">Tour number</Label>
                                    <Input
                                        id="tour-number"
                                        value={typeof trip.number === 'number' && !Number.isNaN(trip.number) ? `Trip #${trip.number}` : ''}
                                        disabled
                                    />
                                </div>
                                <FormInput
                                    id="booking-date"
                                    labelText="Booking date"
                                    value={trip.bookingDate ?? ''}
                                    onChange={(event) =>
                                        setTrip((prev) => (prev ? { ...prev, bookingDate: event.target.value } : prev))
                                    }
                                    required
                                    formatType="date"
                                />
                                <div>
                                    <Label htmlFor="manager-email">Last managed by</Label>
                                    <Input id="manager-email" value={trip.managerEmail ?? ''} disabled />
                                </div>
                            </div>
                            <div className="mt-8 space-y-8">
                                <BasicDetailsSection
                                    variant="edit"
                                    values={{
                                        country: trip.country,
                                        region: trip.region,
                                        tripStartDate: trip.tripStartDate,
                                        tripEndDate: trip.tripEndDate,
                                    }}
                                    onChange={handleBasicFieldChange}
                                    showHotelNights={false}
                                    showMealPlan={false}
                                    showNumber={false}
                                    title="Destination"
                                    description="Update where and when the travellers are headed."
                                />
                                <PhoneSection
                                    variant="edit"
                                    value={trip.ownerPhone ?? ''}
                                    onChange={handleOwnerPhoneChange}
                                    title="Owner Phone"
                                    description="Primary client contact used for confirmations and updates."
                                />
                            </div>
                        </div>

                        <div className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8">
                            <FlightsSection
                                variant="edit"
                                values={trip.flightInfo}
                                onChange={handleFlightFieldChange}
                                title="Flight information"
                                description="Update outbound and inbound flight details."
                            />
                        </div>

                        <div className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8">
                            <StaySection
                                variant="edit"
                                values={trip.hotel}
                                onChange={handleHotelFieldChange}
                                includeMealPlan
                                includeNights
                                title="Accommodation"
                                description="Capture hotel stay details and room allocation."
                            />
                        </div>

                        <div className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8">
                            <PaymentSection
                                variant="edit"
                                values={trip.payment}
                                onChange={handlePaymentFieldChange}
                                title="Payment overview"
                                description="Track outstanding balances and payment deadlines."
                            />
                            <div className="mt-6 border-t border-border/40 pt-6">
                                <ExtrasSection
                                    variant="edit"
                                    values={trip.addons}
                                    onChange={handleAddonToggle}
                                    title="Add-ons"
                                    description="Toggle optional extras to reflect traveller preferences."
                                />
                            </div>
                        </div>

                        <div className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8">
                            <TravellerSection
                                variant="edit"
                                tourists={trip.tourists}
                                onChange={handleTouristChange}
                                onAdd={handleAddTourist}
                                onRemove={handleRemoveTourist}
                            />
                        </div>

                        <DocumentsSection
                            documents={trip.documents}
                            pendingFiles={pendingFiles}
                            onToggleReady={handleDocumentToggleReady}
                            onFileSelect={handleDocumentFileSelection}
                            onFileClear={clearPendingFile}
                        />

                        <div className="flex justify-end">
                            <Button type="button" size="lg" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving…' : 'Save changes'}
                            </Button>
                        </div>
                    </section>
                ) : (
                    <div className="mt-6 rounded-3xl border border-dashed border-border/50 p-8 text-center text-sm text-foreground/60">
                        Search for a tour to unlock editing tools.
                    </div>
                )}
            </div>
        </div>
    );
}