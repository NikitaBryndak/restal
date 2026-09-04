import mongoose, { Schema } from "mongoose";

export const ARTICLE_STATUSES = ["draft", "published"] as const;
export type ArticleStatus = typeof ARTICLE_STATUSES[number];

/**
 * Normalizes the `images` field to a string array.
 * Legacy documents store a single URL string; new ones store an array.
 */
export function normalizeArticleImages(raw: unknown): string[] {
    if (Array.isArray(raw)) {
        return raw.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
    }
    if (typeof raw === "string" && raw.trim().length > 0) {
        return [raw];
    }
    return [];
}

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
        type: [String],
        default: []  // First entry is the cover image; legacy docs hold a single string (normalized on read)
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
    status: {
        type: String,
        enum: ARTICLE_STATUSES,
        default: "published"  // Legacy docs have no field — treated as published by query filters
    },
    creatorPhone: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Prevent Mongoose model recompilation error in development
if (process.env.NODE_ENV === "development") {
    // Check if model exists before deleting to handle hot reload correctly
    if (mongoose.models.Article) {
        delete mongoose.models.Article;
    }
}

const Article = mongoose.models.Article || mongoose.model("Article", articleSchema);
export default Article;
