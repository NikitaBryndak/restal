import { useMemo } from 'react';
import { PreviewState } from '../types';
import { Trip } from '@/types';

export const usePreviewData = (previewState: PreviewState): Trip => {
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
            number: 0,
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
                checkIn: previewState.hotel.checkIn || '——/——/————',
                checkOut: previewState.hotel.checkOut || '——/——/————',
                nights: Number.isNaN(nights) ? 0 : nights,
                food: previewState.hotel.food || 'Meal plan TBD',
                roomType: previewState.hotel.roomType || '—',
            },
            tourists: [
                {
                    name: primaryTraveller.name || 'Traveller',
                    surname: primaryTraveller.surname || 'Pending',
                    sex: primaryTraveller.sex || '—',
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
            documents: {
                contract: { uploaded: false, url: '' },
                invoice: { uploaded: false, url: '' },
                confirmation: { uploaded: false, url: '' },
                tickets: { uploaded: false, url: '' },
                voucher: { uploaded: false, url: '' },
                insurancePolicy: { uploaded: false, url: '' },
                tourProgram: { uploaded: false, url: '' },
                memo: { uploaded: false, url: '' },
            },
            ownerEmail: '', // Preview mode - no owner yet
        };
    }, [previewState]);
};
