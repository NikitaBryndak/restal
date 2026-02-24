"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Spotlight } from "@/components/ui/spotlight-new";
import FadeIn from "@/components/ui/fade-in";
import {
  Phone,
  Send,
  MessageCircle,
  MessageSquareMore,
  Loader2,
  CheckCircle2,
  Sparkles,
  Users,
  Headphones,
  Shield,
  Star,
  Briefcase,
  X,
  Award,
  Clock,
  TrendingUp,
  Globe,
  Zap,
} from "lucide-react";
import AiChatInline from "@/components/search/ai-chat-inline";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const dayNames: Record<number, string> = {
  0: "Нд",
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
};

const isWithinWorkingHours = (workingDays?: number[]) => {
  const now = new Date();
  const kyivTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Kyiv" }));
  const hours = kyivTime.getHours();
  const day = kyivTime.getDay();
  if (!workingDays) return false;
  return hours >= 9 && hours < 20 && workingDays.includes(day);
};

const formatWorkingDays = (workingDays?: number[]) => {
  if (!workingDays || workingDays.length === 0) return "";
  const sortedDays = [...workingDays].sort((a, b) => {
    const orderA = a === 0 ? 7 : a;
    const orderB = b === 0 ? 7 : b;
    return orderA - orderB;
  });
  return sortedDays.map(d => dayNames[d]).join(", ") + ", 9:00-20:00";
};

const highlights = [
  { icon: Shield, text: "Ліцензовані агенти" },
  { icon: Headphones, text: "Підтримка 24/7" },
  { icon: Star, text: "10+ років досвіду" },
  { icon: Sparkles, text: "ШІ помічник" },
];

const stats = [
  { icon: Award, value: "10+", label: "Років досвіду" },
  { icon: Users, value: "500+", label: "Задоволених клієнтів" },
  { icon: Globe, value: "50+", label: "Країн світу" },
  { icon: TrendingUp, value: "98%", label: "Позитивних відгуків" },
];

const managers = [
  {
    name: "Олена Бриндак",
    role: "Керівник. Експерт.",
    phone: "+380677668584",
    telegram: "OlenaBryndak",
    description: "10 років присвячені тому, щоб турист отримував не просто тур, а бездоганний сервіс. Моя роль — бути гарантом вашого комфорту та головним ідеологом подорожей, які надихають. Я знаю, що розкіш полягає в деталях і відсутності турбот. Ваша задача лише одна – обрати напрямок. Про все інше потурбуюсь я.",
    isHuman: true,
    workingDays: [1, 2, 3, 4, 5, 6],
    color: "bg-cyan-600",
    hoverGlow: "group-hover:shadow-cyan-500/15",
    initials: "ОБ",
    featured: true,
    specialties: ["VIP", "Преміум", "Лідер"],
  },
  {
    name: "Ірина Смагач",
    role: "Турагент",
    phone: "+380673684260",
    telegram: "Iryna_Smagach",
    description: "Роки практики та тисячі вирішених завдань. Досвідчений агент — це ваша головна страховка від несподіванок. Чи то гаряче літо на узбережжі, чи засніжені гори взимку, підбере напрямок, який відгукнеться саме вам. Окрім пошуку туру можна придбати вигідні авіаквитки та страхування. Вам залишається тільки зібрати валізу.",
    isHuman: true,
    workingDays: [1, 2, 4, 5, 6],
    color: "bg-emerald-600",
    hoverGlow: "group-hover:shadow-emerald-500/15",
    initials: "ІС",
    specialties: ["Авіаквитки", "Страхування"],
  },
  {
    name: "Юлія Свідницька",
    role: "Турагент",
    phone: "+380671525500",
    telegram: "Julia_Svidnitska",
    description: "Знає особливості Таїланду і Занзибару та знайде ідеальне «all inclusive» у Домінікані. Допоможе зорієнтуватися у розкоші Еміратів та розкриє всі секрети відпочинку в Іспанії, яку знає та обожнює. Працює для того, щоб ви не просто побачили нову країну, а відчули її ритм, не відволікаючись на організаційні дрібниці.",
    isHuman: true,
    workingDays: [1, 2, 3, 4, 0],
    color: "bg-purple-600",
    hoverGlow: "group-hover:shadow-purple-500/15",
    initials: "ЮС",
    specialties: ["Екзотика", "All Inclusive"],
  },
  {
    name: "Юлія Левадна",
    role: "Турагент",
    phone: "+380688828800",
    telegram: "Yuliia_Levadna",
    description: "Спеціалізується на популярних напрямках, тому проконсультує, який готель Єгипту справді оновив номери, а де в Туреччині найкраща анімація для дітей. Також допомагає закохатися в автобусні подорожі, зробивши ваш шлях за кордон легким та організованим. Дбає про ваші враження, як про власні!",
    isHuman: true,
    workingDays: [3, 4, 5, 6, 0],
    color: "bg-amber-600",
    hoverGlow: "group-hover:shadow-amber-500/15",
    initials: "ЮЛ",
    specialties: ["Сімейні", "Автобусні тури"],
  },
  {
    name: "ШІ Менеджер",
    role: "Віртуальний асистент",
    phone: "",
    telegram: "OlenaBryndak",
    description: "Не п'є, не їсть, тільки допомагає вам знайти ідеальний тур за лічені секунди!",
    isHuman: false,
    alwaysOnline: true,
    color: "bg-accent",
    hoverGlow: "group-hover:shadow-accent/20",
    initials: "ШІ",
    specialties: ["24/7", "Миттєво"],
  },
  {
    name: "Ви!",
    role: "Вакансія",
    phone: "+380677668584",
    telegram: "OlenaBryndak",
    description: "Амбіційний та молодий турагент, який віртуозно володіє сучасними трендами туризму та знає, що таке сервіс нового покоління. Це вакантне місце чекає на того, хто не просто продає тури, а створює стиль життя, сповнений яскравих вражень.",
    isHuman: false,
    isVacancy: true,
    color: "bg-white/20",
    hoverGlow: "",
    initials: "?",
    specialties: [],
  },
];

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function ManagersContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [, forceUpdate] = useState({});
  const [consultPhone, setConsultPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [exitingChat, setExitingChat] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => {
      forceUpdate({});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getOnlineStatus = (manager: typeof managers[0]) => {
    if ('alwaysOnline' in manager && manager.alwaysOnline) return true;
    if ('isVacancy' in manager && manager.isVacancy) return false;
    if (!isMounted) return false;
    return manager.isHuman && 'workingDays' in manager && isWithinWorkingHours(manager.workingDays);
  };

  const handleConsultationClick = (managerName: string) => {
    setSelectedManager(managerName);
    setConsultPhone("");
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsModalOpen(true);
  };

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultPhone.trim()) {
      setSubmitError("Введіть номер телефону");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "manager",
          phone: consultPhone,
          managerName: selectedManager,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message || "Помилка надсилання");
        return;
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
      }, 2500);
    } catch {
      setSubmitError("Помилка з'єднання з сервером");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black">
      {/* ============================================================ */}
      {/*  HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="relative pt-28 pb-16 sm:pt-24 max-sm:pt-20 overflow-hidden">
        {/* Spotlight background effect */}
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(197, 100%, 50%, 0.12) 0, hsla(197, 100%, 45%, 0.06) 50%, transparent 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 60%, 0.1) 0, hsla(197, 100%, 45%, 0.04) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 50%, 0.06) 0, transparent 80%)"
          translateY={-200}
          duration={9}
        />

        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 max-sm:px-3">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium backdrop-blur-sm">
              <Users className="w-4 h-4" />
              Професійна команда експертів
            </span>
          </motion.div>

          {/* Title */}
          <div className="text-center">
            <TextGenerateEffect
              words="Наша команда"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light"
              accentWords={["команда"]}
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
            Досвідчені турагенти, які знають усі секрети ідеальної відпустки.
            Оберіть свого менеджера — і ми потурбуємось про все.
          </motion.p>

          {/* Highlight badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            {highlights.map((h) => (
              <div
                key={h.text}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/8 text-white/70 text-sm hover:border-accent/30 hover:text-white/90 transition-colors duration-300"
              >
                <h.icon className="w-4 h-4 text-accent" />
                {h.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STATS STRIP                                                  */}
      {/* ============================================================ */}
      <section className="border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 max-sm:px-3">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
            {stats.map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="py-10 md:py-14 text-center group">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/20 group-hover:border-accent/40 transition-colors duration-300">
                    <stat.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/40 text-xs sm:text-sm">{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TEAM GRID                                                    */}
      {/* ============================================================ */}
      <section id="managers" className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 max-sm:px-3">
          <FadeIn className="text-center mb-10 md:mb-14">
            <span className="text-accent text-xs font-semibold uppercase tracking-[0.2em]">
              Менеджери
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-2">
              Оберіть свого експерта
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {managers.map((manager, index) => {
              const isOnline = getOnlineStatus(manager);
              const isAI = 'alwaysOnline' in manager && manager.alwaysOnline;
              const isVacancy = 'isVacancy' in manager && manager.isVacancy;
              const isFeatured = 'featured' in manager && manager.featured;

              return (
                <FadeIn
                  key={index}
                  delay={index * 0.08}
                  className={isFeatured ? 'md:col-span-2 lg:col-span-2' : ''}
                >
                  <div
                    className={`relative rounded-2xl group h-full flex transition-all duration-300 shadow-lg shadow-black/20 ${manager.hoverGlow}
                      ${isVacancy
                        ? 'border-2 border-dashed border-white/10 hover:border-accent/30 bg-white/1 hover:bg-white/3'
                        : isAI
                          ? 'border border-accent/20 hover:border-accent/40 bg-linear-to-br from-accent/4 via-white/2 to-accent/6 hover:from-accent/7 hover:via-white/3 hover:to-accent/9'
                          : 'border border-white/6 hover:border-accent/30 bg-white/3 hover:bg-white/5'
                      }
                    `}
                  >
                    {/* Top accent gradient line */}
                    {!isVacancy && (
                      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    )}

                    {/* AI card shimmer effect */}
                    {isAI && (
                      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/10 rounded-full blur-[60px] animate-pulse" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent/8 rounded-full blur-[50px] animate-pulse [animation-delay:1s]" />
                      </div>
                    )}

                    <div className={`relative p-6 ${isFeatured ? 'md:p-8' : ''} flex ${isFeatured ? 'md:flex-row flex-col gap-6 md:gap-8' : 'flex-col gap-5'} w-full`}>

                      {/* Online indicator dot - top right corner */}
                      <div className={`absolute top-5 right-5 w-2.5 h-2.5 rounded-full transition-all ${isOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-white/20'}`}>
                        {isOnline && (
                          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40" />
                        )}
                      </div>

                      {/* Left side for featured / header for regular */}
                      <div className={`${isFeatured ? 'md:w-1/3 flex flex-col items-center md:items-start gap-3 shrink-0' : 'flex items-start gap-4'}`}>
                        {/* Avatar */}
                        <div className={`${isFeatured ? 'w-20 h-20 text-2xl rounded-3xl' : 'w-14 h-14 text-lg rounded-2xl'} ${manager.color} flex items-center justify-center text-white font-bold shrink-0 group-hover:scale-105 transition-transform duration-300 ${isAI ? 'ring-2 ring-accent/30 ring-offset-2 ring-offset-black' : ''}`}>
                          {manager.initials}
                        </div>

                        <div className={`${isFeatured ? 'text-center md:text-left' : ''} flex-1 min-w-0`}>
                          <h3 className={`${isFeatured ? 'text-xl md:text-2xl' : 'text-lg'} font-bold text-white truncate`}>{manager.name}</h3>
                          <p className="text-sm text-accent font-medium mt-0.5">{manager.role}</p>
                          <p className={`text-xs mt-1 flex items-center gap-1.5 ${isFeatured ? 'justify-center md:justify-start' : ''} ${isOnline ? 'text-green-500/80' : 'text-white/30'}`}>
                            {isOnline && <Clock className="w-3 h-3" />}
                            {isOnline ? 'Доступний зараз' : manager.isHuman && 'workingDays' in manager ? formatWorkingDays(manager.workingDays) : isVacancy ? 'Відкрита позиція' : 'Завжди на зв\'язку'}
                          </p>

                          {/* Specialty tags */}
                          {'specialties' in manager && manager.specialties && manager.specialties.length > 0 && (
                            <div className={`flex flex-wrap gap-1.5 mt-3 ${isFeatured ? 'justify-center md:justify-start' : ''}`}>
                              {manager.specialties.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-accent/10 text-accent/80 border border-accent/15"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side for featured / body for regular */}
                      <div className={`${isFeatured ? 'md:flex-1 flex flex-col gap-5' : 'contents'}`}>
                        {/* Description */}
                        <p className={`text-white/50 text-sm leading-relaxed ${isFeatured ? '' : 'grow'}`}>
                          {manager.description}
                        </p>

                        {/* Primary CTA Button */}
                        {!isVacancy ? (
                          <button
                            onClick={() => {
                              if (isAI) {
                                setChatOpen(true);
                              } else {
                                handleConsultationClick(manager.name);
                              }
                            }}
                            className={`w-full px-5 py-3.5 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold hover:scale-[1.02] active:scale-[0.98]
                              ${isAI
                                ? 'bg-linear-to-r from-accent to-cyan-400 hover:from-accent/90 hover:to-cyan-400/90 shadow-lg shadow-accent/25 hover:shadow-accent/35'
                                : 'bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 hover:shadow-accent/30'
                              }
                            `}
                          >
                            {isAI ? <Zap className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                            <span>{isAI ? 'Запитати ШІ' : 'Замовити консультацію'}</span>
                          </button>
                        ) : (
                          <Link
                            href={`https://t.me/${manager.telegram}`}
                            className="w-full px-5 py-3.5 bg-white/8 hover:bg-white/12 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold border border-dashed border-white/15 hover:border-accent/30 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Briefcase className="w-5 h-5 text-accent" />
                            <span>Надіслати резюме</span>
                          </Link>
                        )}

                        {/* Contact Links */}
                        {manager.phone && manager.telegram && !isVacancy && !isAI && (
                          <div className="pt-4 border-t border-white/6 flex items-center justify-center gap-6">
                            <Link
                              href={`tel:${manager.phone}`}
                              className="flex items-center gap-2 text-white/40 hover:text-accent transition-colors duration-200"
                              title="Зателефонувати"
                            >
                              <Phone className="w-4 h-4" />
                              <span className="text-xs font-medium">Телефон</span>
                            </Link>
                            <div className="w-px h-4 bg-white/8" />
                            <Link
                              href={`viber://chat?number=${manager.phone}`}
                              className="flex items-center gap-2 text-white/40 hover:text-accent transition-colors duration-200"
                              title="Call via Viber"
                            >
                              <MessageSquareMore className="w-4 h-4" />
                              <span className="text-xs font-medium">Viber</span>
                            </Link>
                            <div className="w-px h-4 bg-white/8" />
                            <Link
                              href={`https://t.me/${manager.telegram}`}
                              className="flex items-center gap-2 text-white/40 hover:text-accent transition-colors duration-200"
                              title="Message on Telegram"
                            >
                              <Send className="w-4 h-4" />
                              <span className="text-xs font-medium">Telegram</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
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
              {/* Gradient background fill */}
              <div className="absolute inset-0 bg-linear-to-br from-accent/8 via-white/3 to-accent/4" />

              {/* Decorative glows */}
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent/15 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent/8 rounded-full blur-[100px] pointer-events-none" />

              {/* Top border accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/10">
                  <Phone className="w-7 h-7 text-accent" />
                </div>

                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
                  Не знаєте, кого обрати?
                </h2>
                <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                  Залиште заявку — і ми самі підберемо для вас найкращого менеджера під ваш запит
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl shadow-lg shadow-accent/25 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Phone className="w-5 h-5" />
                    Залишити заявку
                  </Link>
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/16 text-white font-semibold rounded-xl border border-white/15 backdrop-blur-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    ШІ помічник
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CONSULTATION MODAL                                           */}
      {/* ============================================================ */}
      <AnimatePresence>
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative w-full max-w-lg bg-white/5 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl"
          >
            {/* Modal glow accent */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/15 rounded-full blur-[60px] pointer-events-none" />

            <button
              onClick={() => setIsModalOpen(false)}
              aria-label="Закрити"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 space-y-6">
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Замовити консультацію
                </h3>
                {selectedManager && (
                  <p className="text-accent text-sm font-medium">
                    з {selectedManager}
                  </p>
                )}
                <p className="text-white/50 text-sm">
                  Залиште свій номер і ми вам передзвонимо
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleConsultationSubmit}>
                <input
                  type="tel"
                  placeholder="Ваш номер телефону"
                  value={consultPhone}
                  onChange={(e) => setConsultPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />

                {submitError && (
                  <p className="text-red-400 text-sm text-center">{submitError}</p>
                )}

                {submitSuccess && (
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Запит надіслано! Ми зв&apos;яжемося з вами.</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all font-medium"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3.5 rounded-xl bg-accent text-white hover:bg-accent/90 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Підтвердити"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/*  AI CHAT                                                      */}
      {/* ============================================================ */}
      {chatOpen && (
        <div className={`transition-opacity duration-400 ${exitingChat ? "opacity-0" : "opacity-100"}`}>
          <AiChatInline
            onClose={() => {
              setExitingChat(true);
              setTimeout(() => {
                setChatOpen(false);
                setExitingChat(false);
              }, 400);
            }}
          />
        </div>
      )}
    </main>
  );
}
