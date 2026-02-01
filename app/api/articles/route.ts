import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/article";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import Counter from "@/models/counter";

export async function GET() {
    try {
        await connectToDatabase();

        const articles = await Article.find().sort({ createdAt: -1 }).lean();

        return NextResponse.json({ articles }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: "Error fetching articles", error: message }, { status: 500 });
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

        await connectToDatabase();

        const creatorPhone = session.user.phoneNumber;
        const counter = await Counter.findOneAndUpdate(
            { name: "articleID" },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        );

        const articleID = counter.value;

        const toCreate = {
                ...body,
                articleID,
                creatorPhone
            };

        const created = await Article.create(toCreate);

        if (!created) {
            return NextResponse.json({ message: 'Failed to create article' }, { status: 500 });
        }

        return NextResponse.json({ article: created }, { status: 201 });
    } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return NextResponse.json({ message: "Error creating article", error: message }, { status: 500 });
    }
}