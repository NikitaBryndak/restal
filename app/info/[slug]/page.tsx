import Link from "next/link";
import { articlesData } from "@/app/info/articlesData";

export default function ArticlePage({params}: {params: {slug: string} }) {
    const article = articlesData.find((articleItem) => articleItem.link.endsWith(params.slug));

    if (!article){
        return (
        <main className="max-w-4xl mx-auto py-10 px-6 text-center text-red-600">
            <p>Article not found.</p>
            <Link
            href="/info"
            className="inline-block mt-4 px-6 py-3 border border-blue-600 text-white-600 rounded-md hover:bg-blue-600 hover:text-white transition"
            >
            ← Back to Info Center
            </Link>
        </main>
        );
    }

    return (
    <main className="max-w-4xl mx-auto py-10 px-6">

        <Link
        href="/info"
        className="bg-accent inline-block mb-8 px-6 py-2 border border-blue-600 text-white-600 rounded-md hover:bg-white hover:text-black transition"
      >
        ← Back to Info Center
      </Link>


      <h1 className="text-4xl font-bold text-white-900 mb-4">{article.title}</h1>
      <img
        src={article.image}
        alt={article.title}
        className="rounded-lg mb-6 w-full h-80 object-cover"
      />
      <p className="text-white-600 text-lg mb-6">
        {article.description} 
      </p>
      <div
        className="text-white-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: article.content || "<p>No content available.</p>" }}
      />
    </main>
  );
}  