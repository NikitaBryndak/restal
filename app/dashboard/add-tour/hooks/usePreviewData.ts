import { useMemo } from 'react';
import { PreviewState } from '../types';
import { Trip, DEFAULT_DOCUMENTS } from '@/types';

const PLACEHOLDER_DATE = '——/——/————';
const PLACEHOLDER_TIME = '——:——';
const PLACEHOLDER = '—';

export const usePreviewData = (previewState: PreviewState): Trip => {
    return useMemo(() => {
        const nights = previewState.hotel.nights;
        const primaryTraveller = previewState.tourists[0] ?? {
            name: 'Traveller',
            surname: 'Pending',
            passportExpiryDate: PLACEHOLDER_DATE,
            dob: PLACEHOLDER_DATE,
            sex: PLACEHOLDER,
        };

        return {
            number: previewState.number || '',
            country: previewState.country || 'Destination',
            bookingDate: previewState.bookingDate || PLACEHOLDER_DATE,
            tripStartDate: previewState.tripStartDate || PLACEHOLDER_DATE,
            tripEndDate: previewState.tripEndDate || PLACEHOLDER_DATE,
            flightInfo: {
                departure: {
                    airportCode: previewState.flightInfo.departure.airportCode || PLACEHOLDER,
                    country: previewState.flightInfo.departure.country || PLACEHOLDER,
                    flightNumber: previewState.flightInfo.departure.flightNumber || PLACEHOLDER,
                    date: previewState.flightInfo.departure.date || PLACEHOLDER_DATE,
                    time: previewState.flightInfo.departure.time || PLACEHOLDER_TIME,
                },
                arrival: {
                    airportCode: previewState.flightInfo.arrival.airportCode || PLACEHOLDER,
                    country: previewState.flightInfo.arrival.country || PLACEHOLDER,
                    flightNumber: previewState.flightInfo.arrival.flightNumber || PLACEHOLDER,
                    date: previewState.flightInfo.arrival.date || PLACEHOLDER_DATE,
                    time: previewState.flightInfo.arrival.time || PLACEHOLDER_TIME,
                },
            },
            hotel: {
                name: previewState.hotel.name || PLACEHOLDER,
                checkIn: previewState.hotel.checkIn || PLACEHOLDER_DATE,
                checkOut: previewState.hotel.checkOut || PLACEHOLDER_DATE,
                nights: Number.isNaN(nights) ? 0 : nights,
                food: previewState.hotel.food || 'Meal plan TBD',
                roomType: previewState.hotel.roomType || PLACEHOLDER,
            },
            tourists: [{
                name: primaryTraveller.name || 'Traveller',
                surname: primaryTraveller.surname || 'Pending',
                sex: primaryTraveller.sex || PLACEHOLDER,
                passportExpiryDate: primaryTraveller.passportExpiryDate || PLACEHOLDER_DATE,
                dob: primaryTraveller.dob || '',
            }],
            payment: {
                totalAmount: previewState.payment.totalAmount || 0,
                paidAmount: previewState.payment.paidAmount || 0,
                deadline: previewState.payment.deadline || PLACEHOLDER_DATE,
            },
            addons: previewState.addons,
            documents: DEFAULT_DOCUMENTS,
            ownerPhone: '',
        };
    }, [previewState]);
};
