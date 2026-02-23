"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Spotlight } from "@/components/ui/spotlight-new";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormInput from "@/components/ui/form-input";
import FadeIn from "@/components/ui/fade-in";
import {
   Mail,
   Phone,
   MapPin,
   Send,
   Loader2,
   CheckCircle2,
   Headphones,
   Shield,
   MessageCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const contactChannels = [
   {
      icon: Mail,
      label: "Пошта",
      value: "restal.inform@gmail.com",
      href: "mailto:restal.inform@gmail.com",
   },
   {
      icon: Phone,
      label: "Телефон / Viber",
      value: "+38 (068) 7772550",
      href: "viber://chat?number=+380687772550",
   },
   {
      icon: Send,
      label: "Telegram",
      value: "@RestAL_travel",
      href: "https://t.me/RestAL_travel",
      external: true,
   },
];

const offices = [
   {
      name: "JoinUp Турагенція",
      address: "ТЦ Монблан, пров. С.Бандери, 2/1а, Хмельницький",
      color: "text-orange-400",
      href: "https://maps.app.goo.gl/Vf5dhgpD4z8Xec7y7",
   },
   {
      name: "Anex Турагенція",
      address: "ТЦ Агора, вул. Ст.Шосе, 2/1А, Хмельницький",
      color: "text-red-400",
      href: "https://maps.app.goo.gl/scqauCGqKePULwXTA",
   },
];

const trustBadges = [
   { icon: Shield, text: "Гарантія безпеки" },
   { icon: Headphones, text: "Підтримка 24/7" },
   { icon: MessageCircle, text: "Швидка відповідь" },
];

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function ContactPage() {
   const [firstName, setFirstName] = useState("");
   const [lastName, setLastName] = useState("");
   const [phone, setPhone] = useState("");
   const [message, setMessage] = useState("");
   const [submitting, setSubmitting] = useState(false);
   const [success, setSuccess] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!phone.trim()) {
         setError("Введіть номер телефону");
         return;
      }
      setSubmitting(true);
      setError(null);
      try {
         const res = await fetch("/api/contact-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               source: "contact",
               firstName,
               lastName,
               phone,
               message,
            }),
         });
         const data = await res.json();
         if (!res.ok) {
            setError(data.message || "Помилка надсилання");
            return;
         }
         setSuccess(true);
         setFirstName("");
         setLastName("");
         setPhone("");
         setMessage("");
         setTimeout(() => setSuccess(false), 5000);
      } catch {
         setError("Помилка з'єднання з сервером");
      } finally {
         setSubmitting(false);
      }
   };

   return (
      <main className="relative min-h-screen w-full overflow-x-hidden bg-black">
         {/* ========================================================= */}
         {/*  HERO + FORM SECTION                                       */}
         {/* ========================================================= */}
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
                  className="mb-5"
               >
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium backdrop-blur-sm">
                     <MessageCircle className="w-4 h-4" />
                     Ми на зв&apos;язку
                  </span>
               </motion.div>

               {/* Title */}
               <TextGenerateEffect
                  words="Зв'яжіться з нами"
                  className="text-4xl sm:text-5xl md:text-6xl font-light"
                  accentWords={["нами"]}
                  accentClassName="text-accent font-bold"
               />

               {/* Subtitle */}
               <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  className="text-white/50 text-base sm:text-lg mt-4 max-w-lg leading-relaxed"
               >
                  Маєте питання щодо подорожі? Ми допоможемо спланувати ідеальну відпустку.
               </motion.p>

               {/* Trust badges */}
               <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="flex flex-wrap gap-3 mt-6"
               >
                  {trustBadges.map((b) => (
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

         {/* ========================================================= */}
         {/*  CONTACT CHANNELS + FORM                                   */}
         {/* ========================================================= */}
         <section className="relative py-10 md:py-14">
            {/* Section glow */}
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-accent/4 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto px-4 max-sm:px-3 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-start">

               {/* Left — Contact info (2 cols) */}
               <div className="lg:col-span-2 space-y-6">
                  {/* Contact channels */}
                  <FadeIn>
                     <div className="space-y-1">
                        {contactChannels.map((ch, i) => (
                           <FadeIn key={ch.label} delay={i * 0.08}>
                              <Link
                                 href={ch.href}
                                 {...(ch.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                 className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 transition-all duration-300 group"
                              >
                                 <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors duration-300">
                                    <ch.icon className="w-5 h-5 text-accent" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-white/35 text-xs uppercase tracking-wider font-medium">{ch.label}</p>
                                    <p className="text-white/90 text-sm font-medium truncate">{ch.value}</p>
                                 </div>
                              </Link>
                           </FadeIn>
                        ))}
                     </div>
                  </FadeIn>

                  {/* Divider */}
                  <div className="h-px bg-linear-to-r from-white/6 via-white/10 to-transparent" />

                  {/* Partner offices */}
                  <FadeIn delay={0.3}>
                     <div>
                        <div className="flex items-center gap-2 mb-3 px-4">
                           <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                           <span className="text-white/35 text-xs font-semibold uppercase tracking-[0.15em]">
                              Партнери-Офіси
                           </span>
                        </div>
                        <div className="space-y-1">
                           {offices.map((office) => (
                              <Link
                                 key={office.name}
                                 href={office.href}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-300 group"
                              >
                                 <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors duration-300">
                                    <MapPin className="w-4 h-4 text-accent" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className={`text-sm font-semibold ${office.color}`}>{office.name}</p>
                                    <p className="text-white/35 text-xs leading-snug truncate">{office.address}</p>
                                 </div>
                              </Link>
                           ))}
                        </div>
                     </div>
                  </FadeIn>
               </div>

               {/* Right — Form (3 cols) */}
               <FadeIn delay={0.15} className="lg:col-span-3">
                  <div className="relative p-6 sm:p-8 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm">
                     {/* Gradient background fill */}
                     <div className="absolute inset-0 bg-linear-to-br from-white/3 via-white/1.5 to-accent/2.5" />

                     {/* Decorative top gradient bar */}
                     <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/25 to-transparent" />

                     {/* Decorative glows */}
                     <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent/8 rounded-full blur-[80px] pointer-events-none" />
                     <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-accent/5 rounded-full blur-[60px] pointer-events-none" />

                     <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                           <Send className="w-5 h-5 text-accent" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-1 text-center">
                           Індивідуальний підбір туру
                        </h3>
                        <p className="text-white/40 text-sm text-center mb-6">
                           Залиште заявку — ми зв&apos;яжемося найближчим часом
                        </p>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <Label htmlFor="firstName" className="text-white/60 text-sm">Ім&apos;я</Label>
                                 <Input
                                    id="firstName"
                                    placeholder="Іван"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="bg-white/5 border-white/8 focus:border-accent/40 h-11 rounded-xl placeholder:text-white/25"
                                 />
                              </div>
                              <div className="space-y-1.5">
                                 <Label htmlFor="lastName" className="text-white/60 text-sm">Прізвище</Label>
                                 <Input
                                    id="lastName"
                                    placeholder="Петренко"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="bg-white/5 border-white/8 focus:border-accent/40 h-11 rounded-xl placeholder:text-white/25"
                                 />
                              </div>
                           </div>

                           <FormInput
                              labelText="Телефон"
                              placeholder="+38 (XXX) XXX-XXXX"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              containerClassName="space-y-1.5"
                              className="bg-white/5 border-white/8 focus:border-accent/40 h-11 rounded-xl placeholder:text-white/25"
                           />

                           <div className="space-y-1.5">
                              <Label htmlFor="message" className="text-white/60 text-sm">Повідомлення</Label>
                              <textarea
                                 id="message"
                                 value={message}
                                 onChange={(e) => setMessage(e.target.value)}
                                 className="flex min-h-[100px] w-full rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm ring-offset-background placeholder:text-white/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50 focus:border-accent/40 resize-none"
                                 placeholder="Розкажіть про ваші плани подорожі..."
                              />
                           </div>

                           {error && (
                              <p className="text-red-400 text-sm text-center">{error}</p>
                           )}

                           {success && (
                              <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                                 <CheckCircle2 className="w-4 h-4" />
                                 <span>Надіслано! Ми зв&apos;яжемося з вами найближчим часом.</span>
                              </div>
                           )}

                           <Button
                              type="submit"
                              disabled={submitting}
                              className="w-full bg-accent hover:bg-accent/90 text-white h-11 text-sm font-semibold rounded-xl disabled:opacity-50 shadow-lg shadow-accent/25 hover:shadow-accent/35 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                           >
                              {submitting ? (
                                 <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Надсилання...
                                 </>
                              ) : (
                                 <>
                                    Надіслати заявку
                                    <Send className="w-4 h-4 ml-2" />
                                 </>
                              )}
                           </Button>
                        </form>
                     </div>
                  </div>
               </FadeIn>
            </div>
         </section>
      </main>
   );
}
