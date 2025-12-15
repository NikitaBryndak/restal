"use server"

import mongoose, { Schema } from "mongoose";

const articleSchema = new Schema({
    tag: {
        type: Number,
        required: true
    },
    images: {
        type: URL, // TODO: need to do list later
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
    createrEmail: {
        type: String,
        required: true
    }
});

articleSchema.index({ articleID: 1 }, { unique: true });
const Article = mongoose.models.Article || mongoose.model("Article", articleSchema);
export default Article;
