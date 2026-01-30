import { z } from 'zod';

const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
const dateSchema = z.string().regex(dateRegex, "Invalid date format (DD/MM/YYYY)").or(z.literal(''));

export const travellerSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    sex: z.enum(["male", "female", "other", "unspecified"]).default("unspecified"),
    passportExpiry: dateSchema,
    dob: dateSchema,
    passportNumber: z.string().optional(),
    passportSeries: z.string().optional(),
    passportIssueDate: dateSchema,
});

export const flightSegmentSchema = z.object({
    country: z.string().optional(),
    airportCode: z.string().optional(),
    flightNumber: z.string().optional(),
    date: dateSchema,
    time: z.string().optional(),
});

export const documentSchema = z.object({
    uploaded: z.boolean(),
    url: z.string().optional(),
});

export const tourSchema = z.object({
    // Basic Details
    number: z.coerce.number().min(0),
    country: z.string().min(1, "Destination is required"),
    region: z.string().optional(),
    hotelNights: z.coerce.number().min(0).default(0),
    tripStartDate: dateSchema,
    tripEndDate: dateSchema,
    food: z.string().optional(), // Meal plan
    bookingDate: dateSchema,

    // Hotel
    hotelName: z.string().optional(),
    hotelCheckIn: dateSchema,
    hotelCheckOut: dateSchema,
    roomType: z.string().optional(),

    // Flights
    departureCountry: z.string().optional(),
    departureAirport: z.string().optional(),
    departureFlight: z.string().optional(),
    departureDate: dateSchema,
    departureTime: z.string().optional(),

    arrivalCountry: z.string().optional(),
    arrivalAirport: z.string().optional(),
    arrivalFlight: z.string().optional(),
    arrivalDate: dateSchema,
    arrivalTime: z.string().optional(),

    // Travellers
    travellers: z.array(travellerSchema).default([]),

    // Addons
    insurance: z.boolean().default(false),
    transfer: z.boolean().default(false),

    // Payment
    paymentTotal: z.coerce.number().min(0).default(0),
    paymentPaid: z.coerce.number().min(0).default(0),
    paymentDeadline: dateSchema,

    // Other
    ownerPhone: z.string().optional().or(z.literal('')),

    documents: z.record(z.string(), documentSchema).optional(),
});

export type TourFormValues = z.infer<typeof tourSchema>;
