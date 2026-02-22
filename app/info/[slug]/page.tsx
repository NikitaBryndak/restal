"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Tag, BookOpen } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { motion, useInView } from "motion/react";
import { Spotlight } from "@/components/ui/spotlight-new";
import ArticleContentPreview from "@/components/article/article-content-preview";

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

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${resolvedParams.slug}`);

        if (res.ok) {
          const data = await res.json();
          setArticle(data.article || data);
          setLoading(false);
          return;
        } else if (res.status === 400 || res.status === 404) {
          const allRes = await fetch("/api/articles");
          if (allRes.ok) {
            const allData = await allRes.json();
            const articlesArray = Array.isArray(allData)
              ? allData
              : allData?.articles || [];
            const found = articlesArray.find(
              (a: any) =>
                a.title.toLowerCase().replace(/\s+/g, "-") ===
                resolvedParams.slug.toLowerCase()
            );
            if (found) {
              setArticle(found);
            } else {
              setNotFound(true);
            }
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Error fetching article:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [resolvedParams.slug]);

  /* Loading state */
  if (loading) {
    return (
      <main className="relative min-h-screen w-full overflow-x-hidden bg-black flex flex-col items-center justify-center">
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(197, 100%, 50%, 0.08) 0, hsla(197, 100%, 45%, 0.04) 50%, transparent 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 60%, 0.06) 0, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 50%, 0.04) 0, transparent 80%)"
          translateY={-200}
          duration={9}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Завантаження статті…</p>
        </motion.div>
      </main>
    );
  }

  /* Not found state */
  if (notFound || !article) {
    return (
      <main className="relative min-h-screen w-full overflow-x-hidden bg-black flex flex-col items-center justify-center">
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(197, 100%, 50%, 0.08) 0, hsla(197, 100%, 45%, 0.04) 50%, transparent 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 60%, 0.06) 0, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 50%, 0.04) 0, transparent 80%)"
          translateY={-200}
          duration={9}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 relative z-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7 text-white/20" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Статтю не знайдено
          </h1>
          <Link
            href="/info"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all duration-200 shadow-lg shadow-accent/25 hover:shadow-accent/35 hover:scale-[1.01] active:scale-[0.99] text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад до Інфо центру
          </Link>
        </motion.div>
      </main>
    );
  }

  /* Article view */
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black">
      {/* ============================================================ */}
      {/*  HERO — IMAGE + TITLE                                         */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden">
        {/* Spotlight behind image area */}
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(197, 100%, 50%, 0.10) 0, hsla(197, 100%, 45%, 0.05) 50%, transparent 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 60%, 0.08) 0, hsla(197, 100%, 45%, 0.03) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 50%, 0.05) 0, transparent 80%)"
          translateY={-200}
          duration={9}
        />

        {/* Back navigation */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 max-sm:px-3 pt-24 max-sm:pt-20">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              href="/info"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-200 group text-sm"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              Назад до Інфо центру
            </Link>
          </motion.div>
        </div>

        {/* Image hero */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 max-sm:px-3 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/6"
          >
            {/* Image container */}
            <div className="relative h-52 sm:h-64 md:h-80 w-full">
              {(article.images || article.image) ? (
                <img
                  src={article.images || article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-accent/10 via-white/5 to-accent/5" />
              )}
              {/* Desktop: gradient overlay for text readability */}
              <div className="hidden sm:block absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
              {/* Mobile: simple bottom fade */}
              <div className="sm:hidden absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
            </div>

            {/* Desktop: content overlay on top of image */}
            <div className="hidden sm:block absolute bottom-0 left-0 w-full p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                {article.tag && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-accent text-xs sm:text-sm font-medium backdrop-blur-sm">
                    <Tag className="w-3 h-3" />
                    {article.tag}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/10 text-white/60 text-xs sm:text-sm backdrop-blur-sm">
                  <Calendar className="w-3 h-3" />
                  Нещодавно опубліковано
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                {article.title}
              </h1>
              {article.description && (
                <p className="text-sm md:text-base text-white/60 mt-2 max-w-2xl leading-relaxed line-clamp-2">
                  {article.description}
                </p>
              )}
            </div>

            {/* Mobile: content below image */}
            <div className="sm:hidden p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {article.tag && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/25 text-accent text-xs font-medium">
                    <Tag className="w-3 h-3" />
                    {article.tag}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/8 border border-white/10 text-white/50 text-xs">
                  <Calendar className="w-3 h-3" />
                  Нещодавно
                </span>
              </div>
              <h1 className="text-xl font-bold text-white leading-snug">
                {article.title}
              </h1>
              {article.description && (
                <p className="text-sm text-white/50 leading-relaxed line-clamp-3">
                  {article.description}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  ARTICLE CONTENT                                              */}
      {/* ============================================================ */}
      <section className="relative py-10 md:py-16">
        {/* Decorative glow */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-accent/3 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 max-sm:px-3">
          <FadeIn>
            <div className="relative rounded-2xl sm:rounded-3xl border border-white/6 overflow-hidden backdrop-blur-sm">
              {/* Glass background */}
              <div className="absolute inset-0 bg-linear-to-br from-white/4 via-white/2 to-accent/3" />
              {/* Top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/20 to-transparent" />

              <div className="relative z-10 p-5 sm:p-8 md:p-12">
                <ArticleContentPreview content={article.content} />
              </div>
            </div>
          </FadeIn>

          {/* Bottom back link */}
          <FadeIn delay={0.15}>
            <div className="mt-10 text-center">
              <Link
                href="/info"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/8 text-white/60 hover:text-white hover:border-accent/30 transition-all duration-300 text-sm font-medium group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                Переглянути всі статті
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}