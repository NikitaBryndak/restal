"use server";

import mongoose, { Schema } from "mongoose";

const tripSchema = new Schema({
    number: {
        type: Number,
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
        }
    },
    food: {
        type: String,
        required: true,
    },
    hotelNights: {
        type: Number,
        required: true,
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
        pasportExpiryDate: {
            type: String,
            required: true,
        },
        DOB: {
            type: String,
            required: false,
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
    }
    ,
    ownerEmail: {
        type: String,
        required: false,
    }
}, { timestamps: true });

// Ensure trip numbers are unique per owner
tripSchema.index({ ownerEmail: 1, number: 1 }, { unique: true, sparse: true });

const Trip = mongoose.models.Trip || mongoose.model("Trip", tripSchema);

export default Trip;