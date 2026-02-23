"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "motion/react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Spotlight } from "@/components/ui/spotlight-new";
import { Input } from "@/components/ui/input";
import {
  Search,
  BookOpen,
  Compass,
  Newspaper,
} from "lucide-react";
import { ArticleCardSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import ArticleCard from "@/components/article/article-card";

/* ------------------------------------------------------------------ */
/*  Fade-in wrapper                                                    */
/* ------------------------------------------------------------------ */
function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const categories = [
  "All",
  "Популярні країни",
  "Корисно знати",
  "Шпаргалки мандрівникам",
  "Інструкції сайта",
  "Послуги",
  "Умови бронювання",
];

const infoBadges = [
  { icon: BookOpen, text: "Путівники" },
  { icon: Compass, text: "Поради" },
  { icon: Newspaper, text: "Новини" },
];

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function InfoPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeHeightRef = useRef(420);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data) return;
      if (
        event.data.type === "otpusk-top-resize" &&
        typeof event.data.height === "number"
      ) {
        const newHeight = Math.max(event.data.height, 300);
        if (Math.abs(newHeight - iframeHeightRef.current) > 20) {
          iframeHeightRef.current = newHeight;
          if (iframeRef.current) {
            iframeRef.current.style.height = newHeight + "px";
          }
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/articles");
        if (res.ok) {
          const data = await res.json();
          const articlesArray = Array.isArray(data)
            ? data
            : data?.articles || [];
          setArticles(articlesArray);
        }
      } catch (err) {
        console.error("Error fetching articles:", err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.tag === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="relative min-h-screen w-full bg-black">
      {/* ============================================================ */}
      {/*  HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="relative pt-28 pb-14 sm:pt-24 max-sm:pt-20 overflow-hidden">
        {/* Spotlight background */}
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(197, 100%, 50%, 0.12) 0, hsla(197, 100%, 45%, 0.06) 50%, transparent 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 60%, 0.1) 0, hsla(197, 100%, 45%, 0.04) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 50%, 0.06) 0, transparent 80%)"
          translateY={-200}
          duration={9}
        />

        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 max-sm:px-3">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium backdrop-blur-sm">
              <BookOpen className="w-4 h-4" />
              Інфо центр
            </span>
          </motion.div>

          {/* Title */}
          <div className="text-center">
            <TextGenerateEffect
              words="Інфо центр"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light"
              accentWords={["центр"]}
              accentClassName="text-accent font-bold"
            />
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-white/50 text-base sm:text-lg md:text-xl mt-5 max-w-2xl mx-auto leading-relaxed text-center"
          >
            Відкрийте для себе путівники, поради та історії подорожей з усього
            світу.
          </motion.p>

          {/* Info badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            {infoBadges.map((b) => (
              <div
                key={b.text}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/8 text-white/70 text-sm hover:border-accent/30 hover:text-white/90 transition-colors duration-300"
              >
                <b.icon className="w-4 h-4 text-accent" />
                {b.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SEARCH & FILTER                                              */}
      {/* ============================================================ */}
      <section className="relative py-6 md:py-10">
        <div className="relative z-10 max-w-6xl mx-auto px-4 max-sm:px-3">
          <FadeIn>
            <div className="relative p-5 sm:p-6 rounded-2xl border border-white/6 overflow-hidden backdrop-blur-sm">
              {/* Glass background */}
              <div className="absolute inset-0 bg-linear-to-br from-white/4 via-white/2 to-accent/3" />
              {/* Top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/30 to-transparent" />

              <div className="relative z-10 flex flex-col lg:flex-row gap-5 items-center justify-between">
                {/* Categories */}
                <div className="flex overflow-x-auto gap-2 w-full lg:w-auto pb-2 lg:pb-0 hide-scrollbar min-w-0">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border whitespace-nowrap shrink-0",
                        selectedCategory === category
                          ? "bg-accent text-white border-accent shadow-lg shadow-accent/25"
                          : "bg-transparent text-white/50 border-white/8 hover:border-accent/40 hover:text-white/90"
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full lg:w-72 shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    placeholder="Шукати статті..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 bg-black/40 border-white/10 focus:border-accent/50 h-11 w-full rounded-xl"
                  />
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  ARTICLES GRID                                                */}
      {/* ============================================================ */}
      <section className="relative py-10 md:py-14">
        {/* Section glow */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[400px] bg-accent/4 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 max-sm:px-3">
          {/* Section header */}
          <FadeIn className="text-center mb-10 md:mb-14">
            <span className="text-accent text-xs font-semibold uppercase tracking-[0.2em]">
              Статті
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-2">
              {selectedCategory === "All"
                ? "Усі публікації"
                : selectedCategory}
            </h2>
          </FadeIn>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <FadeIn className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
                <Search className="w-7 h-7 text-white/20" />
              </div>
              <p className="text-white/50 text-lg font-medium">
                Статей не знайдено
              </p>
              <p className="text-white/30 text-sm mt-2">
                Спробуйте інший запит або категорію.
              </p>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredArticles.slice(0, 6).map((article: any, index: number) => (
                <FadeIn key={article._id} delay={index * 0.06}>
                  <ArticleCard data={article} />
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  POPULAR DESTINATIONS WIDGET                                  */}
      {/* ============================================================ */}
      <section className="relative py-10 md:py-14 px-4 max-sm:px-3">
        {/* Glow behind widget */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/4 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <FadeIn>
            {/* Section header */}
            <div className="text-center mb-8">
              <span className="text-accent text-xs font-semibold uppercase tracking-[0.2em]">
                Популярні напрямки
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-2">
                Гарячі пропозиції
              </h2>
              <p className="text-white/40 text-sm mt-2 max-w-lg mx-auto">
                Найкращі ціни на подорожі до популярних країн
              </p>
            </div>

            {/* Widget label */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-white/40 text-sm font-medium tracking-wide uppercase">
                Актуальні ціни
              </span>
            </div>

            <div className="relative bg-white/3 border border-white/10 rounded-3xl shadow-2xl shadow-accent/5" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>
              {/* Decorative top gradient bar */}
              <div className="h-px w-full bg-linear-to-r from-transparent via-accent/50 to-transparent" />

              <div className="p-4 sm:p-6" style={{ WebkitOverflowScrolling: 'touch', overflow: 'auto' }}>
                <iframe
                  ref={iframeRef}
                  src="/otpusk-top-countries.html"
                  title="Популярні напрямки"
                  style={{
                    width: "100%",
                    height: "420px",
                    border: "none",
                    display: "block",
                    WebkitTransform: 'translateZ(0)',
                  }}
                  allow="clipboard-write"
                  loading="lazy"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}