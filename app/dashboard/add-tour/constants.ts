import { PreviewState } from './types';

export const blankPreview: PreviewState = {
    number: 0,
    country: '',
    bookingDate: '',
    tripStartDate: '',
    tripEndDate: '',
    flightInfo: {
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
    },
    hotel: {
        name: '',
        checkIn: '',
        checkOut: '',
        food: '',
        nights: 0,
        roomType: '',
    },
    tourists: [
        {
            name: '',
            surname: '',
            sex: '',
            pasportExpiryDate: '',
            DOB: '',
        },
    ],
    addons: {
        insurance: false,
        transfer: false,
    },
    payment: {
        totalAmount: 0,
        paidAmount: 0,
        deadline: '',
    },
    ownerPhone: '',
};
