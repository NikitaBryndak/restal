import mongoose, { Schema } from "mongoose";
import { MIN_PROMO_AMOUNT } from "@/config/constants";

export const PROMO_CODE_STATUSES = ["active", "used", "expired"] as const;
export type PromoCodeStatus = typeof PROMO_CODE_STATUSES[number];

const promoCodeSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    amount: {
        type: Number,
        required: true,
        min: MIN_PROMO_AMOUNT,
    },
    // The user who generated the code
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    ownerPhone: {
        type: String,
        required: true,
    },
    ownerName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: PROMO_CODE_STATUSES,
        default: "active",
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    // When the code was used
    usedAt: {
        type: Date,
        default: null,
    },
    // The manager who redeemed the code
    usedByManagerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    usedByManagerPhone: {
        type: String,
        default: null,
    },
}, { timestamps: true });

// Index for quick lookups (code index already created by unique: true)
promoCodeSchema.index({ ownerPhone: 1 });
promoCodeSchema.index({ status: 1 });
promoCodeSchema.index({ expiresAt: 1 });

// Prevent Mongoose model recompilation error in development
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.PromoCode) {
        delete mongoose.models.PromoCode;
    }
}

const PromoCode = mongoose.models.PromoCode || mongoose.model("PromoCode", promoCodeSchema);

export default PromoCode;
