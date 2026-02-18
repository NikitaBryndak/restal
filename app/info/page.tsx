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

        {/* Popular Destinations Widget */}
        <div className="bg-white/5 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-md">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-6">
            Популярні <span className="text-accent font-bold">напрямки</span>
          </h2>
          <iframe
            srcDoc={`<!DOCTYPE html>
<html><head>
<link rel="stylesheet" href="https://export.otpusk.com/os/hot-module.css?v=1.1" />
<style>
  body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
  * { box-sizing: border-box; outline: none !important; }
  a, a:focus, a:active { outline: none !important; -webkit-tap-highlight-color: transparent; }
  .os-top-countries, .os-top-countries-text {
    border: none !important; outline: none !important; box-shadow: none !important; padding: 0 !important;
  }
  .os-top-countries-text ul {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)) !important;
    list-style: none !important; padding: 0 !important; margin: 0 !important; gap: 10px !important;
  }
  .os-top-countries-text .os-top-countries-item {
    max-width: none !important; width: 100% !important; padding-left: 0 !important;
    margin-bottom: 0 !important; float: none !important; position: static !important;
  }
  .os-top-countries-text .os-top-countries-item > a {
    display: flex !important; align-items: center !important; gap: 12px !important;
    text-decoration: none !important; transition: background 0.3s, border-color 0.3s;
    padding: 12px 16px !important; border-radius: 12px; height: 100%;
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
  }
  .os-top-countries-text .os-top-countries-item > a:hover {
    background: rgba(255,255,255,0.08) !important; border-color: rgba(15,164,230,0.3) !important;
  }
  .os-top-countries-text .os-top-countries-item > a:before { display: none !important; }
  /* Flag: img only, no spans */
  .os-top-countries-text .os-top-countries-item > a > img {
    width: 32px !important; height: 32px !important; min-width: 32px !important;
    border-radius: 50% !important; flex-shrink: 0 !important; object-fit: cover !important;
    vertical-align: middle !important;
  }
  /* JS-injected wrapper for name + price */
  .os-text-group { display: flex !important; flex-direction: column !important; gap: 2px !important; flex: 1 !important; min-width: 0 !important; }
  .os-top-countries-text .os-top-countries-item .os-country-name {
    color: #e8e8e8 !important; font-family: Arial, Helvetica, sans-serif !important;
    font-size: 14px !important; font-weight: 500 !important; line-height: 1.3 !important;
    background: transparent !important; position: static !important;
    display: block !important; width: auto !important; height: auto !important;
  }
  .os-top-countries-text .os-top-countries-item > a:hover .os-country-name { color: #0fa4e6 !important; }
  .os-top-countries-text .os-top-countries-item .os-country-price {
    display: flex !important; align-items: baseline !important; gap: 3px !important;
    white-space: nowrap !important; margin-left: 0 !important;
  }
  .os-top-countries-text .os-top-countries-item .os-country-price span {
    background: transparent !important; position: static !important; line-height: 1.3 !important;
  }
  .os-top-countries-text .os-top-countries-item .os-country-price span:nth-child(1) { color: #555 !important; font-size: 11px !important; }
  .os-top-countries-text .os-top-countries-item .os-country-price span:nth-child(2) { color: #0fa4e6 !important; font-size: 15px !important; font-weight: 700 !important; padding-left: 2px !important; }
  .os-top-countries-text .os-top-countries-item .os-country-price span:nth-child(3) { color: rgba(15,164,230,0.65) !important; font-size: 11px !important; }
  /* Hide any list item that has no price (empty/header items) */
  .os-top-countries-text li:not(:has(.os-country-price)) { display: none !important; }
  .os-top-countries-text ul > :first-child:not(:has(.os-country-price)) { display: none !important; }
</style>
</head><body>
<script src="https://export.otpusk.com/js/top?k=3f80a-01423-b3ca6-0bbab-1a284&t=text&c=8&u=https://restal.in.ua/info&l=ua"><\/script>
<script>
  function sendHeight(){window.parent.postMessage({type:'otpusk-widget-height',height:document.body.scrollHeight},'*')}
  function fixLinks(){document.querySelectorAll('a[href]').forEach(function(a){a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer')})}
  function removeEmpty(){document.querySelectorAll('.os-top-countries-text li').forEach(function(li){var p=li.querySelector('.os-country-price');if(!p)li.remove()})}
  function restructure(){document.querySelectorAll('.os-top-countries-text .os-top-countries-item a').forEach(function(a){var name=a.querySelector('.os-country-name');var price=a.querySelector('.os-country-price');if(name&&price&&!a.querySelector('.os-text-group')){var g=document.createElement('div');g.className='os-text-group';a.insertBefore(g,name);g.appendChild(name);g.appendChild(price)}})}
  function init(){fixLinks();removeEmpty();restructure();sendHeight()}
  window.addEventListener('load',function(){init();setTimeout(init,500);setTimeout(init,1500);setTimeout(sendHeight,3000)});
  new MutationObserver(init).observe(document.body,{childList:true,subtree:true});
<\/script>
</body></html>`}
            style={{ height: widgetHeight, border: 'none', width: '100%', background: 'transparent', outline: 'none', display: 'block' }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            title="Популярні напрямки"
            tabIndex={-1}
          />
        </div>
      </div>
    </main>
  );
}