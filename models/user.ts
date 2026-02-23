import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import { UNAMBIGUOUS_CHARS, MAX_CODE_GEN_RETRIES, WELCOME_BONUS } from "@/config/constants";

// Generate a unique referral code: REF-XXXX-XXXX
function generateReferralCode(): string {
    const chars = UNAMBIGUOUS_CHARS;
    const seg1 = Array.from(crypto.randomBytes(4))
        .map((b) => chars[b % chars.length])
        .join("");
    const seg2 = Array.from(crypto.randomBytes(4))
        .map((b) => chars[b % chars.length])
        .join("");
    return `REF-${seg1}-${seg2}`;
}

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
        default: WELCOME_BONUS  // Welcome bonus for new users (in UAH)
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    // Referral system fields
    referralCode: {
        type: String,
        unique: true,
        sparse: true,  // Allow null values without unique conflict
    },
    referredBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    referralCount: {
        type: Number,
        default: 0,  // Number of friends successfully referred
    },
    referralBonusEarned: {
        type: Number,
        default: 0,  // Total referral bonus earned (in UAH)
    },
    referralBonusReceived: {
        type: Boolean,
        default: false,  // Whether this user received their referee bonus (awarded on first trip)
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

// Auto-generate referral code before saving if not set
userSchema.pre("save", async function (next) {
    if (!this.referralCode) {
        let code = generateReferralCode();
        let attempts = 0;
        const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
        while (await UserModel.findOne({ referralCode: code })) {
            code = generateReferralCode();
            attempts++;
            if (attempts > MAX_CODE_GEN_RETRIES) break;
        }
        this.referralCode = code;
    }
    next();
});

// Prevent Mongoose model recompilation error in development
// and ensure new schema is applied by deleting existing model if needed
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.User) {
        delete mongoose.models.User;
    }
}

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;