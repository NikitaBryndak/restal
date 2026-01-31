"use client";

import { useState } from "react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { articlesData } from "@/app/info/articlesData";
import { cn } from "@/lib/utils";

export default function InfoPage() {
  const categories = ["All", "First", "Second", "Third", "Fourth", "Fifth"];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = articlesData.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.tag === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen w-full flex flex-col items-center px-4 py-24 relative overflow-hidden">
      <div className="w-full max-w-7xl mx-auto space-y-12">

        {/* Header Section */}
        <div className="text-center space-y-6">
          <TextGenerateEffect
            words="Info Center"
            className="text-4xl md:text-5xl lg:text-6xl font-light"
            accentWords={["Center"]}
            accentClassName="text-accent font-bold"
          />
          <p className="text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Discover travel guides, tips, and stories from around the world.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
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
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-white/10 focus:border-accent/50 h-10 w-full"
            />
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article, index) => (
            <Link
              href={article.link}
              key={index}
              className="group bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md overflow-hidden hover:border-accent/50 transition-all duration-300 flex flex-col"
            >
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                  <span className="text-xs font-medium text-white">{article.tag}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col grow space-y-4">
                <div className="space-y-2 grow">
                  <h3 className="text-xl font-semibold text-white group-hover:text-accent transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-secondary text-sm line-clamp-3 leading-relaxed">
                    {article.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-secondary">
                    <Calendar className="w-4 h-4" />
                    <span>Recently</span>
                  </div>
                  <div className="flex items-center gap-1 text-accent font-medium group-hover:translate-x-1 transition-transform">
                    Read Article
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-secondary text-lg">No articles found matching your criteria.</p>
          </div>
        )}
      </div>
    </main>
  );
}