import { useMemo } from 'react';
import { PreviewState } from '../types';

export const usePreviewData = (previewState: PreviewState) => {
    return useMemo(() => {
        const nights = previewState.hotel.nights;
        const primaryTraveller = previewState.tourists[0] ?? {
            name: 'Traveller',
            surname: 'Pending',
            pasportExpiryDate: '——/——/————',
            DOB: '——/——/————',
            sex: '—',
        };

        return {
            country: previewState.country || 'Destination',
            bookingDate: previewState.bookingDate || '——/——/————',
            tripStartDate: previewState.tripStartDate || '——/——/————',
            tripEndDate: previewState.tripEndDate || '——/——/————',
            flightInfo: {
                departure: {
                    airportCode: previewState.flightInfo.departure.airportCode || '—',
                    country: previewState.flightInfo.departure.country || '—',
                    flightNumber: previewState.flightInfo.departure.flightNumber || '—',
                    date: previewState.flightInfo.departure.date || '——/——/————',
                    time: previewState.flightInfo.departure.time || '——:——',
                },
                arrival: {
                    airportCode: previewState.flightInfo.arrival.airportCode || '—',
                    country: previewState.flightInfo.arrival.country || '—',
                    flightNumber: previewState.flightInfo.arrival.flightNumber || '—',
                    date: previewState.flightInfo.arrival.date || '——/——/————',
                    time: previewState.flightInfo.arrival.time || '——:——',
                },
            },
            hotel: {
                name: previewState.hotel.name || '—',
                nights: Number.isNaN(nights) ? 0 : nights,
                food: previewState.hotel.food || 'Meal plan TBD',
            },
            tourists: [
                {
                    name: primaryTraveller.name || 'Traveller',
                    surname: primaryTraveller.surname || 'Pending',
                    pasportExpiryDate: primaryTraveller.pasportExpiryDate || '——/——/————',
                    DOB: primaryTraveller.DOB || '',
                },
            ],
            payment: {
                totalAmount: previewState.payment.totalAmount || 0,
                paidAmount: previewState.payment.paidAmount || 0,
                deadline: previewState.payment.deadline || '——/——/————',
            },
            addons: previewState.addons,
        };
    }, [previewState]);
};
