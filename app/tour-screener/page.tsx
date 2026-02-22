"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormInput from "@/components/ui/form-input";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Spotlight } from "@/components/ui/spotlight-new";
import {
  X,
  Send,
  Loader2,
  CheckCircle2,
  Globe,
  Search,
  Plane,
  Shield,
  Headphones,
  Sparkles,
  MapPin,
  Phone,
  ArrowRight,
  Star,
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
const steps = [
  {
    icon: Search,
    num: "01",
    title: "Оберіть напрямок",
    desc: "Вкажіть країну, дати, бюджет та кількість мандрівників",
  },
  {
    icon: Globe,
    num: "02",
    title: "Порівняйте варіанти",
    desc: "Перегляньте готелі, ціни та умови — все в одному вікні",
  },
  {
    icon: Plane,
    num: "03",
    title: "Замовте в 1 клік",
    desc: "Натисніть «Замовити» — ми оформимо все за вас",
  },
];

const highlights = [
  { icon: Shield, text: "Гарантія безпеки" },
  { icon: Headphones, text: "Підтримка 24/7" },
  { icon: Star, text: "Рейтинг 4.9" },
  { icon: Sparkles, text: "Кращі ціни" },
];

export default function TourScreenerPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(800);

  // Booking modal state
  const [showBooking, setShowBooking] = useState(false);
  const [tourCode, setTourCode] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setMessage("");
    setError(null);
    setSuccess(false);
  }, []);

  const closeModal = useCallback(() => {
    setShowBooking(false);
    resetForm();
  }, [resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Введіть номер телефону");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const tourInfo = tourCode ? `[Тур: ${tourCode}]` : "";
      const hotelInfo = hotelName ? `[Готель: ${hotelName}]` : "";
      const fullMessage =
        [tourInfo, hotelInfo, message].filter(Boolean).join(" ") || tourInfo;

      const res = await fetch("/api/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "tour",
          firstName,
          lastName,
          phone,
          message: fullMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Помилка надсилання");
        return;
      }
      setSuccess(true);
      setTimeout(() => closeModal(), 3000);
    } catch {
      setError("Помилка з'єднання з сервером");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data) return;

      if (
        event.data.type === "otpusk-resize" &&
        typeof event.data.height === "number"
      ) {
        setIframeHeight(event.data.height);
      }

      if (event.data.type === "otpusk-order") {
        setTourCode(event.data.tourCode || "");
        setHotelName(event.data.hotelName || "");
        resetForm();
        setShowBooking(true);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [resetForm]);

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
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium backdrop-blur-sm">
              <Globe className="w-4 h-4" />
              Понад 100+ напрямків по всьому світу
            </span>
          </motion.div>

          {/* Title */}
          <TextGenerateEffect
            words="Підбір туру"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light"
            accentWords={["туру"]}
            accentClassName="text-accent font-bold"
          />

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-white/50 text-base sm:text-lg md:text-xl mt-5 max-w-2xl leading-relaxed"
          >
            Знайдіть ідеальний тур для вашої відпустки. Оберіть країну, дати та
            параметри — ми покажемо найкращі пропозиції.
          </motion.p>

          {/* Highlight badges row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap gap-3 mt-8"
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
      {/*  HOW IT WORKS (steps)                                        */}
      {/* ============================================================ */}
      <section className="py-14 md:py-20 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 max-sm:px-3">
          <FadeIn className="text-center mb-10">
            <span className="text-accent text-xs font-semibold uppercase tracking-[0.2em]">
              Як це працює
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-2">
              Три простих кроки
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-5">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.12}>
                <div className="relative p-6 rounded-2xl bg-white/3 border border-white/6 hover:border-accent/30 hover:bg-white/5 group h-full transition-colors duration-300">
                  {/* Step number watermark */}
                  <span className="absolute top-4 right-5 text-5xl font-black text-white/3 select-none pointer-events-none">
                    {step.num}
                  </span>

                  <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/20 group-hover:border-accent/40 transition-colors duration-300">
                    <step.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  WIDGET SECTION                                               */}
      {/* ============================================================ */}
      <section className="relative py-10 md:py-14 px-4 max-sm:px-3">
        {/* Glow behind widget */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/4 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <FadeIn>
            {/* Widget label */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-white/40 text-sm font-medium tracking-wide uppercase">Пошук турів</span>
            </div>

            <div className="relative bg-white/3 border border-white/10 rounded-3xl shadow-2xl shadow-accent/5" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>
              {/* Decorative top gradient bar */}
              <div className="h-px w-full bg-linear-to-r from-transparent via-accent/50 to-transparent" />

              <div style={{ WebkitOverflowScrolling: 'touch', overflow: 'auto' }}>
                <iframe
                  ref={iframeRef}
                  src="/otpusk-widget.html"
                  title="Пошук турів"
                  style={{
                    width: "100%",
                    height: `${Math.max(iframeHeight, 1200)}px`,
                    border: "none",
                    display: "block",
                    WebkitTransform: 'translateZ(0)',
                  }}
                  allow="clipboard-write"
                  loading="eager"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HELP CTA SECTION                                             */}
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
                  <MapPin className="w-7 h-7 text-accent" />
                </div>

                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
                  Потрібна допомога з вибором?
                </h2>
                <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                  Наші експерти підберуть ідеальний тур за вашими побажаннями — безкоштовно та без зобов&apos;язань
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
                    href="/search"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/16 text-white font-semibold rounded-xl border border-white/15 backdrop-blur-sm hover:scale-105 active:scale-95"
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
      {/*  BOOKING MODAL                                                */}
      {/* ============================================================ */}
      {showBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
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
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl sm:text-2xl font-light text-white mb-2 text-center relative z-10">
              Замовити тур
            </h3>

            {(tourCode || hotelName) && (
              <div className="text-center mb-6 space-y-1 relative z-10">
                {hotelName && (
                  <p className="text-accent font-medium">{hotelName}</p>
                )}
                {tourCode && (
                  <p className="text-white/50 text-sm">Код туру: {tourCode}</p>
                )}
              </div>
            )}

            <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bookFirstName" className="text-white/70 text-sm">
                    Ім&apos;я
                  </Label>
                  <Input
                    id="bookFirstName"
                    placeholder="Іван"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-black/40 border-white/10 focus:border-accent/50 h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookLastName" className="text-white/70 text-sm">
                    Прізвище
                  </Label>
                  <Input
                    id="bookLastName"
                    placeholder="Петренко"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-black/40 border-white/10 focus:border-accent/50 h-12 rounded-xl"
                  />
                </div>
              </div>

              <FormInput
                labelText="Телефон"
                placeholder="+38 (XXX) XXX-XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                containerClassName="space-y-2"
                className="bg-black/40 border-white/10 focus:border-accent/50 h-12 rounded-xl"
              />

              <div className="space-y-2">
                <Label htmlFor="bookMessage" className="text-white/70 text-sm">
                  Побажання
                </Label>
                <textarea
                  id="bookMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm ring-offset-background placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50 focus:border-accent/50 resize-none"
                  placeholder="Категорія готелю, харчування, побажання..."
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              {success && (
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Заявку надіслано! Ми зв&apos;яжемося з вами найближчим
                    часом.
                  </span>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || success}
                className="w-full bg-accent hover:bg-accent/90 text-white h-12 text-base font-medium rounded-xl mt-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Надсилання...
                  </>
                ) : (
                  <>
                    Замовити тур
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </main>
  );
}
