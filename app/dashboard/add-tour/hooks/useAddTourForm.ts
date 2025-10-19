import { useCallback, useEffect, useRef, useState } from 'react';
import { PreviewState } from '../types';
import { blankPreview } from '../constants';
import { getCurrentDate } from '@/lib/utils';

export const useAddTourForm = () => {
    const formRef = useRef<HTMLFormElement | null>(null);
    const [previewState, setPreviewState] = useState<PreviewState>(blankPreview);
    const curDate = getCurrentDate();

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
        
        

        setPreviewState({
            number: 0,
            country: value('country'),
            bookingDate: curDate,
            tripStartDate: formatDate(value('tripStartDate')),
            tripEndDate: formatDate(value('tripEndDate')),
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
                checkIn: formatDate(value('hotelCheckIn')) || formatDate(value('tripStartDate')),
                checkOut: formatDate(value('hotelCheckOut')) || formatDate(value('tripEndDate')),
                food: value('food'),
                nights: numericValue('hotelNights'),
                roomType: value('roomType'),
            },
            tourists: [
                {
                    name: value('travellerName') || 'Traveller',
                    surname: value('travellerSurname') || 'Pending',
                    sex: value('travellerSex'),
                    pasportExpiryDate: formatDate(value('travellerPassportExpiry')),
                    DOB: formatDate(value('travellerDOB')),
                },
            ],
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
    }, [curDate]);

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
        const traveller = {
            name: value('travellerName') || 'Traveller',
            surname: value('travellerSurname') || 'Pending',
            sex: value('travellerSex') || 'unspecified',
            pasportExpiryDate: formatDate(value('travellerPassportExpiry')),
            DOB: formatDate(value('travellerDOB')),
        };
        const payload: any = {
            number: parseInteger('tripNumber'),
            country: value('country'),
            bookingDate: curDate,
            tripStartDate: formatDate(value('tripStartDate')),
            tripEndDate: formatDate(value('tripEndDate')),
            flightInfo: {
                departure: buildFlightSegment('departure'),
                arrival: buildFlightSegment('arrival'),
            },
            hotel: {
                name: value('hotelName'),
                checkIn: formatDate(value('hotelCheckIn')) || formatDate(value('tripStartDate')),
                checkOut: formatDate(value('hotelCheckOut')) || formatDate(value('tripEndDate')),
                food: value('food'),
                nights: parseInteger('hotelNights'),
                roomType: value('roomType'),
            },
            tourists: [traveller],
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
        }).catch((err) => {
            console.error('Create trip error', err);
            alert('Error creating trip');
        });
    }, [curDate]);

    

    return {
        formRef,
        previewState,
        handleSubmit,
        handleFormInteraction,
    };
};
