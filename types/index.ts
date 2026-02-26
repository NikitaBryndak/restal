export type Quote = {
  quote: string;
  author: string;
};

export type Credential = {
  name?: string;
  phoneNumber: string;
  password: string;
  confirmPassword?: string ;
}

export type TouristInfo = {
  id: number;
  name: string;
  passportExpiryDate: string;
}

export type Tourist = {
  name: string;
  surname: string;
  sex: string;
  passportExpiryDate: string;
  dob?: string;
  passportNumber?: string;
  passportSeries?: string;
  passportIssueDate?: string;
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

export type TicketFile = {
  uploaded: boolean;
  url: string;
  fileName?: string;
}

export type Documents = {
  contract: Document;
  invoice: Document;
  confirmation: Document;
  // Departure tickets (4 max)
  departureTicket1: TicketFile;
  departureTicket2: TicketFile;
  departureTicket3: TicketFile;
  departureTicket4: TicketFile;
  // Arrival tickets (4 max)
  arrivalTicket1: TicketFile;
  arrivalTicket2: TicketFile;
  arrivalTicket3: TicketFile;
  arrivalTicket4: TicketFile;
  voucher: Document;
  insurancePolicy: Document;
  tourProgram: Document;
  memo: Document;
}

// Tour status types
export const TOUR_STATUSES = [
  "In Booking",
  "Booked",
  "Paid",
  "In Progress",
  "Completed",
  "Archived"
] as const;

export type TourStatus = typeof TOUR_STATUSES[number];

// Tour status labels in Ukrainian
export const TOUR_STATUS_LABELS: Record<TourStatus, string> = {
  "In Booking": "В процесі бронювання",
  "Booked": "Заброньовано",
  "Paid": "Оплачено",
  "In Progress": "В подорожі",
  "Completed": "Завершено",
  "Archived": "В архіві",
};

export type Payment = {
  totalAmount: number;
  paidAmount: number;
  deadline: string;
}

export type Trip = {
  _id?: string;
  number: string;
  bookingDate: string;
  tripStartDate: string;
  tripEndDate: string;
  country: string;
  region?: string;
  status: TourStatus;
  flightInfo: FlightInfo;
  hotel: Hotel;
  tourists: Tourist[];
  addons: Addons;
  documents: Documents;
  payment: Payment;
  ownerPhone: string;
  managerPhone?: string;
  managerName?: string;
  cashbackProcessed?: boolean;
  cashbackAmount?: number;
  shareToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DEFAULT_TICKET_FILE: TicketFile = { uploaded: false, url: '', fileName: '' };

export type Article = {
  images: string;
  tag: string;
  title: string;
  description: string;
  content: string;
  creatorPhone: string;
}

export const DEFAULT_DOCUMENTS: Documents = {
  contract: { uploaded: false, url: '' },
  invoice: { uploaded: false, url: '' },
  confirmation: { uploaded: false, url: '' },
  departureTicket1: DEFAULT_TICKET_FILE,
  departureTicket2: DEFAULT_TICKET_FILE,
  departureTicket3: DEFAULT_TICKET_FILE,
  departureTicket4: DEFAULT_TICKET_FILE,
  arrivalTicket1: DEFAULT_TICKET_FILE,
  arrivalTicket2: DEFAULT_TICKET_FILE,
  arrivalTicket3: DEFAULT_TICKET_FILE,
  arrivalTicket4: DEFAULT_TICKET_FILE,
  voucher: { uploaded: false, url: '' },
  insurancePolicy: { uploaded: false, url: '' },
  tourProgram: { uploaded: false, url: '' },
  memo: { uploaded: false, url: '' },
};

export const DOCUMENT_LABELS: Record<keyof Documents, string> = {
  contract: 'Договір',
  invoice: 'Рахунок',
  confirmation: 'Підтвердження бронювання',
  departureTicket1: 'Квиток на виліт #1',
  departureTicket2: 'Квиток на виліт #2',
  departureTicket3: 'Квиток на виліт #3',
  departureTicket4: 'Квиток на виліт #4',
  arrivalTicket1: 'Квиток на повернення #1',
  arrivalTicket2: 'Квиток на повернення #2',
  arrivalTicket3: 'Квиток на повернення #3',
  arrivalTicket4: 'Квиток на повернення #4',
  voucher: 'Ваучер',
  insurancePolicy: 'Страховий поліс',
  tourProgram: 'Програма туру',
  memo: "Пам'ятка менеджера",
};

export const DOCUMENT_KEYS = Object.keys(DEFAULT_DOCUMENTS) as (keyof Documents)[];

// Notification types
export type NotificationType = 'document_upload' | 'status_change';

export type Notification = {
  _id?: string;
  userId: string;
  tripId: string;
  tripNumber: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt?: Date;
};
