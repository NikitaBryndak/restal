export type Quote = {
  quote: string;
  author: string;
};

export type Company = {
  name: string;
  logoUrl: string;
  websiteUrl: string;
};

export type Credential = { 
  email: string; 
  password: string; 
  confirmPassword?: string ;
}

export type TouristInfo = {
  id: number;
  name: string;
  pasportExpiryDate: string;
}

export type Tourist = {
  name: string;
  surname: string;
  sex: string;
  pasportExpiryDate: string;
  DOB?: string;
}

export type FlightInfo = {
  departure: {
    airportCode: string;
    country: string;
    flightNumber: string;
    date: string;
    time: string;
  };
  arrival: {
    airportCode: string;
    country: string;
    flightNumber: string;
    date: string;
    time: string;
  };
}

export type Hotel = {
  name: string;
  checkIn: string;
  checkOut: string;
  food: string;
  nights: number;
  roomType: string;
}

export type Addons = {
  insurance: boolean;
  transfer: boolean;
}

export type Document = {
  uploaded: boolean;
  url: string;
}

export type Documents = {
  contract: Document;
  invoice: Document;
  confirmation: Document;
  tickets: Document;
  voucher: Document;
  insurancePolicy: Document;
  tourProgram: Document;
  memo: Document;
}

export type Payment = {
  totalAmount: number;
  paidAmount: number;
  deadline: string;
}

export type Trip = {
  _id?: string;
  number: number;
  bookingDate: string;
  tripStartDate: string;
  tripEndDate: string;
  country: string;
  flightInfo: FlightInfo;
  hotel: Hotel;
  tourists: Tourist[];
  addons: Addons;
  documents: Documents;
  payment: Payment;
  ownerEmail: string;
  createdAt?: Date;
  updatedAt?: Date;
}
