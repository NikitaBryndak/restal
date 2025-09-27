"use server";

import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    cashbackAmount: {
        type: Number,
        default: 1000
    },
    phoneNumber: {
        type: String,
        required: false,
    },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;