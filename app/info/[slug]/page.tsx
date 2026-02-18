"use client";

import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { use } from "react";
import ArticleContentPreview from "@/components/article/article-content-preview";

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
                    // Handle wrapped response { article: ... } or direct object
                    setArticle(data.article || data);
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
    <main className="min-h-screen w-full flex flex-col items-center px-3 sm:px-4 py-12 sm:py-24 relative overflow-hidden">
       <div className="w-full max-w-4xl mx-auto">
            <Link
                href="/info"
                className="inline-flex items-center gap-2 text-secondary hover:text-white transition-colors mb-6 sm:mb-8 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Назад до Інфо центру
            </Link>

            <article className="bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-md overflow-hidden">
                <div className="relative h-[220px] sm:h-[300px] md:h-[400px] w-full">
                    {(article.images || article.image) && (
                        <img
                            src={article.images || article.image}
                            alt={article.title}
                            className="w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4 sm:p-8 md:p-12 w-full">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-accent text-white text-xs sm:text-sm font-medium">
                                {article.tag}
                            </span>
                            <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>Нещодавно опубліковано</span>
                            </div>
                        </div>
                        <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight">
                            {article.title}
                        </h1>
                        <p className="text-sm sm:text-lg text-white/90 max-w-2xl line-clamp-2 sm:line-clamp-none">
                            {article.description}
                        </p>
                    </div>
                </div>

                <div className="p-4 sm:p-8 md:p-12">
                    <ArticleContentPreview content={article.content} />
                </div>
            </article>
       </div>
    </main>
  );
}