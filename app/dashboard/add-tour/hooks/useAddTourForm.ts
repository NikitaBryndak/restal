import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PreviewState } from '../types';
import { blankPreview } from '../constants';
import { getCurrentDate } from '@/lib/utils';
import { Documents } from '@/types';
import { DOCUMENT_KEYS } from '../../shared/documents';

type RawTraveller = {
    firstName: string;
    lastName: string;
    sex: string;
    passportExpiry: string;
    dob: string;
    passportNumber: string;
    passportSeries: string;
    passportIssueDate: string;
};

export const useAddTourForm = () => {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement | null>(null);
    const [previewState, setPreviewState] = useState<PreviewState>(blankPreview);
    const curDate = getCurrentDate();

    const buildDocuments = useCallback((formData: FormData): Documents => {
        return DOCUMENT_KEYS.reduce((acc, key) => {
            const uploadedValue = formData.get(`documents[${key}][uploaded]`);
            const urlValue = formData.get(`documents[${key}][url]`);
            acc[key] = {
                uploaded: uploadedValue === 'on' || uploadedValue === 'true',
                url: typeof urlValue === 'string' ? urlValue.trim() : '',
            };
            return acc;
        }, {} as Documents);
    }, []);

    const parseTravellerGroups = useCallback((formData: FormData, formatDate: (value: string) => string): RawTraveller[] => {
        const map = new Map<number, Partial<RawTraveller>>();

        formData.forEach((rawValue, key) => {
            if (typeof rawValue !== 'string') return;
            const match = key.match(/^travellers\[(\d+)\]\[(.+)\]$/);
            if (!match) return;

            const index = Number.parseInt(match[1], 10);
            const field = match[2] as keyof RawTraveller;

            const entry = map.get(index) ?? {};
            entry[field] = rawValue.trim();
            map.set(index, entry);
        });

        return Array.from(map.entries())
            .sort(([a], [b]) => a - b)
            .map(([, value]) => {
                const firstName = (value.firstName ?? '').trim();
                const lastName = (value.lastName ?? '').trim();
                const passportExpiry = formatDate((value.passportExpiry ?? '').trim());
                const dob = formatDate((value.dob ?? '').trim());
                const hasContent = firstName || lastName || passportExpiry || dob;

                if (!hasContent) {
                    return null;
                }

                return {
                    firstName,
                    lastName,
                    sex: (value.sex ?? '').trim(),
                    passportExpiry,
                    dob,
                    passportNumber: (value.passportNumber ?? '').trim(),
                    passportSeries: (value.passportSeries ?? '').trim(),
                    passportIssueDate: formatDate((value.passportIssueDate ?? '').trim()),
                } satisfies RawTraveller;
            })
            .filter((traveller): traveller is RawTraveller => traveller !== null);
    }, []);

    const parseForm = useCallback(() => {
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);



        const value = (key: string) => {
            const raw = formData.get(key);
            return typeof raw === 'string' ? raw.trim() : '';
        };
        const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            const [day, month, year] = dateStr.split('/');
            return `${day}/${month}/${year}`;
        };
        const numericValue = (key: string) => {
            const raw = value(key);
            if (!raw) return 0;
            const parsed = Number.parseFloat(raw);
            return Number.isNaN(parsed) ? 0 : parsed;
        };
        const boolValue = (key: string) => formData.get(key) === 'on';
        const bookingDate = formatDate(value('bookingDate')) || curDate;
        const tripStart = formatDate(value('tripStartDate'));
        const tripEnd = formatDate(value('tripEndDate'));
        const hotelCheckIn = formatDate(value('hotelCheckIn')) || tripStart;
        const hotelCheckOut = formatDate(value('hotelCheckOut')) || tripEnd;
        const mealPlan = value('food') || value('mealPlan');
        const travellerGroups = parseTravellerGroups(formData, formatDate);
        const previewTravellers = travellerGroups.length
            ? travellerGroups.map((traveller) => ({
                  name: traveller.firstName || 'Traveller',
                  surname: traveller.lastName || 'Pending',
                  sex: traveller.sex || 'unspecified',
                  pasportExpiryDate: traveller.passportExpiry || '',
                  DOB: traveller.dob || '',
              }))
            : [
                  {
                      name: 'Traveller',
                      surname: 'Pending',
                      sex: 'unspecified',
                      pasportExpiryDate: '',
                      DOB: '',
                  },
              ];

        setPreviewState({
            number: 0,
            country: value('country'),
            bookingDate,
            tripStartDate: tripStart,
            tripEndDate: tripEnd,
            flightInfo: {
                departure: {
                    country: value('departureCountry'),
                    airportCode: value('departureAirport'),
                    flightNumber: value('departureFlight'),
                    date: formatDate(value('departureDate')),
                    time: value('departureTime'),
                },
                arrival: {
                    country: value('arrivalCountry'),
                    airportCode: value('arrivalAirport'),
                    flightNumber: value('arrivalFlight'),
                    date: formatDate(value('arrivalDate')),
                    time: value('arrivalTime'),
                },
            },
            hotel: {
                name: value('hotelName'),
                checkIn: hotelCheckIn,
                checkOut: hotelCheckOut,
                food: mealPlan,
                nights: numericValue('hotelNights'),
                roomType: value('roomType'),
            },
            tourists: previewTravellers,
            addons: {
                insurance: boolValue('insurance'),
                transfer: boolValue('transfer'),
            },
            payment: {
                totalAmount: numericValue('paymentTotal'),
                paidAmount: numericValue('paymentPaid'),
                deadline: formatDate(value('paymentDeadline')),
            },
            ownerEmail: value('ownerEmail'),
        });
    }, [curDate, parseTravellerGroups]);

    useEffect(() => {
        parseForm();
    }, [parseForm]);

    const handleFormInteraction = useCallback(() => {
        parseForm();
    }, [parseForm]);

    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Check for invalid inputs (inputs with aria-invalid="true")
        const form = event.currentTarget;
        const invalidInputs = form.querySelectorAll('input[aria-invalid="true"]');
        
        if (invalidInputs.length > 0) {
            alert('Please correct the invalid date/time fields before submitting.');
            // Focus on the first invalid input
            (invalidInputs[0] as HTMLInputElement).focus();
            return;
        }
        
        const formData = new FormData(event.currentTarget);



        const value = (key: string) => {
            const raw = formData.get(key);
            return typeof raw === 'string' ? raw.trim() : '';
        };
        const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            const [day, month, year] = dateStr.split('/');
            return `${day}/${month}/${year}`;
        };
        const parseInteger = (key: string) => {
            const raw = value(key);
            if (!raw) return 0;
            const parsed = Number.parseInt(raw, 10);
            return Number.isNaN(parsed) ? 0 : parsed;
        };
        const parseNumber = (key: string) => {
            const raw = value(key);
            if (!raw) return 0;
            const parsed = Number.parseFloat(raw);
            return Number.isNaN(parsed) ? 0 : parsed;
        };
        const uppercase = (str: string) => (str ? str.toUpperCase() : '');



        const buildFlightSegment = (segment: 'departure' | 'arrival') => {
            return {
                country: value(`${segment}Country`),
                airportCode: uppercase(value(`${segment}Airport`)),
                flightNumber: uppercase(value(`${segment}Flight`)),
                date: formatDate(value(`${segment}Date`)),
                time: value(`${segment}Time`),
            };
        };
        const bookingDate = formatDate(value('bookingDate')) || curDate;
        const tripStart = formatDate(value('tripStartDate'));
        const tripEnd = formatDate(value('tripEndDate'));
        const hotelCheckIn = formatDate(value('hotelCheckIn')) || tripStart;
        const hotelCheckOut = formatDate(value('hotelCheckOut')) || tripEnd;
        const mealPlan = value('food') || value('mealPlan');
        const travellerGroups = parseTravellerGroups(formData, formatDate);
        const tourists = travellerGroups.length
            ? travellerGroups.map((traveller) => ({
                  name: traveller.firstName || 'Traveller',
                  surname: traveller.lastName || 'Pending',
                  sex: traveller.sex || 'unspecified',
                  pasportExpiryDate: traveller.passportExpiry,
                  DOB: traveller.dob,
                  PasportNumber: traveller.passportNumber,
                  PasportSeries: traveller.passportSeries,
                  PasportIsueDate: traveller.passportIssueDate,
              }))
            : [
                  {
                      name: 'Traveller',
                      surname: 'Pending',
                      sex: 'unspecified',
                      pasportExpiryDate: '',
                      DOB: '',
                      PasportNumber: '',
                      PasportSeries: '',
                      PasportIsueDate: '',
                  },
              ];
        const documents = buildDocuments(formData);
        const payload: any = {
            number: parseInteger('tripNumber'),
            country: value('country'),
            region: value('region'),
            bookingDate,
            tripStartDate: tripStart,
            tripEndDate: tripEnd,
            flightInfo: {
                departure: buildFlightSegment('departure'),
                arrival: buildFlightSegment('arrival'),
            },
            hotel: {
                name: value('hotelName'),
                checkIn: hotelCheckIn,
                checkOut: hotelCheckOut,
                food: mealPlan,
                nights: parseInteger('hotelNights'),
                roomType: value('roomType'),
            },
            tourists,
            addons: {
                insurance: formData.get('insurance') === 'on',
                transfer: formData.get('transfer') === 'on',
            },
            payment: {
                totalAmount: parseNumber('paymentTotal'),
                paidAmount: parseNumber('paymentPaid'),
                deadline: formatDate(value('paymentDeadline')),
            },
            ownerEmail: value('ownerEmail'),
            documents,
        };



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
            // Redirect to dashboard after successful trip creation
            router.push('/dashboard');
        }).catch((err) => {
            console.error('Create trip error', err);
            alert('Error creating trip');
        });
    }, [buildDocuments, curDate, parseTravellerGroups, router]);

    

    return {
        formRef,
        previewState,
        handleSubmit,
        handleFormInteraction,
    };
};
