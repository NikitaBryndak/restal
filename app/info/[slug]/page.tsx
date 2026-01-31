import Link from "next/link";
import { articlesData } from "@/app/info/articlesData";
import { ArrowLeft, Calendar } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

export default function ArticlePage({params}: {params: {slug: string} }) {
    const article = articlesData.find((articleItem) => articleItem.link.endsWith(params.slug));

    if (!article){
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
                    <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
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