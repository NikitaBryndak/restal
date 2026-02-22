"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Headphones,
  Globe,
  Search,
  Plane,
  Star,
  Phone,
  CheckCircle,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { motion, useInView, useSpring, useTransform } from "motion/react";

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (isInView) spring.set(value);
  }, [isInView, spring, value]);

  return (
    <span ref={ref} className="inline-flex items-baseline gap-0.5">
      <motion.span className="text-4xl md:text-5xl font-bold text-accent tabular-nums">
        {display}
      </motion.span>
      {suffix && <span className="text-accent text-xl font-light">{suffix}</span>}
    </span>
  );
}

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
/*  DATA                                                               */
/* ================================================================== */
const destinations = [
  { name: "Туреччина", image: "/countryImages/Turkey.jpg", tag: "Популярне", tagColor: "bg-red-500" },
  { name: "Єгипет", image: "/countryImages/Egypt.jpg", tag: "Гарячі тури", tagColor: "bg-orange-500" },
  { name: "Греція", image: "/countryImages/Greece.jpg", tag: "Топ сезону", tagColor: "bg-cyan-500" },
  { name: "Мальдіви", image: "/countryImages/Maldives.jpg", tag: "Преміум", tagColor: "bg-purple-500" },
  { name: "Іспанія", image: "/countryImages/Spain.jpg", tag: "Європа", tagColor: "bg-blue-500" },
  { name: "Таїланд", image: "/countryImages/Thailand.jpg", tag: "Екзотика", tagColor: "bg-emerald-500" },
  { name: "ОАЕ", image: "/countryImages/UAE.jpg", tag: "Luxury", tagColor: "bg-amber-500" },
  { name: "Хорватія", image: "/countryImages/Croatia.jpg", tag: "Відкрий нове", tagColor: "bg-teal-500" },
];

const features = [
  {
    icon: Shield,
    title: "Гарантія безпеки",
    desc: "Повний захист вашої подорожі та фінансова безпека кожної угоди",
  },
  {
    icon: Headphones,
    title: "Підтримка 24/7",
    desc: "Наша команда на зв'язку цілодобово — до, під час та після відпочинку",
  },
  {
    icon: Globe,
    title: "Перевірені напрямки",
    desc: "Ми особисто перевіряємо готелі та маршрути, щоб ви отримали найкраще",
  },
  {
    icon: Sparkles,
    title: "ШІ рекомендації",
    desc: "Розумний підбір туру за вашими побажаннями завдяки технологіям ШІ",
  },
];

const steps = [
  {
    icon: Search,
    title: "Розкажіть про мрію",
    desc: "Опишіть ваші побажання — країна, дати, бюджет, кількість людей",
  },
  {
    icon: Globe,
    title: "Ми підберемо найкраще",
    desc: "Наші експерти знайдуть ідеальний варіант серед тисяч пропозицій",
  },
  {
    icon: Plane,
    title: "Вирушайте у подорож",
    desc: "Ми оформимо всі документи — вам залишиться лише зібрати валізу",
  },
];

const reviews = [
  {
    text: "Неймовірний сервіс! Все було організовано ідеально від початку до кінця. Обов'язково повернусь за наступним туром!",
    name: "Олена К.",
    location: "Туреччина",
    initials: "О",
    color: "bg-cyan-600",
  },
  {
    text: "Дуже задоволений підбором готелю та екскурсіями. Менеджер врахував усі побажання. Рекомендую!",
    name: "Андрій М.",
    location: "Єгипет",
    initials: "А",
    color: "bg-emerald-600",
  },
  {
    text: "Подорож мрії стала реальністю! Дякую за професійний підхід та увагу до деталей.",
    name: "Марія С.",
    location: "Мальдіви",
    initials: "М",
    color: "bg-purple-600",
  },
];

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
type HomeContentProps = {
  tripCount: number;
};

export default function HomeContent({ tripCount }: HomeContentProps) {
  return (
    <main className="relative overflow-x-hidden bg-black z-10">

      {/* Floating contact button */}
      <Link
        href="/managers"
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-5 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-full shadow-xl shadow-accent/30 transition-all hover:scale-105 active:scale-95 group"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Зв&apos;язатися з менеджером</span>
      </Link>
      {/* ============================================================ */}
      {/*  HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/countryImages/Greece.jpg"
            alt="Подорож мрії"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
            quality={90}
          />
          {/* Dark overlay gradient */}
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center gap-6 pt-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 border border-accent/30 text-accent text-sm font-medium backdrop-blur-sm">
              <Star className="w-4 h-4 fill-accent" />
              Турагенція №1 в Україні
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight"
          >
            Перетворіть мрію
            <br />
            <span className="text-accent">на подорож</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-white/70 text-base sm:text-lg md:text-xl max-w-xl leading-relaxed"
          >
            Експертний підбір турів під ваші побажання.
            <br />
            Від ідеї до посадки в літак — ми все візьмемо на себе.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-4 mt-2"
          >
            <Link
              href="/tour-screener"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/25"
            >
              Підібрати тур
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-sm border border-white/20 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              ШІ помічник
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex flex-wrap justify-center gap-6 mt-6 text-white/60 text-sm"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-accent" />
              Ліцензовано
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              4.9 рейтинг
            </span>
            <span className="flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-accent" />
              Підтримка 24/7
            </span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/*  STATS SECTION                                                */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
            {[
              { value: tripCount + 7860, suffix: "+", label: "ПОДОРОЖЕЙ ОРГАНІЗОВАНО" },
              { value: 24, suffix: "+", label: "КРАЇНИ" },
              { value: 4.9, suffix: "", label: "РЕЙТИНГ", isDecimal: true },
              { value: 24, suffix: "/7", label: "ПІДТРИМКА", isStatic: true },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="flex flex-col items-center gap-2">
                  {stat.isStatic ? (
                    <span className="text-4xl md:text-5xl font-bold text-white">
                      24<span className="text-accent">/7</span>
                    </span>
                  ) : stat.isDecimal ? (
                    <span className="text-4xl md:text-5xl font-bold text-accent">4.9</span>
                  ) : (
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  )}
                  <span className="text-xs md:text-sm text-white/50 uppercase tracking-widest font-medium">
                    {stat.label}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  POPULAR DESTINATIONS                                         */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4">
          <FadeIn className="text-center mb-12 md:mb-16">
            <span className="text-accent text-sm font-semibold uppercase tracking-widest">
              Напрямки
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-3">
              Популярні напрямки
            </h2>
            <p className="text-white/50 mt-4 max-w-lg mx-auto text-base md:text-lg">
              Обирайте з найкращих курортів світу — ми підберемо ідеальний варіант саме для вас
            </p>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {destinations.map((dest, i) => (
              <FadeIn key={dest.name} delay={i * 0.07}>
                <Link
                  href="/tour-screener"
                  className="group relative aspect-3/4 rounded-2xl overflow-hidden block cursor-pointer"
                >
                  <Image
                    src={dest.image}
                    alt={dest.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Tag */}
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold text-white rounded-md ${dest.tagColor}`}
                  >
                    {dest.tag}
                  </span>

                  {/* Name */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-1.5 text-white/70 text-xs mb-1">
                      <MapPin className="w-3 h-3" />
                      Напрямок
                    </div>
                    <h3 className="text-white text-lg md:text-xl font-bold">
                      {dest.name}
                    </h3>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="flex justify-center mt-10">
            <Link
              href="/tour-screener"
              className="inline-flex items-center gap-2 px-6 py-3 border border-accent/40 text-accent rounded-xl hover:bg-accent/10 transition-all hover:scale-105 active:scale-95 font-medium"
            >
              Переглянути всі напрямки
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  WHY CHOOSE US                                                */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 bg-white/2">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn className="text-center mb-12 md:mb-16">
            <span className="text-accent text-sm font-semibold uppercase tracking-widest">
              Переваги
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-3">
              Чому обирають нас
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1}>
                <div className="p-6 rounded-2xl bg-white/4 border border-white/6 hover:border-accent/30 transition-all hover:bg-white/6 group h-full">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                    <f.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                 */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4">
          <FadeIn className="text-center mb-12 md:mb-16">
            <span className="text-accent text-sm font-semibold uppercase tracking-widest">
              Процес
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-3">
              Як це працює
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, i) => (
              <FadeIn key={step.title} delay={i * 0.15} className="text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-white font-bold text-xl">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  REVIEWS                                                      */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 bg-white/2">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn className="text-center mb-12 md:mb-16">
            <span className="text-accent text-sm font-semibold uppercase tracking-widest">
              Відгуки
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-3">
              Що кажуть наші клієнти
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-5">
            {reviews.map((r, i) => (
              <FadeIn key={r.name} delay={i * 0.12}>
                <div className="p-6 rounded-2xl bg-white/4 border border-white/6 hover:border-accent/20 transition-all h-full flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-white/80 text-sm leading-relaxed flex-1 mb-6">
                    &ldquo;{r.text}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${r.color} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {r.initials}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{r.name}</div>
                      <div className="flex items-center gap-1 text-white/40 text-xs">
                        <MapPin className="w-3 h-3" />
                        {r.location}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FINAL CTA                                                    */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Готові до подорожі?
            </h2>
            <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto mb-8">
              Залиште заявку — і наш менеджер зв&apos;яжеться з вами протягом
              15 хвилин з найкращими пропозиціями
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/25"
              >
                <Phone className="w-5 h-5" />
                Залишити заявку
              </Link>
              <Link
                href="/tour-screener"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-sm border border-white/20 transition-all hover:scale-105 active:scale-95"
              >
                Підібрати тур самостійно
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
