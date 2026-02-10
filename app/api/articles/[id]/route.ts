import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Article from '@/models/article';
import mongoose from 'mongoose';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;

        // SECURITY: Validate ObjectId format to prevent injection
        if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
            return NextResponse.json(
                { message: 'Invalid article ID' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const article = await Article.findById(resolvedParams.id).lean();

        if (!article) {
            return NextResponse.json(
                { message: 'Article not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(article);
    } catch {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
