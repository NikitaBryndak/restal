"use client";

import { useState, useEffect } from "react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ArticleCard from "@/components/article/article-card";

export default function InfoPage() {
  const categories = ["All", "Популярні країни", "Корисно знати", "Шпаргалки мандрівникам", "Інструкції сайта", "Послуги", "Умови бронювання"];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [widgetHeight, setWidgetHeight] = useState(300);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'otpusk-widget-height' && typeof e.data.height === 'number') {
        setWidgetHeight(e.data.height);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch('/api/articles');
        if (res.ok) {
          const data = await res.json();
          // Handle different response formats
          const articlesArray = Array.isArray(data) ? data : (data?.articles || []);
          setArticles(articlesArray);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.tag === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen w-full flex flex-col items-center px-3 sm:px-4 py-12 sm:py-24 relative overflow-hidden">
      <div className="w-full max-w-7xl mx-auto space-y-12">

        {/* Header Section */}
        <div className="text-center space-y-6">
          <TextGenerateEffect
            words="Інфо центр"
            className="text-4xl md:text-5xl lg:text-6xl font-light"
            accentWords={["центр"]}
            accentClassName="text-accent font-bold"
          />
          <p className="text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Відкрийте для себе путівники, поради та історії подорожей з усього світу.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 w-full lg:w-auto pb-2 lg:pb-0 hide-scrollbar min-w-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border whitespace-nowrap flex-shrink-0",
                  selectedCategory === category
                    ? "bg-accent text-white border-accent"
                    : "bg-transparent text-secondary border-white/10 hover:border-accent/50 hover:text-white"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <Input
              placeholder="Шукати статті..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 bg-black/40 border-white/10 focus:border-accent/50 h-10 w-full"
            />
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-secondary text-lg">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-secondary text-lg">No articles found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article: any) => (
              <ArticleCard key={article._id} data={article} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}