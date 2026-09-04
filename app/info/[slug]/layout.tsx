import type { Metadata } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { resolveArticleBySlug, serializeArticle } from '@/lib/articles';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    await connectToDatabase();
    const article = await resolveArticleBySlug(slug);

    if (article) {
      const serialized = serializeArticle(article);
      const coverImage = serialized.images[0];

      const metadataResult: Metadata = {
        title: serialized.title,
        description: serialized.description || serialized.title,
        // Drafts must never be indexed or cached by crawlers
        robots: serialized.status === 'draft' ? { index: false, follow: false } : undefined,
      };

      if (coverImage) {
        metadataResult.openGraph = {
          title: serialized.title,
          description: serialized.description || serialized.title,
          images: [
            {
              url: coverImage,
              width: 1200,
              height: 630,
              alt: serialized.title,
            }
          ],
        };
        metadataResult.twitter = {
          card: 'summary_large_image',
          title: serialized.title,
          description: serialized.description || serialized.title,
          images: [coverImage],
        };
      } else {
        metadataResult.openGraph = {
          title: serialized.title,
          description: serialized.description || serialized.title,
        };
        metadataResult.twitter = {
          card: 'summary',
          title: serialized.title,
          description: serialized.description || serialized.title,
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
