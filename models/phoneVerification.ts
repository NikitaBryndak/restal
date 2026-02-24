import mongoose, { Schema, Document } from "mongoose";
import { OTP_EXPIRY_MS } from "@/config/constants";

export interface IPhoneVerification extends Document {
  phoneNumber: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const phoneVerificationSchema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + OTP_EXPIRY_MS),
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-delete expired documents after 1 hour past expiry
phoneVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

// Prevent Mongoose model recompilation error in development
if (process.env.NODE_ENV === "development") {
  if (mongoose.models.PhoneVerification) {
    delete mongoose.models.PhoneVerification;
  }
}

const PhoneVerification =
  mongoose.models.PhoneVerification ||
  mongoose.model<IPhoneVerification>("PhoneVerification", phoneVerificationSchema);

export default PhoneVerification;
