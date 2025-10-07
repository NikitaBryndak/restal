import { articlesData } from "@/app/info/articlesData";
import { notFound } from "next/navigation";

export default function ArticlePage({params}: {params: {slug: string} }) {
    const article = articlesData.find((articleItem) => articleItem.link.endsWith(params.slug));

    if (!article){
        return notFound();
    }

    return (
    <main className="max-w-4xl mx-auto py-10 px-6">
      <h1 className="text-4xl font-bold text-blue-900 mb-4">{article.title}</h1>
      <img
        src={article.image}
        alt={article.title}
        className="rounded-lg mb-6 w-full h-80 object-cover"
      />
      <p className="text-gray-600 text-lg mb-6">
        {article.description} 
      </p>
      <div
        className="text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: article.content || "<p>No content available.</p>" }}
      />
    </main>
  );
}  