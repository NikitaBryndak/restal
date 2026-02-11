import mongoose, { Schema } from "mongoose";

const aiRateLimitSchema = new Schema({
    identifier: {
        type: String, // IP or UserID or Cookie ID
        required: true,
        unique: true
    },
    count: {
        type: Number,
        default: 0
    },
    lastReset: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Prevent Mongoose model recompilation error in development
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.AiRateLimit) {
        delete mongoose.models.AiRateLimit;
    }
}

const AiRateLimit = mongoose.models.AiRateLimit || mongoose.model("AiRateLimit", aiRateLimitSchema);
export default AiRateLimit;
