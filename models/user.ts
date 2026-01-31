"use server";

import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: true,
    },
    privilegeLevel: {
        type: Number,
        default: 1
    },
    cashbackAmount: {
        type: Number,
        default: 1000
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    resetPasswordToken: {
        type: String,
        required: false,
    },
    resetPasswordExpires: {
        type: Date,
        required: false,
    },
    resetPasswordAttempts: {
        type: Number,
        default: 0,
    },
    resetPasswordLockUntil: {
        type: Date,
        required: false,
    },
}, { timestamps: true });

// Prevent Mongoose model recompilation error in development
// and ensure new schema is applied by deleting existing model if needed
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.User) {
        delete mongoose.models.User;
    }
}

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;