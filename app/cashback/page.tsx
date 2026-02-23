'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { Spotlight } from '@/components/ui/spotlight-new';
import FadeIn from '@/components/ui/fade-in';
import {
   Gift,
   Percent,
   Star,
   Users,
   Copy,
   Check,
   LogIn,
   Wallet,
   ChevronDown,
   Sparkles,
   TrendingUp,
   Shield,
   BadgePercent,
   ArrowRight,
   FileText,
   Clock,
} from 'lucide-react';
import { MIN_PROMO_AMOUNT } from '@/config/constants';
import { CashbackSkeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Hero section (shared by auth / unauth views)                       */
/* ------------------------------------------------------------------ */
function HeroSection() {
   return (
      <section className="relative pt-28 pb-10 sm:pt-24 max-sm:pt-20 overflow-hidden">
         <Spotlight
            gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(197, 100%, 50%, 0.12) 0, hsla(197, 100%, 45%, 0.06) 50%, transparent 80%)"
            gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 60%, 0.1) 0, hsla(197, 100%, 45%, 0.04) 80%, transparent 100%)"
            gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(197, 100%, 50%, 0.06) 0, transparent 80%)"
            translateY={-200}
            duration={9}
         />
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

         <div className="relative z-10 w-full max-w-6xl mx-auto px-4 max-sm:px-3">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.1 }}
               className="mb-5"
            >
               <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium backdrop-blur-sm">
                  <Wallet className="w-4 h-4" />
                  Бонусна програма
               </span>
            </motion.div>

            <TextGenerateEffect
               words="Бонусна програма"
               className="text-4xl sm:text-5xl md:text-6xl font-light"
               accentWords={["програма"]}
               accentClassName="text-accent font-bold"
            />

            <motion.p
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.7, delay: 0.5 }}
               className="text-white/50 text-base sm:text-lg mt-4 max-w-lg leading-relaxed"
            >
               Отримуйте бонуси за кожне бронювання та використовуйте їх для знижок на майбутні подорожі
            </motion.p>

            <motion.div
               initial={{ opacity: 0, y: 16 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.7 }}
               className="flex flex-wrap gap-3 mt-6"
            >
               {highlights.map((b) => (
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
   );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface UserCashbackData {
   cashbackAmount: number;
   phoneNumber: string;
   userName: string;
   referralCode: string | null;
   referralCount: number;
   referralBonusEarned: number;
}

interface TripCashbackInfo {
   tripNumber: string;
   country: string;
   totalAmount: number;
   cashbackAmount: number;
   status: string;
   completedAt?: string;
}

interface PromoCodeEntry {
   code: string;
   amount: number;
   status: 'active' | 'used' | 'expired';
   createdAt: string;
   expiresAt: string;
   usedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const highlights = [
   { icon: Shield, text: 'Безпечно' },
   { icon: BadgePercent, text: 'До 3% cash-back' },
   { icon: Sparkles, text: '1000 грн бонус' },
   { icon: TrendingUp, text: 'Реферальна програма' },
];

const bonuses = [
   {
      icon: Gift,
      num: '01',
      title: 'Вітальний бонус',
      amount: '1 000 грн',
      desc: 'Отримайте вітальний бонус на ваш рахунок при першій реєстрації. Використовуйте його для знижки на перше бронювання туру.',
      note: 'Автоматично при реєстрації',
      color: 'emerald',
   },
   {
      icon: Percent,
      num: '02',
      title: 'Cash-back за бронювання',
      amount: '2%',
      desc: 'Отримуйте 2% від суми туру на ваш бонусний рахунок. Нарахування відбувається автоматично після завершення подорожі.',
      note: 'Після завершення туру',
      color: 'blue',
   },
   {
      icon: Star,
      num: '03',
      title: 'За активність туриста',
      amount: '+1%',
      desc: 'Додатковий 1% cash-back при самостійному підборі туру на нашому сайті. Надайте менеджеру конкретний код туру, який Ви знайшли.',
      note: 'Разом до 3% cash-back',
      color: 'purple',
   },
   {
      icon: Users,
      num: '04',
      title: 'За залучення друга',
      amount: 'до 2 000 грн',
      desc: 'Отримайте до 2 000 грн за кожного друга, якого Ви залучите. А ваш друг отримає бонус 800 грн після першого бронювання туру.',
      note: 'Бонус після першого бронювання друга',
      color: 'amber',
   },
];

const colorMap: Record<string, { border: string; bg: string; text: string; glow: string; iconBg: string }> = {
   emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bg: 'from-emerald-500/8 via-emerald-500/3 to-transparent',
      text: 'text-emerald-400',
      glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/15',
      iconBg: 'bg-emerald-500/15 border-emerald-500/25',
   },
   blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      bg: 'from-blue-500/8 via-blue-500/3 to-transparent',
      text: 'text-blue-400',
      glow: 'bg-blue-500/10 group-hover:bg-blue-500/15',
      iconBg: 'bg-blue-500/15 border-blue-500/25',
   },
   purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      bg: 'from-purple-500/8 via-purple-500/3 to-transparent',
      text: 'text-purple-400',
      glow: 'bg-purple-500/10 group-hover:bg-purple-500/15',
      iconBg: 'bg-purple-500/15 border-purple-500/25',
   },
   amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bg: 'from-amber-500/8 via-amber-500/3 to-transparent',
      text: 'text-amber-400',
      glow: 'bg-amber-500/10 group-hover:bg-amber-500/15',
      iconBg: 'bg-amber-500/15 border-amber-500/25',
   },
};

const faqItems = [
   {
      q: 'Коли cash-back зараховується на мій рахунок?',
      a: 'Cash-back автоматично зараховується на ваш рахунок після завершення туру. Ви отримаєте сповіщення електронною поштою, коли бонус буде додано.',
   },
   {
      q: 'Чи можу я використати кілька кодів знижки на одне бронювання?',
      a: 'Ні, на одне бронювання можна застосувати лише один код знижки cash-back. Проте ви можете згенерувати код на весь доступний баланс.',
   },
   {
      q: 'Що станеться, якщо я скасую бронювання?',
      a: 'Якщо ви скасуєте бронювання, cash-back, отриманий за це бронювання, буде знято з вашого балансу. Якщо ви використали код знижки для бронювання, сума коду буде повернута на ваш рахунок.',
   },
   {
      q: 'Як отримати вітальний бонус 1 000 грн?',
      a: 'Вітальний бонус автоматично зараховується на ваш рахунок при першій реєстрації на платформі. Ви можете використати його для знижки на перше бронювання туру.',
   },
   {
      q: 'Як працює реферальна програма?',
      a: 'Поділіться своїм реферальним кодом з друзями. Коли ваш друг зареєструється за вашим кодом та здійснить перше бронювання, ви отримаєте до 2 000 грн на свій бонусний рахунок, а ваш друг отримає бонус 800 грн після завершення першого туру.',
   },
];

const termsData = [
   { bold: 'Без виведення готівки:', text: 'Cash-back не можна перевести на банківський рахунок або зняти готівкою' },
   { bold: 'Знижка на майбутні бронювання:', text: 'Cash-back можна використовувати лише як знижку на майбутні бронювання турів' },
   { bold: 'Генерація коду:', text: 'Для використання cash-back згенеруйте унікальний код знижки та надайте його менеджеру при наступному бронюванні' },
   { bold: 'Одноразове використання:', text: 'Кожен згенерований код можна використати лише один раз, термін дії — 30 днів' },
   { bold: 'Мінімальна сума:', text: 'Для генерації коду знижки необхідний мінімальний баланс 100 грн' },
   { bold: 'Не передається:', text: "Cash-back та коди знижок прив'язані до вашого облікового запису і не можуть бути передані іншим особам" },
];

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function CashbackPage() {
   const { data: session, status: sessionStatus } = useSession();
   const [selectedTab, setSelectedTab] = useState<'bonuses' | 'overview' | 'claim'>('bonuses');
   const [agreedToTerms, setAgreedToTerms] = useState(false);
   const [copiedReferral, setCopiedReferral] = useState(false);
   const [userData, setUserData] = useState<UserCashbackData | null>(null);
   const [tripHistory, setTripHistory] = useState<TripCashbackInfo[]>([]);
   const [allBookingsCount, setAllBookingsCount] = useState(0);
   const [loading, setLoading] = useState(true);

   // Promo code generation state
   const [claimAmount, setClaimAmount] = useState<string>('');
   const [generatedCode, setGeneratedCode] = useState<{ code: string; amount: number; expiresAt: string } | null>(null);
   const [generating, setGenerating] = useState(false);
   const [generateError, setGenerateError] = useState<string | null>(null);
   const [copiedCode, setCopiedCode] = useState(false);

   // Promo code history
   const [promoHistory, setPromoHistory] = useState<PromoCodeEntry[]>([]);

   // Referral data from user profile
   const referralCode = userData?.referralCode || 'REF-XXXX-XXXX';
   const referralCount = userData?.referralCount || 0;
   const referralBonusEarned = userData?.referralBonusEarned || 0;

   const fetchPromoHistory = useCallback(async () => {
      try {
         const res = await fetch('/api/promo-codes');
         if (res.ok) {
            const data = await res.json();
            setPromoHistory(data.codes || []);
         }
         // Also refresh user balance since it changed after code generation
         const profileRes = await fetch('/api/profileFetch');
         if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUserData(prev => prev ? { ...prev, cashbackAmount: profileData.cashbackAmount || 0 } : prev);
         }
      } catch (err) {
         console.error('Error fetching promo history:', err);
      }
   }, []);

   useEffect(() => {
      const fetchCashbackData = async () => {
         if (sessionStatus === 'loading') return;

         if (!session?.user?.phoneNumber) {
            setLoading(false);
            return;
         }

         try {
            // Single request replaces 3 separate API calls
            // (1 session check + 1 DB connect instead of 3×each)
            const res = await fetch('/api/cashback-data');
            if (!res.ok) throw new Error('Failed to fetch cashback data');

            const data = await res.json();
            const userPhone = data.profile?.phoneNumber || session?.user?.phoneNumber || '';

            if (data.profile) {
               setUserData({
                  cashbackAmount: data.profile.cashbackAmount || 0,
                  phoneNumber: data.profile.phoneNumber || '',
                  userName: data.profile.userName || '',
                  referralCode: data.profile.referralCode || null,
                  referralCount: data.profile.referralCount || 0,
                  referralBonusEarned: data.profile.referralBonusEarned || 0,
               });
            }

            const allTrips = data.trips || [];
            const ownedTrips = allTrips.filter((t: { ownerPhone?: string }) => t.ownerPhone === userPhone);
            setAllBookingsCount(ownedTrips.length);

            const processedTrips = ownedTrips.filter((t: { cashbackProcessed?: boolean }) => t.cashbackProcessed);
            setTripHistory(processedTrips.map((trip: { number: string; country: string; payment?: { totalAmount?: number }; cashbackAmount?: number; status: string; updatedAt?: string }) => ({
               tripNumber: trip.number,
               country: trip.country,
               totalAmount: trip.payment?.totalAmount || 0,
               cashbackAmount: trip.cashbackAmount || 0,
               status: trip.status,
               completedAt: trip.updatedAt,
            })));

            setPromoHistory(data.promoCodes || []);
         } catch (error) {
            console.error('Error fetching cashback data:', error);
         } finally {
            setLoading(false);
         }
      };

      fetchCashbackData();
   }, [session, sessionStatus]);

   const cashbackBalance = userData?.cashbackAmount || 0;
   const totalPromoSpent = promoHistory.reduce((sum, p) => sum + p.amount, 0);
   const totalEarned = cashbackBalance + totalPromoSpent;
   const bookingsCount = allBookingsCount;

   const copyReferralCode = () => {
      navigator.clipboard.writeText(referralCode);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
   };

   const copyPromoCode = (code: string) => {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
   };

   const handleGenerateCode = async () => {
      const numAmount = Number(claimAmount);
      if (!numAmount || numAmount < MIN_PROMO_AMOUNT) {
         setGenerateError(`Мінімальна сума — ${MIN_PROMO_AMOUNT} грн`);
         return;
      }
      if (numAmount > cashbackBalance) {
         setGenerateError('Недостатньо коштів на бонусному рахунку');
         return;
      }

      setGenerating(true);
      setGenerateError(null);
      setGeneratedCode(null);

      try {
         const res = await fetch('/api/promo-codes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: numAmount }),
         });

         const data = await res.json();

         if (!res.ok) {
            setGenerateError(data.message || 'Помилка генерації');
            return;
         }

         setGeneratedCode({ code: data.code, amount: data.amount, expiresAt: data.expiresAt });
         setUserData(prev => prev ? { ...prev, cashbackAmount: prev.cashbackAmount - numAmount } : prev);
         setClaimAmount('');
         setAgreedToTerms(false);
         await fetchPromoHistory();
      } catch {
         setGenerateError('Помилка мережі. Спробуйте пізніше.');
      } finally {
         setGenerating(false);
      }
   };

   const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('uk-UA', {
         day: 'numeric',
         month: 'long',
         year: 'numeric',
      });
   };

   const statusLabel = (status: string) => {
      switch (status) {
         case 'active': return 'Активний';
         case 'used': return 'Використано';
         case 'expired': return 'Прострочено';
         default: return status;
      }
   };

   /* ------------------------------------------------------------------ */
   /*  Loading state                                                      */
   /* ------------------------------------------------------------------ */
   if (loading) {
      return <CashbackSkeleton />;
   }

   /* ------------------------------------------------------------------ */
   /*  Unauthenticated state                                              */
   /* ------------------------------------------------------------------ */
   if (!session?.user) {
      return (
         <main className="relative min-h-screen w-full overflow-x-hidden bg-black">
            <HeroSection />

            <section className="relative py-10 md:py-14">
               <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-accent/4 rounded-full blur-[150px] pointer-events-none" />

               <div className="relative z-10 max-w-md mx-auto px-4">
                  <FadeIn>
                     <div className="relative p-8 md:p-12 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm text-center">
                        <div className="absolute inset-0 bg-linear-to-br from-white/3 via-white/1.5 to-accent/2.5" />
                        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/25 to-transparent" />
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent/8 rounded-full blur-[80px] pointer-events-none" />

                        <div className="relative z-10">
                           <div className="w-20 h-20 bg-accent/15 border border-accent/25 rounded-2xl flex items-center justify-center mx-auto mb-6">
                              <LogIn className="w-10 h-10 text-accent" />
                           </div>
                           <h2 className="text-2xl font-bold text-white mb-3">Увійдіть в акаунт</h2>
                           <p className="text-white/50 text-sm mb-8 leading-relaxed">
                              Щоб переглянути свій баланс бонусів та історію кешбеку, увійдіть у свій обліковий запис.
                           </p>
                           <div className="flex flex-col gap-3">
                              <Link href="/login">
                                 <Button className="w-full bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl h-12 shadow-lg shadow-accent/25 hover:shadow-accent/35 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200">
                                    Увійти
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                 </Button>
                              </Link>
                              <Link href="/register">
                                 <Button variant="outline" className="w-full border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-xl h-12 transition-all duration-200">
                                    Зареєструватися
                                 </Button>
                              </Link>
                           </div>
                        </div>
                     </div>
                  </FadeIn>
               </div>
            </section>
         </main>
      );
   }

   /* ------------------------------------------------------------------ */
   /*  Authenticated view                                                 */
   /* ------------------------------------------------------------------ */
   const tabs = [
      { key: 'bonuses' as const, label: 'Бонуси' },
      { key: 'overview' as const, label: 'Як це працює' },
      { key: 'claim' as const, label: 'Отримати cashback' },
   ];

   return (
      <main className="relative min-h-screen w-full overflow-x-hidden bg-black">
         {/* ============================================================ */}
         {/*  HERO SECTION                                                 */}
         {/* ============================================================ */}
         <HeroSection />

         {/* ============================================================ */}
         {/*  BALANCE CARDS                                                */}
         {/* ============================================================ */}
         <section className="relative py-8">
            <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-accent/3 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto px-4 max-sm:px-3">
               <FadeIn>
                  <div className="relative rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm">
                     <div className="absolute inset-0 bg-linear-to-br from-accent/6 via-accent/2 to-transparent" />
                     <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/30 to-transparent" />
                     <div className="absolute -top-24 -right-24 w-56 h-56 bg-accent/8 rounded-full blur-[80px] pointer-events-none" />

                     <div className="relative z-10 p-8 md:p-12">
                        {userData?.userName && (
                           <div className="mb-6 pb-6 border-b border-white/5">
                              <p className="text-white/50 text-sm">Вітаємо, <span className="text-white font-medium">{userData.userName}</span></p>
                           </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                           <div>
                              <div className="flex items-center gap-2 mb-3">
                                 <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                 <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.15em]">Доступний баланс</p>
                              </div>
                              <p className="text-4xl md:text-5xl font-light text-accent">{cashbackBalance.toLocaleString()} <span className="text-xl text-accent/70">грн</span></p>
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-3">
                                 <div className="w-2 h-2 rounded-full bg-white/20" />
                                 <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.15em]">Всього накопичено</p>
                              </div>
                              <p className="text-3xl md:text-4xl font-light text-white">{totalEarned.toLocaleString()} <span className="text-lg text-white/40">грн</span></p>
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-3">
                                 <div className="w-2 h-2 rounded-full bg-white/20" />
                                 <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.15em]">Бронювань здійснено</p>
                              </div>
                              <p className="text-3xl md:text-4xl font-light text-white">{bookingsCount}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </FadeIn>
            </div>
         </section>

         {/* ============================================================ */}
         {/*  TAB NAVIGATION                                               */}
         {/* ============================================================ */}
         <section className="relative py-4">
            <div className="relative z-10 max-w-6xl mx-auto px-4 max-sm:px-3">
               <FadeIn delay={0.1}>
                  <div className="flex gap-1 p-1 rounded-2xl bg-white/3 border border-white/5 w-fit">
                     {tabs.map((tab) => (
                        <button
                           key={tab.key}
                           onClick={() => setSelectedTab(tab.key)}
                           className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                              selectedTab === tab.key
                                 ? 'bg-accent/15 text-accent border border-accent/25 shadow-lg shadow-accent/10'
                                 : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                           }`}
                        >
                           {tab.label}
                        </button>
                     ))}
                  </div>
               </FadeIn>
            </div>
         </section>

         {/* ============================================================ */}
         {/*  TAB CONTENT                                                  */}
         {/* ============================================================ */}
         <section className="relative py-8 pb-20">
            <div className="absolute bottom-0 left-1/3 w-[600px] h-[400px] bg-accent/3 rounded-full blur-[180px] pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto px-4 max-sm:px-3">
               <AnimatePresence mode="wait">
               {/* ====== BONUSES TAB ====== */}
               {selectedTab === 'bonuses' && (
                  <motion.div
                     key="bonuses"
                     initial={{ opacity: 0, y: 16 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -12 }}
                     transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                  >
                  <div className="space-y-10">
                     {/* Bonus Cards */}
                     <div className="grid md:grid-cols-2 gap-5">
                        {bonuses.map((bonus, i) => {
                           const c = colorMap[bonus.color];
                           return (
                              <FadeIn key={bonus.num} delay={i * 0.08}>
                                 <div className={`group relative rounded-2xl border ${c.border} overflow-hidden transition-all duration-300 hover:shadow-lg`}>
                                    <div className={`absolute inset-0 bg-linear-to-br ${c.bg}`} />
                                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-16 -mt-16 ${c.glow} transition-all duration-500`} />

                                    <div className="relative z-10 p-7">
                                       <div className="flex items-center gap-4 mb-5">
                                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${c.iconBg}`}>
                                             <bonus.icon className={`w-6 h-6 ${c.text}`} />
                                          </div>
                                          <div>
                                             <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${c.text} mb-0.5`}>{bonus.num}</p>
                                             <h3 className="text-lg font-semibold text-white">{bonus.title}</h3>
                                          </div>
                                       </div>
                                       <p className={`text-3xl font-light mb-3 ${c.text}`}>{bonus.amount}</p>
                                       <p className="text-white/55 text-sm leading-relaxed mb-4">{bonus.desc}</p>
                                       <div className="flex items-center gap-2 text-sm">
                                          <svg className={`w-4 h-4 ${c.text}`} fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          <span className={c.text}>{bonus.note}</span>
                                       </div>
                                    </div>
                                 </div>
                              </FadeIn>
                           );
                        })}
                     </div>

                     {/* Referral Code Section */}
                     <FadeIn delay={0.2}>
                        <div className="relative rounded-2xl border border-white/5 overflow-hidden">
                           <div className="absolute inset-0 bg-linear-to-br from-white/3 via-white/1.5 to-amber-500/2" />
                           <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-400/20 to-transparent" />

                           <div className="relative z-10 p-7 md:p-8">
                              <div className="flex items-center gap-3 mb-2">
                                 <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-amber-400" />
                                 </div>
                                 <h3 className="text-xl font-bold text-white">Ваш реферальний код</h3>
                              </div>
                              <p className="text-white/45 text-sm mb-6 leading-relaxed">
                                 Поділіться цим кодом з друзями. Коли вони зареєструються та здійснять перше бронювання,
                                 ви отримаєте бонус до 2 000 грн, а вони — додатковий бонус 800 грн.
                              </p>

                              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                 <div className="flex-1 bg-white/3 border border-white/8 rounded-xl p-4 flex items-center justify-between">
                                    <span className="text-xl font-mono tracking-wider text-accent">{referralCode}</span>
                                    <button
                                       onClick={copyReferralCode}
                                       className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                       {copiedReferral ? (
                                          <Check className="w-5 h-5 text-green-400" />
                                       ) : (
                                          <Copy className="w-5 h-5 text-white/40" />
                                       )}
                                    </button>
                                 </div>
                                 <Button
                                    onClick={copyReferralCode}
                                    className="bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl px-6 shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                                 >
                                    Поділитися
                                 </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/5">
                                 <div>
                                    <p className="text-white/35 text-xs uppercase tracking-wider font-medium mb-1">Друзів запрошено</p>
                                    <p className="text-2xl font-light text-amber-400">{referralCount}</p>
                                 </div>
                                 <div>
                                    <p className="text-white/35 text-xs uppercase tracking-wider font-medium mb-1">Зароблено з рефералів</p>
                                    <p className="text-2xl font-light text-amber-400">{referralBonusEarned.toLocaleString()} грн</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </FadeIn>

                     {/* Trip Cashback History */}
                     <FadeIn delay={0.15}>
                        <div className="relative rounded-2xl border border-white/5 overflow-hidden">
                           <div className="absolute inset-0 bg-white/2" />
                           <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                           <div className="relative z-10">
                              <div className="p-6 border-b border-white/5">
                                 <h3 className="text-lg font-bold text-white">Історія нарахувань cash-back</h3>
                              </div>
                              {tripHistory.length === 0 ? (
                                 <div className="p-10 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4">
                                       <Clock className="w-7 h-7 text-white/20" />
                                    </div>
                                    <p className="text-white/45 text-sm font-medium mb-1">Ще немає нарахувань</p>
                                    <p className="text-white/25 text-xs">Cash-back з&apos;явиться тут після завершення вашого першого туру</p>
                                 </div>
                              ) : (
                                 <div className="overflow-x-auto">
                                    <table className="w-full">
                                       <thead>
                                          <tr className="border-b border-white/5">
                                             <th className="text-left p-4 text-xs font-semibold text-white/35 uppercase tracking-wider">Тур</th>
                                             <th className="text-left p-4 text-xs font-semibold text-white/35 uppercase tracking-wider">Країна</th>
                                             <th className="text-left p-4 text-xs font-semibold text-white/35 uppercase tracking-wider">Сума туру</th>
                                             <th className="text-left p-4 text-xs font-semibold text-white/35 uppercase tracking-wider">Cash-back</th>
                                             <th className="text-left p-4 text-xs font-semibold text-white/35 uppercase tracking-wider">Дата</th>
                                          </tr>
                                       </thead>
                                       <tbody>
                                          {tripHistory.map((trip) => (
                                             <tr key={trip.tripNumber} className="border-b border-white/3 last:border-b-0 hover:bg-white/3 transition-colors">
                                                <td className="p-4 font-medium text-white/90">#{trip.tripNumber}</td>
                                                <td className="p-4 text-white/55">{trip.country}</td>
                                                <td className="p-4 text-white/55">{trip.totalAmount.toLocaleString()} грн</td>
                                                <td className="p-4 text-accent font-medium">+{trip.cashbackAmount.toLocaleString()} грн</td>
                                                <td className="p-4 text-white/55">{trip.completedAt ? formatDate(trip.completedAt) : '—'}</td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                 </div>
                              )}
                           </div>
                        </div>
                     </FadeIn>

                     {/* Bonus Summary Table */}
                     <FadeIn delay={0.2}>
                        <div className="relative rounded-2xl border border-white/5 overflow-hidden">
                           <div className="absolute inset-0 bg-white/2" />
                           <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                           <div className="relative z-10">
                              <div className="p-6 border-b border-white/5">
                                 <h3 className="text-lg font-bold text-white">Зведена таблиця бонусів</h3>
                              </div>
                              <div className="overflow-x-auto">
                                 <table className="w-full">
                                    <thead>
                                       <tr className="border-b border-white/5">
                                          <th className="text-left p-4 text-xs font-semibold text-white/35 uppercase tracking-wider">Бонус</th>
                                          <th className="text-left p-4 text-xs font-semibold text-white/35 uppercase tracking-wider">Розмір</th>
                                          <th className="text-left p-4 text-xs font-semibold text-white/35 uppercase tracking-wider">Умови</th>
                                          <th className="text-left p-4 text-xs font-semibold text-white/35 uppercase tracking-wider">Коли нараховується</th>
                                       </tr>
                                    </thead>
                                    <tbody>
                                       <tr className="border-b border-white/3 hover:bg-white/3 transition-colors">
                                          <td className="p-4 font-medium text-white/90">Вітальний бонус</td>
                                          <td className="p-4 text-emerald-400">1 000 грн</td>
                                          <td className="p-4 text-white/55">Перша реєстрація</td>
                                          <td className="p-4 text-white/55">Одразу</td>
                                       </tr>
                                       <tr className="border-b border-white/3 hover:bg-white/3 transition-colors">
                                          <td className="p-4 font-medium text-white/90">Cash-back за бронювання</td>
                                          <td className="p-4 text-blue-400">2% від суми туру</td>
                                          <td className="p-4 text-white/55">Будь-яке бронювання</td>
                                          <td className="p-4 text-white/55">Після завершення туру</td>
                                       </tr>
                                       <tr className="border-b border-white/3 hover:bg-white/3 transition-colors">
                                          <td className="p-4 font-medium text-white/90">За активність туриста</td>
                                          <td className="p-4 text-purple-400">+1% cash-back</td>
                                          <td className="p-4 text-white/55">Самостійний підбір туру</td>
                                          <td className="p-4 text-white/55">Після завершення туру</td>
                                       </tr>
                                       <tr className="hover:bg-white/3 transition-colors">
                                          <td className="p-4 font-medium text-white/90">За залучення друга</td>
                                          <td className="p-4 text-amber-400">до 2 000 грн</td>
                                          <td className="p-4 text-white/55">Друг здійснив бронювання</td>
                                          <td className="p-4 text-white/55">Після оплати туру другом</td>
                                       </tr>
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        </div>
                     </FadeIn>
                  </div>
                  </motion.div>
               )}

               {/* ====== OVERVIEW TAB ====== */}
               {selectedTab === 'overview' && (
                  <motion.div
                     key="overview"
                     initial={{ opacity: 0, y: 16 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -12 }}
                     transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                  >
                  <div className="space-y-12">
                     <FadeIn>
                        <div>
                           <h2 className="text-2xl font-light text-white mb-6">Як накопичується <span className="text-accent font-bold">Cash-back</span></h2>
                           <div className="relative rounded-2xl border border-white/5 overflow-hidden">
                              <div className="absolute inset-0 bg-linear-to-br from-white/3 via-white/1.5 to-transparent" />
                              <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/20 to-transparent" />

                              <div className="relative z-10 p-6 md:p-8 space-y-7">
                                 <div className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                                       <span className="text-accent font-bold text-sm">2%</span>
                                    </div>
                                    <div>
                                       <h3 className="font-bold text-white mb-2">Базовий Cash-back за кожне бронювання</h3>
                                       <p className="text-white/50 text-sm leading-relaxed">
                                          Отримуйте 2% cash-back від загальної вартості кожного туру, який ви бронюєте через нашу платформу.
                                          Cash-back автоматично зараховується на ваш рахунок після завершення подорожі.
                                       </p>
                                    </div>
                                 </div>

                                 <div className="h-px bg-linear-to-r from-white/5 via-white/8 to-transparent" />

                                 <div className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                       <span className="text-purple-400 font-bold text-sm">+1%</span>
                                    </div>
                                    <div>
                                       <h3 className="font-bold text-white mb-2">Додатковий бонус за активність</h3>
                                       <p className="text-white/50 text-sm leading-relaxed">
                                          Якщо ви самостійно підберете тур та надасте менеджеру конкретний код туру,
                                          отримаєте додатковий 1% cash-back. Разом — до 3% від вартості туру!
                                       </p>
                                    </div>
                                 </div>

                                 <div className="h-px bg-linear-to-r from-white/5 via-white/8 to-transparent" />

                                 <div className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                                       <Wallet className="w-5 h-5 text-accent" />
                                    </div>
                                    <div>
                                       <h3 className="font-bold text-white mb-2">Приклад розрахунку</h3>
                                       <p className="text-white/50 text-sm leading-relaxed">
                                          Тур вартістю 50 000 грн → Отримаєте 1 000 грн cash-back (2%)<br />
                                          Тур вартістю 100 000 грн → Отримаєте 2 000 грн cash-back (2%)<br />
                                          З бонусом за активність: 100 000 грн → 3 000 грн cash-back (3%)
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </FadeIn>

                     <FadeIn delay={0.1}>
                        <div>
                           <h2 className="text-2xl font-light text-white mb-6">Умови <span className="text-accent font-bold">використання</span></h2>
                           <div className="relative rounded-2xl border border-white/5 overflow-hidden">
                              <div className="absolute inset-0 bg-white/2" />
                              <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                              <div className="relative z-10 p-6 md:p-8">
                                 <ul className="space-y-4">
                                    {termsData.map((item, i) => (
                                       <li key={i} className="flex gap-3">
                                          <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          <span className="text-white/60 text-sm leading-relaxed">
                                             <strong className="text-white/90">{item.bold}</strong> {item.text}
                                          </span>
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                           </div>
                        </div>
                     </FadeIn>

                     <FadeIn delay={0.2}>
                        <div>
                           <h2 className="text-2xl font-light text-white mb-6">Часті <span className="text-accent font-bold">запитання</span></h2>
                           <div className="space-y-3">
                              {faqItems.map((item, i) => (
                                 <details key={i} className="group relative rounded-2xl border border-white/5 overflow-hidden">
                                    <div className="absolute inset-0 bg-white/2 group-open:bg-white/3 transition-colors duration-300" />

                                    <summary className="relative z-10 cursor-pointer p-5 font-semibold text-white/90 list-none flex justify-between items-center hover:text-white transition-colors">
                                       <span className="text-sm">{item.q}</span>
                                       <ChevronDown className="w-4 h-4 text-white/30 transform group-open:rotate-180 transition-transform duration-300 shrink-0 ml-4" />
                                    </summary>
                                    <div className="relative z-10 px-5 pb-5 -mt-1">
                                       <div className="h-px bg-white/5 mb-4" />
                                       <p className="text-white/50 text-sm leading-relaxed">{item.a}</p>
                                    </div>
                                 </details>
                              ))}
                           </div>
                        </div>
                     </FadeIn>
                  </div>
                  </motion.div>
               )}

               {/* ====== CLAIM TAB ====== */}
               {selectedTab === 'claim' && (
                  <motion.div
                     key="claim"
                     initial={{ opacity: 0, y: 16 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -12 }}
                     transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                  >
                  <div className="max-w-2xl mx-auto space-y-8">
                     <FadeIn>
                        <div className="relative rounded-3xl border border-white/5 overflow-hidden">
                           <div className="absolute inset-0 bg-linear-to-br from-white/3 via-white/1.5 to-accent/2.5" />
                           <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/25 to-transparent" />
                           <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent/8 rounded-full blur-[80px] pointer-events-none" />

                           <div className="relative z-10 p-8 md:p-10">
                              <div className="flex items-center gap-3 mb-1">
                                 <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-accent" />
                                 </div>
                                 <h2 className="text-2xl font-bold text-white">Отримати Cash-back</h2>
                              </div>
                              <p className="text-white/40 text-sm mb-8 ml-[52px]">Згенеруйте код знижки та надайте менеджеру</p>

                              <div className="space-y-5 mb-8">
                                 {[
                                    { n: '1', title: 'Вкажіть суму', desc: 'Вкажіть скільки cash-back ви хочете використати (мінімум 100 грн, максимум: ваш доступний баланс)' },
                                    { n: '2', title: 'Згенеруйте код', desc: 'Натисніть кнопку для генерації унікального коду знижки' },
                                    { n: '3', title: "Зв'яжіться з менеджером", desc: 'Надайте згенерований код нашому менеджеру при наступному бронюванні' },
                                    { n: '4', title: 'Отримайте знижку', desc: 'Менеджер застосує знижку до загальної суми вашого бронювання' },
                                 ].map((step, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                       <div className="shrink-0 w-8 h-8 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-xs font-bold text-accent">
                                          {step.n}
                                       </div>
                                       <div>
                                          <h3 className="font-semibold text-white text-sm mb-0.5">{step.title}</h3>
                                          <p className="text-white/40 text-xs leading-relaxed">{step.desc}</p>
                                       </div>
                                    </div>
                                 ))}
                              </div>

                              <div className="h-px bg-linear-to-r from-white/5 via-white/10 to-white/5 mb-8" />

                              <div>
                                 <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                                    Сума для використання
                                 </label>

                                 {/* Quick amount presets */}
                                 <div className="flex flex-wrap gap-2 mb-3">
                                    {[100, 500, 1000].filter(v => v <= cashbackBalance).map((preset) => (
                                       <button
                                          key={preset}
                                          onClick={() => { setClaimAmount(String(preset)); setGenerateError(null); }}
                                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                                             claimAmount === String(preset)
                                                ? 'bg-accent/15 border-accent/30 text-accent'
                                                : 'bg-white/3 border-white/8 text-white/50 hover:border-accent/20 hover:text-white/70'
                                          }`}
                                       >
                                          {preset.toLocaleString()} грн
                                       </button>
                                    ))}
                                    {cashbackBalance >= 100 && (
                                       <button
                                          onClick={() => { setClaimAmount(String(cashbackBalance)); setGenerateError(null); }}
                                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                                             claimAmount === String(cashbackBalance)
                                                ? 'bg-accent/15 border-accent/30 text-accent'
                                                : 'bg-white/3 border-white/8 text-white/50 hover:border-accent/20 hover:text-white/70'
                                          }`}
                                       >
                                          Весь баланс
                                       </button>
                                    )}
                                 </div>

                                 <div className="relative">
                                    <input
                                       type="number"
                                       min="100"
                                       max={cashbackBalance}
                                       step="1"
                                       value={claimAmount}
                                       onChange={(e) => { setClaimAmount(e.target.value); setGenerateError(null); }}
                                       placeholder="0"
                                       className="w-full h-12 bg-white/5 border border-white/8 rounded-xl pl-4 pr-14 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all text-white placeholder:text-white/20"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 text-sm">
                                       грн
                                    </span>
                                 </div>
                                 <p className="text-xs text-white/30 mt-2">
                                    Доступний баланс: <span className="text-accent">{cashbackBalance.toLocaleString()} грн</span>
                                 </p>
                              </div>

                              {generateError && (
                                 <div className="mt-5 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <p className="text-sm text-red-400">{generateError}</p>
                                 </div>
                              )}

                              <div className="mt-5 bg-accent/5 border border-accent/15 rounded-xl p-4">
                                 <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs text-white/55 leading-relaxed">
                                       Після генерації код буде дійсний протягом 30 днів і може бути використаний лише один раз. Вказана сума буде негайно списана з вашого балансу.
                                    </p>
                                 </div>
                              </div>

                              <div className="mt-5">
                                 <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={agreedToTerms}
                                       onChange={(e) => setAgreedToTerms(e.target.checked)}
                                       className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-accent focus:ring-2 focus:ring-accent/20"
                                    />
                                    <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors leading-relaxed">
                                       Я погоджуюся з умовами та розумію, що цей cash-back буде використано як знижку на моє наступне бронювання і не може бути виведено готівкою
                                    </span>
                                 </label>
                              </div>

                              <Button
                                 disabled={!agreedToTerms || generating || cashbackBalance < 100}
                                 onClick={handleGenerateCode}
                                 className="w-full h-12 mt-6 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent/25 hover:shadow-accent/35 hover:scale-[1.01] active:scale-[0.99] duration-200"
                              >
                                 {generating ? 'Генерація...' : 'Згенерувати код знижки'}
                              </Button>

                              {generatedCode && (
                                 <div className="mt-8 relative rounded-2xl border border-accent/20 overflow-hidden">
                                    <div className="absolute inset-0 bg-linear-to-br from-accent/8 via-accent/4 to-transparent" />
                                    <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />

                                    <div className="relative z-10 p-6 text-center">
                                       <p className="text-white/60 text-sm mb-1">Ваш код знижки</p>
                                       <p className="text-white/40 text-xs mb-4">
                                          на суму {generatedCode.amount.toLocaleString()} грн
                                       </p>
                                       <div className="bg-black/40 border border-accent/15 rounded-xl p-4 mb-4">
                                          <p className="text-2xl font-mono tracking-[0.2em] text-accent">
                                             {generatedCode.code}
                                          </p>
                                       </div>
                                       <Button
                                          variant="outline"
                                          className="border-accent/20 hover:bg-accent/10 text-accent rounded-xl transition-all"
                                          onClick={() => copyPromoCode(generatedCode.code)}
                                       >
                                          {copiedCode ? (
                                             <Check className="w-4 h-4 mr-2 text-green-400" />
                                          ) : (
                                             <Copy className="w-4 h-4 mr-2" />
                                          )}
                                          {copiedCode ? 'Скопійовано' : 'Скопіювати'}
                                       </Button>
                                       <p className="text-[10px] text-white/30 mt-4">
                                          Дійсний до {formatDate(generatedCode.expiresAt)} &bull; Надайте його менеджеру при бронюванні
                                       </p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </FadeIn>

                     <FadeIn delay={0.1}>
                        <div className="relative rounded-2xl border border-white/5 overflow-hidden">
                           <div className="absolute inset-0 bg-white/2" />
                           <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                           <div className="relative z-10 p-7 md:p-8">
                              <h3 className="text-lg font-bold text-white mb-5">Історія кодів</h3>
                              {promoHistory.length === 0 ? (
                                 <div className="text-center py-6">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4">
                                       <FileText className="w-7 h-7 text-white/20" />
                                    </div>
                                    <p className="text-white/45 text-sm font-medium mb-1">Ще немає кодів</p>
                                    <p className="text-white/25 text-xs">Згенеровані коди знижок з&apos;являться тут</p>
                                 </div>
                              ) : (
                                 <div className="space-y-1">
                                    {promoHistory.map((entry) => (
                                       <div key={entry.code} className="flex justify-between items-center py-3.5 px-3 -mx-3 rounded-xl hover:bg-white/3 transition-colors border-b border-white/3 last:border-b-0">
                                          <div>
                                             <p className="font-medium font-mono text-white/90 text-sm">{entry.code}</p>
                                             <p className="text-[11px] text-white/30 mt-0.5">
                                                Згенеровано {formatDate(entry.createdAt)}
                                                {entry.status === 'active' && ` • Дійсний до ${formatDate(entry.expiresAt)}`}
                                                {entry.usedAt && ` • Використано ${formatDate(entry.usedAt)}`}
                                             </p>
                                          </div>
                                          <div className="text-right flex flex-col items-end gap-1.5">
                                             <p className="font-semibold text-white/90 text-sm">{entry.amount.toLocaleString()} грн</p>
                                             <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                                entry.status === 'active'
                                                   ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                   : entry.status === 'used'
                                                     ? 'bg-white/5 border-white/10 text-white/40'
                                                     : 'bg-red-500/10 border-red-500/20 text-red-400'
                                             }`}>
                                                {statusLabel(entry.status)}
                                             </span>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>
                     </FadeIn>
                  </div>
                  </motion.div>
               )}
               </AnimatePresence>
            </div>
         </section>
      </main>
   );
}
