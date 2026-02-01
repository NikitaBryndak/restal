
import mongoose, { Schema } from "mongoose";

// Tour status types
export const TOUR_STATUSES = [
    "In Booking",
    "Booked",
    "Paid",
    "In Progress",
    "Completed",
    "Archived"
] as const;

// Ticket file schema for individual ticket uploads
const ticketFileSchema = new Schema({
    uploaded: { type: Boolean, default: false },
    url: { type: String, default: "" },
    fileName: { type: String, default: "" }
}, { _id: false });

const tripSchema = new Schema({
    number: {
        type: String,
        required: true,
    },
    bookingDate: {
        type: String,
        required: true,
    },
    tripStartDate: {
        type: String,
        required: true,
    },
    tripEndDate: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    region: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: TOUR_STATUSES,
        default: "In Booking",
    },
    flightInfo: {
        departure: {
            airportCode: {
                type: String,
                required: true,
            },
            country: {
                type: String,
                required: true,
            },
            flightNumber: {
                type: String,
                required: true,
            },
            date: {
                type: String,
                required: true,
            },
            time: {
                type: String,
                required: true,
            }
        },
        arrival: {
            airportCode: {
                type: String,
                required: true,
            },
            country: {
                type: String,
                required: true,
            },
            flightNumber: {
                type: String,
                required: true,
            },
            date: {
                type: String,
                required: true,
            },
            time: {
                type: String,
                required: true,
            }
        }
    },
    hotel: {
        name: {
            type: String,
            required: true,
        },
        checkIn: {
            type: String,
            required: true,
        },
        checkOut: {
            type: String,
            required: true,
        },
        food: {
            type: String,
            required: true,
        },
        nights: {
            type: Number,
            required: true,
        },
        roomType: {
            type: String,
            required: true,
        }
    },
    tourists: [{
        name: {
            type: String,
            required: true,
        },
        surname: {
            type: String,
            required: true,
        },
        sex: {
            type: String,
            required: true,
        },
        passportExpiryDate: {
            type: String,
            required: true,
        },
        dob: {
            type: String,
            required: false,
        },
        passportNumber: {
            type: String,
            required: true,
        },
        passportSeries: {
            type: String,
            required: true,
        },
        passportIssueDate: {
            type: String,
            required: true,
        }
    }],
    addons: {
        insurance: {
            type: Boolean,
            default: false,
        },
        transfer: {
            type: Boolean,
            default: false,
        }
    },
    documents: {
        contract: {
            uploaded: { type: Boolean, default: false },
            url: { type: String, default: "" }
        },
        invoice: {
            uploaded: { type: Boolean, default: false },
            url: { type: String, default: "" }
        },
        confirmation: {
            uploaded: { type: Boolean, default: false },
            url: { type: String, default: "" }
        },
        // Departure tickets (4 files max)
        departureTicket1: ticketFileSchema,
        departureTicket2: ticketFileSchema,
        departureTicket3: ticketFileSchema,
        departureTicket4: ticketFileSchema,
        // Arrival/Return tickets (4 files max)
        arrivalTicket1: ticketFileSchema,
        arrivalTicket2: ticketFileSchema,
        arrivalTicket3: ticketFileSchema,
        arrivalTicket4: ticketFileSchema,
        voucher: {
            uploaded: { type: Boolean, default: false },
            url: { type: String, default: "" }
        },
        insurancePolicy: {
            uploaded: { type: Boolean, default: false },
            url: { type: String, default: "" }
        },
        tourProgram: {
            uploaded: { type: Boolean, default: false },
            url: { type: String, default: "" }
        },
        memo: {
            uploaded: { type: Boolean, default: false },
            url: { type: String, default: "" }
        }
    },
    payment: {
        totalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        paidAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        deadline : {
            type: String,
            required: true,
        }
    },
    ownerPhone: {
        type: String,
        required: true,
    },
    managerPhone: {
        type: String,
        required: true,
    },
    managerName: {
        type: String,
        required: false,
        default: "",
    },
    // Cashback tracking
    cashbackProcessed: {
        type: Boolean,
        default: false,
    },
    cashbackAmount: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

tripSchema.index({ number: 1 }, { unique: true });

// Prevent Mongoose model recompilation error in development
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.Trip) {
        delete mongoose.models.Trip;
    }
}

const Trip = mongoose.models.Trip || mongoose.model("Trip", tripSchema);

export default Trip;