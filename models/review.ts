import mongoose, { Schema } from "mongoose";

/**
 * Post-trip review left by the trip owner after the trip is Completed/Archived.
 * One review per user per trip (enforced by unique index).
 */
const reviewSchema = new Schema({
    // Reference to the reviewed trip
    tripId: {
        type: Schema.Types.ObjectId,
        ref: 'Trip',
        required: true,
    },
    // Denormalized for display (same pattern as Notification)
    tripNumber: {
        type: String,
        required: true,
    },
    // Reviewer (trip owner, by phone number)
    userPhone: {
        type: String,
        required: true,
    },
    // Snapshot of the reviewer's display name at review time
    userName: {
        type: String,
        default: "",
    },
    // 1..5 stars
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    // Optional free-text comment
    text: {
        type: String,
        default: "",
        maxlength: 500,
    },
}, { timestamps: true });

// One review per user per trip
reviewSchema.index({ tripId: 1, userPhone: 1 }, { unique: true });
// Public listing by trip number (shared trip page)
reviewSchema.index({ tripNumber: 1 });

// DEVELOPMENT: Delete cached model on hot-reload to prevent "Cannot overwrite model" errors
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.Review) delete mongoose.models.Review;
}

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
