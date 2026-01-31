import type { Tourist, FlightInfo, Hotel, Addons, Payment } from '@/types';

export type PreviewTraveller = Pick<Tourist, 'name' | 'surname' | 'sex' | 'passportExpiryDate' | 'dob'>;

export type PreviewState = {
    number: string;
    country: string;
    bookingDate: string;
    tripStartDate: string;
    tripEndDate: string;
    flightInfo: FlightInfo;
    hotel: Hotel;
    tourists: PreviewTraveller[];
    addons: Addons;
    payment: Payment;
    ownerPhone: string;
};
