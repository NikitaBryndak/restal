import mongoose, { Schema } from "mongoose";

const articleSchema = new Schema({
    articleID: {
        type: Number,
        required: true,
        unique: true, // Ensuring unique constraint at schema level too, though index handles it
    },
    tag: {
        type: String,
        required: true
    },
    images: {
        type: String, // TODO: need to do list later
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    creatorPhone: {
        type: String,
        required: true
    }
}, { timestamps: true });

articleSchema.index({ articleID: 1 }, { unique: true });

// Prevent Mongoose model recompilation error in development
if (process.env.NODE_ENV === "development") {
    // Check if model exists before deleting to handle hot reload correctly
    if (mongoose.models.Article) {
        delete mongoose.models.Article;
    }
}

const Article = mongoose.models.Article || mongoose.model("Article", articleSchema);
export default Article;
