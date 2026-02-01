'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormInput from '@/components/ui/form-input';
import { Label } from '@/components/ui/label';
import { Trip, Documents, Tourist, FlightInfo, Hotel, Payment, Addons, DEFAULT_DOCUMENTS, DOCUMENT_KEYS, DOCUMENT_LABELS, TourStatus, TOUR_STATUSES, TOUR_STATUS_LABELS } from '@/types';
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
    passportNumber?: string;
    passportSeries?: string;
    passportIssueDate?: string;
};

type EditableTrip = Omit<Trip, 'tourists' | 'documents'> & {
    tourists: EditableTourist[];
    documents: Documents;
    managerEmail?: string;
    region?: string;
    status: TourStatus;
    managerName?: string;
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
                passportExpiryDate: '',
                dob: '',
                passportNumber: '',
                passportSeries: '',
                passportIssueDate: '',
            },
        ];
    }

    return tourists.map((tourist) => ({
        name: tourist?.name ?? '',
        surname: tourist?.surname ?? '',
        sex: tourist?.sex ?? '',
        passportExpiryDate: tourist?.passportExpiryDate ?? tourist?.pasportExpiryDate ?? '',
        dob: tourist?.dob ?? tourist?.DOB ?? '',
        passportNumber: tourist?.passportNumber ?? tourist?.PasportNumber ?? '',
        passportSeries: tourist?.passportSeries ?? tourist?.PasportSeries ?? '',
        passportIssueDate: tourist?.passportIssueDate ?? tourist?.PasportIsueDate ?? '',
    }));
};

const normalizeTrip = (raw: any): RawTrip => {
    const documents = normalizeDocuments(raw?.documents);
    const tourists = normalizeTourists(raw?.tourists);

    return {
        _id: raw?._id ?? undefined,
        number: raw?.number ?? '',
        bookingDate: raw?.bookingDate ?? '',
        tripStartDate: raw?.tripStartDate ?? '',
        tripEndDate: raw?.tripEndDate ?? '',
        country: raw?.country ?? '',
        status: raw?.status ?? 'In Booking',
        flightInfo: {
            departure: {
                airportCode: raw?.flightInfo?.departure?.airportCode ?? '',
                country: raw?.flightInfo?.departure?.country ?? '',
                flightNumber: raw?.flightInfo?.departure?.flightNumber ?? '',
                date: raw?.flightInfo?.departure?.date ?? raw?.tripStartDate ?? '',
                time: raw?.flightInfo?.departure?.time ?? '',
            },
            arrival: {
                airportCode: raw?.flightInfo?.arrival?.airportCode ?? '',
                country: raw?.flightInfo?.arrival?.country ?? raw?.country ?? '',
                flightNumber: raw?.flightInfo?.arrival?.flightNumber ?? '',
                date: raw?.flightInfo?.arrival?.date ?? raw?.tripEndDate ?? '',
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
        managerName: raw?.managerName ?? '',
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
        passportExpiryDate: tourist.passportExpiryDate ?? '',
        dob: tourist.dob ?? '',
        passportNumber: tourist.passportNumber ?? '',
        passportSeries: tourist.passportSeries ?? '',
        passportIssueDate: tourist.passportIssueDate ?? '',
    }));
};

const isBlank = (value: unknown): boolean => typeof value !== 'string' || value.trim().length === 0;

const checkRequired = (value: unknown, fieldName: string): string | null =>
    isBlank(value) ? `${fieldName} is required.` : null;

const checkDate = (value: string, fieldName: string): string | null => {
    const error = validateDate(value);
    return error ? `${fieldName}: ${error}` : null;
};

const checkPositiveNumber = (value: number, fieldName: string): string | null =>
    !Number.isFinite(value) || value <= 0 ? `${fieldName} must be greater than zero.` : null;

const validateTripData = (data: RawTrip): string | null => {
    // Basic details
    let error = checkRequired(data.ownerPhone, 'Owner phone')
        || checkRequired(data.country, 'Destination country')
        || checkRequired(data.region, 'Region')
        || checkRequired(data.bookingDate, 'Booking date') || checkDate(data.bookingDate, 'Booking date')
        || checkRequired(data.tripStartDate, 'Trip start date') || checkDate(data.tripStartDate, 'Trip start date')
        || checkRequired(data.tripEndDate, 'Trip end date') || checkDate(data.tripEndDate, 'Trip end date');
    if (error) return error;

    // Flight info - departure
    const { flightInfo } = data;
    error = checkRequired(flightInfo.departure.country, 'Departure country')
        || checkRequired(flightInfo.departure.airportCode, 'Departure airport code')
        || checkRequired(flightInfo.departure.flightNumber, 'Departure flight number')
        || checkRequired(flightInfo.departure.date, 'Departure date') || checkDate(flightInfo.departure.date, 'Departure date')
        || checkRequired(flightInfo.departure.time, 'Departure time');
    if (error) return error;

    // Flight info - arrival
    error = checkRequired(flightInfo.arrival.country, 'Return country')
        || checkRequired(flightInfo.arrival.airportCode, 'Return airport code')
        || checkRequired(flightInfo.arrival.flightNumber, 'Return flight number')
        || checkRequired(flightInfo.arrival.date, 'Return date') || checkDate(flightInfo.arrival.date, 'Return date')
        || checkRequired(flightInfo.arrival.time, 'Return time');
    if (error) return error;

    // Hotel
    const { hotel } = data;
    error = checkRequired(hotel.name, 'Hotel name')
        || checkRequired(hotel.checkIn, 'Hotel check-in date') || checkDate(hotel.checkIn, 'Hotel check-in date')
        || checkRequired(hotel.checkOut, 'Hotel check-out date') || checkDate(hotel.checkOut, 'Hotel check-out date')
        || checkRequired(hotel.food, 'Meal plan')
        || checkPositiveNumber(hotel.nights, 'Hotel nights')
        || checkRequired(hotel.roomType, 'Room type');
    if (error) return error;

    // Payment
    const { payment } = data;
    error = checkPositiveNumber(payment.totalAmount, 'Total amount');
    if (error) return error;
    if (!Number.isFinite(payment.paidAmount) || payment.paidAmount < 0) return 'Paid amount must be zero or a positive number.';
    if (payment.paidAmount > payment.totalAmount) return 'Paid amount cannot exceed total amount.';
    error = checkRequired(payment.deadline, 'Payment deadline') || checkDate(payment.deadline, 'Payment deadline');
    if (error) return error;

    // Travellers
    if (!Array.isArray(data.tourists) || data.tourists.length === 0) {
        return 'At least one traveller is required.';
    }

    for (let i = 0; i < data.tourists.length; i++) {
        const t = data.tourists[i];
        const prefix = `Traveller #${i + 1}`;
        error = checkRequired(t.name, `${prefix} first name`)
            || checkRequired(t.surname, `${prefix} surname`)
            || checkRequired(t.sex, `${prefix} sex`)
            || checkRequired(t.dob, `${prefix} date of birth`) || checkDate(t.dob ?? '', `${prefix} DOB`)
            || checkRequired(t.passportExpiryDate, `${prefix} passport expiry`) || checkDate(t.passportExpiryDate, `${prefix} passport expiry`)
            || checkRequired(t.passportNumber, `${prefix} passport number`)
            || checkRequired(t.passportSeries, `${prefix} passport series`)
            || checkRequired(t.passportIssueDate, `${prefix} passport issue date`) || checkDate(t.passportIssueDate ?? '', `${prefix} passport issue date`);
        if (error) return error;
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
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to locate the requested tour.';
            setErrorMessage(message);
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
                            currentDocuments[key] = {
                                ...currentDocuments[key],
                                url: url,
                                uploaded: true
                            };
                        } else {
                            const errorText = await uploadRes.text();
                            throw new Error(`Failed to upload ${DOCUMENT_LABELS[key]}: ${errorText}`);
                        }
                    } catch (uploadError) {
                         const message = uploadError instanceof Error ? uploadError.message : `Error uploading ${DOCUMENT_LABELS[key]}`;
                         setErrorMessage(message);
                         setIsSaving(false);
                         return;
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
            setPendingFiles(buildEmptyPendingFiles());
            setSuccessMessage('Зміни успішно збережено.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to update the tour.';
            setErrorMessage(message);
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
                              passportExpiryDate: '',
                              dob: '',
                              passportNumber: '',
                              passportSeries: '',
                              passportIssueDate: '',
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
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/40">Тури</p>
                    <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">Керування існуючим туром</h1>
                    <p className="text-sm text-foreground/60">Знайдіть тур за його номером (Тур #123456) або внутрішнім ID, редагуйте деталі та оновлюйте документи.</p>
                </header>

                <section className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8">
                    <form onSubmit={handleLookup} className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div className="w-full md:max-w-sm">
                            <Label htmlFor="tour-identifier">Номер туру або ID</Label>
                            <Input
                                id="tour-identifier"
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.target.value)}
                                placeholder="напр. Тур #5468189 або 6645cd8f..."
                                autoComplete="off"
                            />
                        </div>
                        <Button type="submit" size="lg" disabled={isLoading}>
                            {isLoading ? 'Пошук…' : 'Знайти тур'}
                        </Button>
                        <div className="flex-1 text-sm text-foreground/60">
                            Тільки менеджери з підвищеним доступом можуть редагувати існуючі тури.
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
                                    <h2 className="text-2xl font-semibold text-foreground">Загальна інформація</h2>
                                    <p className="text-sm text-foreground/60">Оновіть основні деталі туру та терміни.</p>
                                </div>
                                <Button type="button" size="lg" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? 'Збереження…' : 'Зберегти зміни'}
                                </Button>
                            </div>
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="tour-number">Номер туру</Label>
                                    <Input
                                        id="tour-number"
                                        value={trip.number ?? ''}
                                        onChange={(event) =>
                                            setTrip((prev) => (prev ? { ...prev, number: event.target.value } : prev))
                                        }
                                        placeholder="напр. 5468189"
                                    />
                                </div>
                                <FormInput
                                    id="booking-date"
                                    labelText="Дата бронювання"
                                    value={trip.bookingDate ?? ''}
                                    onChange={(event) =>
                                        setTrip((prev) => (prev ? { ...prev, bookingDate: event.target.value } : prev))
                                    }
                                    required
                                    formatType="date"
                                />
                                <div>
                                    <Label htmlFor="manager-name">Менеджер туру</Label>
                                    <Input id="manager-name" value={trip.managerName ?? 'Не вказано'} disabled className="bg-foreground/5" />
                                </div>
                                <div>
                                    <Label htmlFor="tour-status">Статус туру</Label>
                                    <select
                                        id="tour-status"
                                        value={trip.status ?? 'In Booking'}
                                        onChange={(event) =>
                                            setTrip((prev) => (prev ? { ...prev, status: event.target.value as TourStatus } : prev))
                                        }
                                        className="w-full h-10 px-3 py-2 text-sm border border-border/40 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        {TOUR_STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {TOUR_STATUS_LABELS[status]}
                                            </option>
                                        ))}
                                    </select>
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
                                    title="Напрямок"
                                    description="Оновіть куди і коли вирушають подорожуючі."
                                />
                                <PhoneSection
                                    variant="edit"
                                    value={trip.ownerPhone ?? ''}
                                    onChange={handleOwnerPhoneChange}
                                    title="Телефон власника"
                                    description="Основний контакт клієнта для підтверджень та оновлень."
                                />
                            </div>
                        </div>

                        <div className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8">
                            <FlightsSection
                                variant="edit"
                                values={trip.flightInfo}
                                onChange={handleFlightFieldChange}
                                title="Інформація про рейси"
                                description="Дата вильоту = дата початку туру, дата прильоту = дата закінчення, країна повернення = країна туру."
                            />
                        </div>

                        <div className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8">
                            <StaySection
                                variant="edit"
                                values={trip.hotel}
                                onChange={handleHotelFieldChange}
                                includeMealPlan
                                includeNights
                                title="Проживання"
                                description="Деталі проживання в готелі та розподіл номерів."
                            />
                        </div>

                        <div className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8">
                            <PaymentSection
                                variant="edit"
                                values={trip.payment}
                                onChange={handlePaymentFieldChange}
                                title="Огляд оплати"
                                description="Відстежуйте залишки та терміни оплати."
                            />
                            <div className="mt-6 border-t border-border/40 pt-6">
                                <ExtrasSection
                                    variant="edit"
                                    values={trip.addons}
                                    onChange={handleAddonToggle}
                                    title="Додатково"
                                    description="Перемикайте опціональні додатки згідно з побажаннями подорожуючих."
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
                                {isSaving ? 'Збереження…' : 'Зберегти зміни'}
                            </Button>
                        </div>
                    </section>
                ) : (
                    <div className="mt-6 rounded-3xl border border-dashed border-border/50 p-8 text-center text-sm text-foreground/60">
                        Знайдіть тур, щоб розблокувати інструменти редагування.
                    </div>
                )}
            </div>
        </div>
    );
}