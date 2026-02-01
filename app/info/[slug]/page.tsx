"use client";

import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { use } from "react";

export default function ArticlePage({params}: {params: Promise<{slug: string}>}) {
    const resolvedParams = use(params);
    const [article, setArticle] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                // Try fetching by ID first
                console.log('Fetching article with slug:', resolvedParams.slug);
                const res = await fetch(`/api/articles/${resolvedParams.slug}`);
                console.log('Fetch response status:', res.status);

                if (res.ok) {
                    const data = await res.json();
                    console.log('Article data:', data);
                    setArticle(data);
                    setLoading(false);
                    return;
                } else if (res.status === 400 || res.status === 404) {
                    // If not a valid ID, try fetching all articles and searching by title
                    console.log('Slug not a valid ID, searching by title...');
                    const allRes = await fetch('/api/articles');
                    if (allRes.ok) {
                        const allData = await allRes.json();
                        const articlesArray = Array.isArray(allData) ? allData : (allData?.articles || []);
                        console.log('All articles:', articlesArray);
                        const found = articlesArray.find((a: any) =>
                            a.title.toLowerCase().replace(/\s+/g, '-') === resolvedParams.slug.toLowerCase()
                        );
                        if (found) {
                            console.log('Found article by title:', found);
                            setArticle(found);
                        } else {
                            console.log('Article not found by title');
                            setNotFound(true);
                        }
                    } else {
                        setNotFound(true);
                    }
                } else {
                    setNotFound(true);
                }
            } catch (err) {
                console.error('Error fetching article:', err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [resolvedParams.slug]);

    if (loading) {
        return (
            <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-24">
                <p className="text-secondary text-lg">Loading article...</p>
            </main>
        );
    }

    if (notFound || !article){
        return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-24">
            <div className="text-center space-y-6">
                <h1 className="text-3xl font-bold text-white">Статтю не знайдено</h1>
                <Link
                    href="/info"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Назад до Інфо центру
                </Link>
            </div>
        </main>
        );
    }

    return (
    <main className="min-h-screen w-full flex flex-col items-center px-4 py-24 relative overflow-hidden">
       <div className="w-full max-w-4xl mx-auto">
            <Link
                href="/info"
                className="inline-flex items-center gap-2 text-secondary hover:text-white transition-colors mb-8 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Назад до Інфо центру
            </Link>

            <article className="bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md overflow-hidden">
                <div className="relative h-[400px] w-full">
                    {(article.images || article.image) && (
                        <img
                            src={article.images || article.image}
                            alt={article.title}
                            className="w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="px-3 py-1 rounded-full bg-accent text-white text-sm font-medium">
                                {article.tag}
                            </span>
                            <div className="flex items-center gap-2 text-white/80 text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>Нещодавно опубліковано</span>
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                            {article.title}
                        </h1>
                        <p className="text-lg text-white/90 max-w-2xl">
                            {article.description}
                        </p>
                        <p className="text-sm text-white/60 mt-4">
                            By {article.creatorEmail}
                        </p>
                    </div>
                </div>

                <div className="p-8 md:p-12">
                    <div
                        className="prose prose-invert prose-lg max-w-none
                        prose-headings:text-white prose-p:text-secondary prose-strong:text-white
                        prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                        prose-li:text-secondary prose-blockquote:border-accent prose-blockquote:bg-white/5 prose-blockquote:p-4 prose-blockquote:rounded-r-lg"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content || "<p>No content available.</p>") }}
                    />
                </div>
            </article>
       </div>
    </main>
  );
}