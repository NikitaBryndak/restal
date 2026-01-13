"use server"

import mongoose, { Schema } from "mongoose";

const articleSchema = new Schema({
    articleID: {
        type: Number,
        required: true
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
    creatorEmail: {
        type: String,
        required: true
    }
});

articleSchema.index({ articleID: 1 }, { unique: true });
const Article = mongoose.models.Article || mongoose.model("Article", articleSchema);
export default Article;
