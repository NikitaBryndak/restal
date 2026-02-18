import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Article from '@/models/article';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        await connectToDatabase();

        console.log(`Fetching article with ID: ${resolvedParams.id}`); // Logging for debugging

        let article = null;
        if (!isNaN(Number(resolvedParams.id))) {
            const numericId = Number(resolvedParams.id);
            console.log(`Searching by articleID: ${numericId}`);
            article = await Article.findOne({ articleID: numericId }).lean();
        }

        let articleById = null;
        if (mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
            console.log(`Searching by _id: ${resolvedParams.id}`);
            // Use findOne with explicit _id cast just to be absolutely sure
            try {
                const objectId = new mongoose.Types.ObjectId(resolvedParams.id);
                articleById = await Article.findOne({ _id: objectId }).lean();
            } catch (err) {
                console.error("Error creating ObjectId:", err);
            }
        } else {
            console.log(`ID is not a valid ObjectId: ${resolvedParams.id}`);
        }

        const foundArticle = article || articleById;
        console.log(`Article found: ${!!foundArticle}`);

        if (!foundArticle) {
            console.log(`Article not found for ID: ${resolvedParams.id}`);
            return NextResponse.json(
                { message: 'Article not found' },
                { status: 404 }
            );
        }

        // Must serialize ObjectId to string explicitly if it wasn't done by lean() (though lean usually does)
        // Or if it's returning Number type for articleID but string for _id
        const sanitizedArticle = {
            ...foundArticle,
            _id: foundArticle._id.toString(),
            createdAt: foundArticle.createdAt ? new Date(foundArticle.createdAt).toISOString() : null,
            updatedAt: foundArticle.updatedAt ? new Date(foundArticle.updatedAt).toISOString() : null,
        };

        return NextResponse.json({ article: sanitizedArticle });
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

        // Check privilege level - must be tier 2 or above
        if ((session.user.privilegeLevel ?? 1) < 2) {
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
        const allowedUpdates = ['title', 'description', 'content', 'tag', 'images'];
        const updateData: any = {};

        Object.keys(body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateData[key] = body[key];
            }
        });

        const updatedArticle = await Article.findByIdAndUpdate(
            resolvedParams.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedArticle) {
            return NextResponse.json({ message: "Article not found" }, { status: 404 });
        }

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

        // Check privilege level - must be tier 2 or above
        if ((session.user.privilegeLevel ?? 1) < 2) {
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

        return NextResponse.json({ message: "Article deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting article:", error);
        return NextResponse.json({ message: "Error deleting article" }, { status: 500 });
    }
}
