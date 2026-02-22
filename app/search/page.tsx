"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Spotlight } from "@/components/ui/spotlight-new";
import { titleTextFadeDuration } from "@/config";
import SearchSection from "@/components/search/search-section";
import {
  Bot,
  Sparkles,
  MessageCircle,
  Zap,
  Globe,
  Shield,
  Phone,
  ArrowRight,
} from "lucide-react";

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
const capabilities = [
  {
    icon: Globe,
    title: "Напрямки та країни",
    desc: "Інформація про погоду, візи, кращий сезон та місцеві особливості",
  },
  {
    icon: Zap,
    title: "Миттєві відповіді",
    desc: "Отримайте поради та рекомендації за лічені секунди",
  },
  {
    icon: MessageCircle,
    title: "Природний діалог",
    desc: "Спілкуйтесь як з другом — запитуйте будь-що про подорожі",
  },
];

const highlights = [
  { icon: Shield, text: "Безкоштовно" },
  { icon: Sparkles, text: "Без реєстрації" },
  { icon: Zap, text: "Миттєво" },
];

export default function SearchPage() {
  const [chatActive, setChatActive] = useState(false);

  const handleChatToggle = useCallback((open: boolean) => {
    setChatActive(open);
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-chat-active", chatActive ? "true" : "false");
    return () => document.body.removeAttribute("data-chat-active");
  }, [chatActive]);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black">
      {/* ============================================================ */}
      {/*  HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 max-sm:px-3 overflow-hidden">
        {/* Spotlight background */}
        <div
          className={`transition-opacity duration-700 ${
            chatActive ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <Spotlight
            gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(197, 100%, 50%, 0.12) 0, hsla(197, 100%, 45%, 0.06) 50%, transparent 80%)"
            gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 60%, 0.1) 0, hsla(197, 100%, 45%, 0.04) 80%, transparent 100%)"
            gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 50%, 0.06) 0, transparent 80%)"
            translateY={-200}
            duration={9}
          />
        </div>

        {/* Subtle radial glow */}
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/6 rounded-full blur-[120px] pointer-events-none transition-opacity duration-700 ${
            chatActive ? "opacity-0" : "opacity-100"
          }`}
        />

        <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col gap-10 max-sm:gap-6 items-center text-center">
          {/* Badge + Title — hide on chat active */}
          <div
            className={`transition-all duration-700 ease-out w-full flex flex-col items-center gap-5 ${
              chatActive
                ? "opacity-0 -translate-y-12 max-h-0 overflow-hidden pointer-events-none"
                : "opacity-100 translate-y-0 max-h-[28rem]"
            }`}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                Розумний ШІ помічник
              </span>
            </motion.div>

            {/* Title */}
            <TextGenerateEffect
              className="text-4xl sm:text-5xl md:text-6xl tracking-tight font-light text-white text-balance leading-tight"
              words="Знайдіть свою ідеальну подорож"
              duration={titleTextFadeDuration}
              accentClassName="text-accent font-bold"
              accentWords={["ідеальну"]}
            />

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="text-white/50 text-base sm:text-lg max-w-xl leading-relaxed"
            >
              Поставте будь-яке питання про подорожі — наш ШІ помічник
              допоможе знайти відповідь миттєво
            </motion.p>

            {/* Highlight badges */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-wrap justify-center gap-2.5"
            >
              {highlights.map((h) => (
                <div
                  key={h.text}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 border border-white/8 text-white/60 text-xs hover:border-accent/30 hover:text-white/80 transition-colors duration-300"
                >
                  <h.icon className="w-3.5 h-3.5 text-accent" />
                  {h.text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Search Section */}
          <SearchSection onChatToggle={handleChatToggle} />
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CAPABILITIES (below fold, hidden when chat active)           */}
      {/* ============================================================ */}
      {!chatActive && (
        <>
          <section className="py-14 md:py-20 border-t border-white/5">
            <div className="max-w-5xl mx-auto px-4 max-sm:px-3">
              <FadeIn className="text-center mb-10">
                <span className="text-accent text-xs font-semibold uppercase tracking-[0.2em]">
                  Можливості
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mt-2">
                  Що вміє ШІ помічник
                </h2>
              </FadeIn>

              <div className="grid md:grid-cols-3 gap-5">
                {capabilities.map((cap, i) => (
                  <FadeIn key={cap.title} delay={i * 0.12}>
                    <div className="relative p-6 rounded-2xl bg-white/3 border border-white/6 hover:border-accent/30 hover:bg-white/5 group h-full transition-colors duration-300">
                      <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/20 group-hover:border-accent/40 transition-colors duration-300">
                        <cap.icon className="w-5 h-5 text-accent" />
                      </div>
                      <h3 className="text-white font-bold text-base mb-1.5">
                        {cap.title}
                      </h3>
                      <p className="text-white/40 text-sm leading-relaxed">
                        {cap.desc}
                      </p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/*  CTA SECTION                                                  */}
          {/* ============================================================ */}
          <section className="py-14 md:py-20">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <FadeIn>
                <div className="relative p-8 md:p-14 rounded-3xl border border-white/10 overflow-hidden">
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-linear-to-br from-accent/8 via-white/3 to-accent/4" />

                  {/* Decorative glows */}
                  <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent/15 rounded-full blur-[100px] pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent/8 rounded-full blur-[100px] pointer-events-none" />

                  {/* Top border accent */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/10">
                      <MessageCircle className="w-7 h-7 text-accent" />
                    </div>

                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
                      Бажаєте поговорити з людиною?
                    </h2>
                    <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                      Наші менеджери завжди на зв&apos;язку — залиште заявку і отримайте персональну консультацію
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl shadow-lg shadow-accent/25 hover:scale-105 active:scale-95"
                      >
                        <Phone className="w-5 h-5" />
                        Залишити заявку
                      </Link>
                      <Link
                        href="/tour-screener"
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/16 text-white font-semibold rounded-xl border border-white/15 backdrop-blur-sm hover:scale-105 active:scale-95"
                      >
                        Підібрати тур
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
