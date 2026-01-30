export type PreviewTraveller = {
    name: string;
    surname: string;
    sex: string;
    pasportExpiryDate: string;
    DOB: string;
};

export type PreviewState = {
    number: number;
    country: string;
    bookingDate: string;
    tripStartDate: string;
    tripEndDate: string;
    flightInfo: {
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
    };
    hotel: {
        name: string;
        checkIn: string;
        checkOut: string;
        food: string;
        nights: number;
        roomType: string;
    };
    tourists: PreviewTraveller[];
    addons: {
        insurance: boolean;
        transfer: boolean;
    };
    payment: {
        totalAmount: number;
        paidAmount: number;
        deadline: string;
    };
    ownerPhone: string;
};
