import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Article, { normalizeArticleImages } from "@/models/article";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Counter from "@/models/counter";
import { EDITOR_PRIVILEGE_LEVEL, ADMIN_PRIVILEGE_LEVEL, ARTICLE_MAX_TITLE_LENGTH, ARTICLE_MAX_DESCRIPTION_LENGTH, ARTICLE_MAX_CONTENT_LENGTH, ARTICLE_MAX_TAG_LENGTH, ARTICLE_MAX_IMAGE_URL_LENGTH } from "@/config/constants";
import { logAudit } from "@/lib/audit";
import { PUBLISHED_ARTICLE_QUERY, serializeArticle } from "@/lib/articles";

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        // Editors/admins can request drafts for the manage-articles UI
        const url = new URL(request.url);
        const includeDrafts = url.searchParams.get("includeDrafts") === "true";
        let query: Record<string, unknown> = PUBLISHED_ARTICLE_QUERY;
        if (includeDrafts) {
            const session = (await getServerSession(authOptions as any) as any);
            const level = session?.user?.privilegeLevel ?? 1;
            if (level === EDITOR_PRIVILEGE_LEVEL || level === ADMIN_PRIVILEGE_LEVEL) {
                query = {};
            }
        }

        // SECURITY: Limit results to prevent loading unbounded data
        const articles = await Article.find(query as never)
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        // SECURITY: Exclude creatorPhone from public response to prevent PII leakage;
        // normalize legacy single-string images and default status for old docs
        const serializedArticles = (articles as unknown[]).map((a) => serializeArticle(a as never));

        const isPublic = Object.keys(query).length > 0;
        const response = NextResponse.json({ articles: serializedArticles }, { status: 200 });
        if (isPublic) {
            // Cache publicly for 60s at CDN, serve stale for 5min while revalidating
            response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
        } else {
            response.headers.set("Cache-Control", "private, no-store");
        }
        return response;
    } catch {
        return NextResponse.json({ message: "Error fetching articles" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = (await getServerSession(authOptions as any) as any);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }

        // Check privilege level - must be editor or admin
        const level = session.user.privilegeLevel ?? 1;
        if (level !== EDITOR_PRIVILEGE_LEVEL && level !== ADMIN_PRIVILEGE_LEVEL) {
            return NextResponse.json({ message: "Insufficient privileges" }, { status: 403 });
        }

        const body = await request.json();

        // SECURITY: Validate required fields
        if (!body.title || typeof body.title !== 'string') {
            return NextResponse.json({ message: "Title is required" }, { status: 400 });
        }
        if (!body.content || typeof body.content !== 'string') {
            return NextResponse.json({ message: "Content is required" }, { status: 400 });
        }
        if (!body.tag || typeof body.tag !== 'string') {
            return NextResponse.json({ message: "Tag is required" }, { status: 400 });
        }
        if (!body.description || typeof body.description !== 'string') {
            return NextResponse.json({ message: "Description is required" }, { status: 400 });
        }
        // Images: accept a single URL (legacy) or an array of URLs; first is the cover
        const rawImages = Array.isArray(body.images) ? body.images : [body.images];
        const images = normalizeArticleImages(rawImages).map((u: string) => u.trim().slice(0, ARTICLE_MAX_IMAGE_URL_LENGTH));
        if (images.length === 0) {
            return NextResponse.json({ message: "At least one image URL is required" }, { status: 400 });
        }

        // Optional publish state — defaults to published for backward compatibility
        const status = body.status === undefined ? "published" : body.status;
        if (status !== "draft" && status !== "published") {
            return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }

        await connectToDatabase();

        const creatorPhone = session.user.phoneNumber;
        const counter = await Counter.findOneAndUpdate(
            { name: "articleID" },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        );

        const articleID = counter.value;

        // SECURITY: Whitelist only allowed fields to prevent mass assignment
        const toCreate = {
            articleID,
            creatorPhone,
            title: body.title.trim().slice(0, ARTICLE_MAX_TITLE_LENGTH),
            description: body.description.trim().slice(0, ARTICLE_MAX_DESCRIPTION_LENGTH),
            content: body.content.slice(0, ARTICLE_MAX_CONTENT_LENGTH),
            tag: body.tag.trim().slice(0, ARTICLE_MAX_TAG_LENGTH),
            images,
            status,
        };

        const created = await Article.create(toCreate);

        if (!created) {
            return NextResponse.json({ message: 'Failed to create article' }, { status: 500 });
        }

        logAudit({
            action: "article.created",
            entityType: "article",
            entityId: created._id.toString(),
            userId: session.user.phoneNumber,
            details: { title: toCreate.title, articleID },
        });

        return NextResponse.json({ article: created }, { status: 201 });
    } catch {
        return NextResponse.json({ message: "Error creating article" }, { status: 500 });
    }
}