import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Article, { normalizeArticleImages } from '@/models/article';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ARTICLE_MAX_TITLE_LENGTH, ARTICLE_MAX_DESCRIPTION_LENGTH, ARTICLE_MAX_CONTENT_LENGTH, ARTICLE_MAX_TAG_LENGTH, ARTICLE_MAX_IMAGE_URL_LENGTH } from "@/config/constants";
import { getSessionRole, hasAnyScope } from "@/lib/role-access";
import { serializeArticle, type ArticleDoc } from "@/lib/articles";
import { logAudit } from "@/lib/audit";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        await connectToDatabase();

        let article = null;
        if (!Number.isNaN(Number(resolvedParams.id))) {
            const numericId = Number(resolvedParams.id);
            article = await Article.findOne({ articleID: numericId }).lean();
        }

        let articleById = null;
        if (mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
            try {
                const objectId = new mongoose.Types.ObjectId(resolvedParams.id);
                articleById = await Article.findOne({ _id: objectId }).lean();
            } catch {
                // Invalid ObjectId format, skip
            }
        }

        const foundArticle = (article || articleById) as unknown as ArticleDoc | null;

        if (!foundArticle) {
            return NextResponse.json(
                { message: 'Article not found' },
                { status: 404 }
            );
        }

        // Drafts are only visible to editors/admins — everyone else gets a plain 404
        if (foundArticle.status === "draft") {
            const session = await getServerSession(authOptions);
            const role = await getSessionRole(session);
            if (!hasAnyScope(role, ["manage-articles", "add-article"])) {
                return NextResponse.json(
                    { message: 'Article not found' },
                    { status: 404 }
                );
            }
        }

        // SECURITY: Exclude creatorPhone from public response to prevent PII leakage;
        // normalize legacy single-string images and default status for old docs
        const sanitizedArticle = serializeArticle(foundArticle);

        const response = NextResponse.json({ article: sanitizedArticle });
        if (foundArticle.status === "draft") {
            response.headers.set("Cache-Control", "private, no-store");
        } else {
            response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
        }
        return response;
    } catch (e) {
        console.error("Error in GET /api/articles/[id]:", e);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = (await getServerSession(authOptions as any) as any);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }

        // Check article management access (editor/admin or a custom role granted the pages)
        const role = await getSessionRole(session);
        if (!hasAnyScope(role, ["manage-articles", "add-article"])) {
            return NextResponse.json({ message: "Insufficient privileges" }, { status: 403 });
        }

        const resolvedParams = await params;
        if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
            return NextResponse.json(
                { message: 'Invalid article ID' },
                { status: 400 }
            );
        }

        await connectToDatabase();
        const body = await request.json();

        // Security check for fields
        const allowedUpdates = ['title', 'description', 'content', 'tag', 'images', 'status'];
        const updateData: Record<string, unknown> = {};

        // SECURITY: Apply the same length limits as the POST handler
        const lengthLimits: Record<string, number> = {
            title: ARTICLE_MAX_TITLE_LENGTH,
            description: ARTICLE_MAX_DESCRIPTION_LENGTH,
            content: ARTICLE_MAX_CONTENT_LENGTH,
            tag: ARTICLE_MAX_TAG_LENGTH,
        };

        Object.keys(body).forEach(key => {
            if (!allowedUpdates.includes(key)) return;
            let value = body[key];
            if (key === "images") {
                // Accept a single URL (legacy) or an array of URLs; first is the cover
                const rawImages = Array.isArray(value) ? value : [value];
                const normalized = normalizeArticleImages(rawImages).map((u: string) => u.trim().slice(0, ARTICLE_MAX_IMAGE_URL_LENGTH));
                if (normalized.length === 0) return; // empty input keeps existing images
                value = normalized;
            } else if (key === "status") {
                if (value !== "draft" && value !== "published") return;
            } else if (typeof value === 'string') {
                const limit = lengthLimits[key];
                if (limit) value = value.slice(0, limit);
            }
            updateData[key] = value;
        });

        const updatedArticle = await Article.findByIdAndUpdate(
            resolvedParams.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedArticle) {
            return NextResponse.json({ message: "Article not found" }, { status: 404 });
        }

        logAudit({
            action: "article.updated",
            entityType: "article",
            entityId: resolvedParams.id,
            userId: session.user.phoneNumber,
            details: { fields: Object.keys(updateData) },
        });

        return NextResponse.json({ message: "Article updated successfully", article: updatedArticle }, { status: 200 });
    } catch (error) {
        console.error("Error updating article:", error);
        return NextResponse.json({ message: "Error updating article" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = (await getServerSession(authOptions as any) as any);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }

        // Check article management access (editor/admin or a custom role granted the pages)
        const role = await getSessionRole(session);
        if (!hasAnyScope(role, ["manage-articles", "add-article"])) {
            return NextResponse.json({ message: "Insufficient privileges" }, { status: 403 });
        }

        const resolvedParams = await params;
        if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
            return NextResponse.json(
                { message: 'Invalid article ID' },
                { status: 400 }
            );
        }

        await connectToDatabase();
        const deletedArticle = await Article.findByIdAndDelete(resolvedParams.id);

        if (!deletedArticle) {
            return NextResponse.json({ message: "Article not found" }, { status: 404 });
        }

        logAudit({
            action: "article.deleted",
            entityType: "article",
            entityId: resolvedParams.id,
            userId: session.user.phoneNumber,
            details: { title: (deletedArticle as any).title },
        });

        return NextResponse.json({ message: "Article deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting article:", error);
        return NextResponse.json({ message: "Error deleting article" }, { status: 500 });
    }
}
