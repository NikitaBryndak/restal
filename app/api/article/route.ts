import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/article";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();

        await connectToDatabase();

        const creatorPhone = session.user.phoneNumber;

        const toCreate = {
                ...body,
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