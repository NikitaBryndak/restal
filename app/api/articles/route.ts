import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/article";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import Counter from "@/models/counter";

// SECURITY: Maximum allowed lengths for article fields
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CONTENT_LENGTH = 50000;
const MAX_TAG_LENGTH = 50;
const MAX_IMAGE_URL_LENGTH = 2000;

export async function GET() {
    try {
        await connectToDatabase();

        // SECURITY: Limit results to prevent loading unbounded data
        const articles = await Article.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        // Ensure _id is string for client consistency
         const serializedArticles = articles.map((article: any) => ({
             ...article,
             _id: article._id.toString(),
             createdAt: article.createdAt ? new Date(article.createdAt).toISOString() : null,
             updatedAt: article.updatedAt ? new Date(article.updatedAt).toISOString() : null,
         }));

        return NextResponse.json({ articles: serializedArticles }, { status: 200 });
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

        // Check privilege level - must be tier 2 or above
        if ((session.user.privilegeLevel ?? 1) < 2) {
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
        if (!body.images || typeof body.images !== 'string') {
            return NextResponse.json({ message: "Image URL is required" }, { status: 400 });
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
            title: body.title.trim().slice(0, MAX_TITLE_LENGTH),
            description: body.description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
            content: body.content.slice(0, MAX_CONTENT_LENGTH),
            tag: body.tag.trim().slice(0, MAX_TAG_LENGTH),
            images: body.images.trim().slice(0, MAX_IMAGE_URL_LENGTH),
        };

        const created = await Article.create(toCreate);

        if (!created) {
            return NextResponse.json({ message: 'Failed to create article' }, { status: 500 });
        }

        return NextResponse.json({ article: created }, { status: 201 });
    } catch {
        return NextResponse.json({ message: "Error creating article" }, { status: 500 });
    }
}