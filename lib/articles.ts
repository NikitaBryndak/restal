import mongoose from "mongoose";
import Article, { normalizeArticleImages } from "@/models/article";

/** Lean-shape of an Article document (legacy docs may lack `status`). */
export interface ArticleDoc {
    _id: unknown;
    articleID: number;
    tag: string;
    images: string | string[];
    title: string;
    description: string;
    content: string;
    status?: "draft" | "published";
    creatorPhone: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

/** Public/client shape of an article (no PII, normalized images). */
export interface SerializedArticle {
    _id: string;
    articleID: number;
    tag: string;
    images: string[];
    title: string;
    description: string;
    content: string;
    status: "draft" | "published";
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

/** Query matching published articles (legacy docs have no status field). */
export const PUBLISHED_ARTICLE_QUERY = {
    $or: [{ status: "published" }, { status: { $exists: false } }],
};

/**
 * Resolves an article by the slug used in /info/[slug] URLs.
 * Accepts numeric articleID, Mongo ObjectId, or a title-derived slug.
 */
export async function resolveArticleBySlug(slug: string): Promise<ArticleDoc | null> {
    let article: ArticleDoc | null = null;

    if (!Number.isNaN(Number(slug))) {
        const found = await Article.findOne({ articleID: Number(slug) }).lean();
        if (found) article = found as unknown as ArticleDoc;
    }

    if (!article && mongoose.Types.ObjectId.isValid(slug)) {
        try {
            const found = await Article.findOne({ _id: new mongoose.Types.ObjectId(slug) }).lean();
            if (found) article = found as unknown as ArticleDoc;
        } catch {
            // ignore malformed id
        }
    }

    if (!article) {
        const allArticles = (await Article.find().lean()) as unknown as ArticleDoc[];
        article = allArticles.find((a) => a.title?.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase()) ?? null;
    }

    return article;
}

/** Serializes an article for public/client consumption (no PII, normalized images). */
export function serializeArticle(article: ArticleDoc): SerializedArticle {
    const { creatorPhone: _phone, ...rest } = article;
    return {
        ...rest,
        _id: String(rest._id),
        images: normalizeArticleImages(rest.images),
        status: rest.status || "published",
    };
}
