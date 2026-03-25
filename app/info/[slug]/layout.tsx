import type { Metadata } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import Article from '@/models/article';
import mongoose from 'mongoose';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    await connectToDatabase();

    let article: any = null;

    // First, try to fetch by numeric ID if slug is a number
    if (!Number.isNaN(Number(slug))) {
      const numericId = Number(slug);
      article = await Article.findOne({ articleID: numericId }).lean();
    }

    // Test if valid Mongo ID
    if (!article && mongoose.Types.ObjectId.isValid(slug)) {
      try {
        const objectId = new mongoose.Types.ObjectId(slug);
        article = await Article.findOne({ _id: objectId }).lean();
      } catch (e) {
        // ignore
      }
    }

    // If not found, try to search all articles by title to match slug
    if (!article) {
      // we need to find the article where title formatted as slug matches
      // it might not be efficient to pull all but that's what page.tsx does effectively
      const allArticles = await Article.find({}).lean();
      article = allArticles.find((a: any) => a.title?.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase());
    }

    if (article) {
      const imageUrl = article.images || article.image;

      const metadataResult: Metadata = {
        title: article.title,
        description: article.description || article.title,
      };

      if (imageUrl) {
        metadataResult.openGraph = {
          title: article.title,
          description: article.description || article.title,
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: article.title,
            }
          ],
        };
        metadataResult.twitter = {
          card: 'summary_large_image',
          title: article.title,
          description: article.description || article.title,
          images: [imageUrl],
        };
      } else {
        metadataResult.openGraph = {
          title: article.title,
          description: article.description || article.title,
        };
        metadataResult.twitter = {
          card: 'summary',
          title: article.title,
          description: article.description || article.title,
        };
      }

      return metadataResult;
    }
  } catch (error) {
    console.error('Error generating metadata for article:', error);
  }

  return {
    title: 'Стаття',
  };
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}