import { z } from 'zod';

const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
/** Optional date: valid DD/MM/YYYY or empty string */
const optionalDateSchema = z.string().regex(dateRegex, "Невірний формат дати (ДД/ММ/РРРР)").or(z.literal(''));
/** Required date: must be a valid DD/MM/YYYY, cannot be empty */
const requiredDateSchema = z.string().min(1, "Це поле є обов'язковим").regex(dateRegex, "Невірний формат дати (ДД/ММ/РРРР)");

export const travellerSchema = z.object({
    firstName: z.string().min(1, "Ім'я є обов'язковим"),
    lastName: z.string().min(1, "Прізвище є обов'язковим"),
    sex: z.enum(["male", "female", "other", "unspecified"]).default("unspecified"),
    passportExpiry: optionalDateSchema,
    dob: optionalDateSchema,
    passportNumber: z.string().optional().default(''),
    passportSeries: z.string().optional().default(''),
    passportIssueDate: optionalDateSchema,
});

export const flightSegmentSchema = z.object({
    country: z.string().optional(),
    airportCode: z.string().optional(),
    flightNumber: z.string().optional(),
    date: optionalDateSchema,
    time: z.string().optional(),
});

export const documentSchema = z.object({
    uploaded: z.boolean(),
    url: z.string().optional(),
});

export const tourSchema = z.object({
    // Basic Details
    number: z.string().min(1, "Номер туру є обов'язковим"),
    country: z.string().min(1, "Країна призначення є обов'язковою"),
    region: z.string().optional(),
    hotelNights: z.coerce.number().min(0, "Кількість ночей не може бути від'ємною").default(0),
    tripStartDate: requiredDateSchema,
    tripEndDate: requiredDateSchema,
    food: z.string().optional(), // Meal plan
    bookingDate: optionalDateSchema,

    // Hotel
    hotelName: z.string().optional(),
    hotelCheckIn: optionalDateSchema,
    hotelCheckOut: optionalDateSchema,
    roomType: z.string().optional(),

    // Flights
    departureCountry: z.string().optional(),
    departureAirport: z.string().optional(),
    departureFlight: z.string().optional(),
    departureDate: optionalDateSchema,
    departureTime: z.string().optional(),

    arrivalCountry: z.string().optional(),
    arrivalAirport: z.string().optional(),
    arrivalFlight: z.string().optional(),
    arrivalDate: optionalDateSchema,
    arrivalTime: z.string().optional(),

    // Travellers — at least one required
    travellers: z.array(travellerSchema).min(1, "Потрібно додати хоча б одного подорожуючого"),

    // Addons
    insurance: z.boolean().default(false),
    transfer: z.boolean().default(false),

    // Payment
    paymentTotal: z.coerce.number().min(0, "Сума не може бути від'ємною").default(0),
    paymentPaid: z.coerce.number().min(0, "Сума не може бути від'ємною").default(0),
    paymentDeadline: optionalDateSchema,

    // Other — phone is required; validated after stripping formatting
    ownerPhone: z.string().min(1, "Номер телефону є обов'язковим"),

    documents: z.record(z.string(), documentSchema).optional(),
}).refine(
    (data) => data.paymentPaid <= data.paymentTotal,
    { message: "Сплачена сума не може перевищувати загальну суму", path: ["paymentPaid"] }
);

export type TourFormValues = z.infer<typeof tourSchema>;
