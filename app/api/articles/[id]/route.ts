import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Article from '@/models/article';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        console.log('GET article with ID:', resolvedParams.id);
        
        await connectToDatabase();
        
        // Use Mongoose's native string to ObjectId conversion
        const article = await Article.findById(resolvedParams.id).lean();
        console.log('Found article:', article);

        if (!article) {
            console.log('Article not found in database');
            return NextResponse.json(
                { message: 'Article not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(article);
    } catch (error) {
        console.error('Error fetching article:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
