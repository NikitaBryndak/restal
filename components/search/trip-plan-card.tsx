"use client";

import { motion } from "motion/react";
import {
  MapPin,
  Calendar,
  Users,
  Wallet,
  Hotel,
  Utensils,
  Star,
  Sparkles,
  Send,
  ChevronRight,
  Globe,
  Plane,
  X,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export type TripPlan = {
  destination: string | null;
  region: string | null;
  dates: {
    from: string | null;
    to: string | null;
    flexible: boolean;
  } | null;
  travelers: {
    adults: number | null;
    children: number | null;
    childrenAges: number[] | null;
  } | null;
  budget: {
    amount: string | null;
    currency: string | null;
    perPerson: boolean;
  } | null;
  tripType: string | null;
  hotel: {
    stars: string | null;
    mealPlan: string | null;
    preferences: string[] | null;
  } | null;
  activities: {
    name: string;
    description: string;
    icon: string;
  }[] | null;
  recommendations: {
    destination: string;
    reason: string;
    highlights: string[];
    estimatedCost: string | null;
  }[] | null;
  notes: string | null;
};

/* ------------------------------------------------------------------ */
/*  Build prefilled contact message                                    */
/* ------------------------------------------------------------------ */
function buildContactMessage(plan: TripPlan): string {
  const lines: string[] = ["📋 Запит на подорож (сформовано через AI-планувальник RestAL):"];
  lines.push("");

  if (plan.destination) {
    lines.push(`🌍 Напрямок: ${plan.destination}${plan.region ? ` (${plan.region})` : ""}`);
  }

  if (plan.dates) {
    const from = plan.dates.from || "—";
    const to = plan.dates.to || "—";
    const flex = plan.dates.flexible ? " (гнучкі дати)" : "";
    lines.push(`🗓 Дати: ${from} — ${to}${flex}`);
  }

  if (plan.travelers) {
    const parts: string[] = [];
    if (plan.travelers.adults) parts.push(`${plan.travelers.adults} дорослих`);
    if (plan.travelers.children) {
      let childStr = `${plan.travelers.children} дітей`;
      if (plan.travelers.childrenAges?.length) {
        childStr += ` (вік: ${plan.travelers.childrenAges.join(", ")} р.)`;
      }
      parts.push(childStr);
    }
    if (parts.length) lines.push(`👥 Туристи: ${parts.join(", ")}`);
  }

  if (plan.budget?.amount) {
    const cur = plan.budget.currency || "USD";
    const per = plan.budget.perPerson ? " на людину" : " загалом";
    lines.push(`💰 Бюджет: ${plan.budget.amount} ${cur}${per}`);
  }

  if (plan.tripType) {
    lines.push(`🏖 Тип відпочинку: ${plan.tripType}`);
  }

  if (plan.hotel) {
    const hotelParts: string[] = [];
    if (plan.hotel.stars) hotelParts.push(`${plan.hotel.stars}⭐`);
    if (plan.hotel.mealPlan) hotelParts.push(plan.hotel.mealPlan);
    if (plan.hotel.preferences?.length) hotelParts.push(plan.hotel.preferences.join(", "));
    if (hotelParts.length) lines.push(`🏨 Готель: ${hotelParts.join(" · ")}`);
  }

  if (plan.activities?.length) {
    lines.push("");
    lines.push("🎯 Бажані активності:");
    plan.activities.forEach((act) => {
      lines.push(`  ${act.icon} ${act.name} — ${act.description}`);
    });
  }

  if (plan.recommendations?.length) {
    lines.push("");
    lines.push("📍 Рекомендовані AI напрямки:");
    plan.recommendations.forEach((rec, i) => {
      const cost = rec.estimatedCost ? ` (${rec.estimatedCost})` : "";
      lines.push(`  ${i + 1}. ${rec.destination}${cost}`);
      lines.push(`     ${rec.reason}`);
      if (rec.highlights?.length) {
        lines.push(`     Особливості: ${rec.highlights.join(", ")}`);
      }
    });
  }

  if (plan.notes) {
    lines.push("");
    lines.push(`📝 Додатково: ${plan.notes}`);
  }

  lines.push("");
  lines.push("Прошу підібрати відповідний тур за цими параметрами. Дякую!");

  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Section component                                                  */
/* ------------------------------------------------------------------ */
function PlanSection({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex gap-3"
    >
      <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-1">
          {title}
        </p>
        {children}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function TripPlanCard({
  plan,
  onClose,
}: {
  plan: TripPlan;
  onClose: () => void;
}) {
  const contactMessage = buildContactMessage(plan);
  const contactUrl = `/contact?source=ai-trip-plan&message=${encodeURIComponent(contactMessage)}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="relative rounded-2xl border border-white/8 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-linear-to-br from-white/4 via-accent/2 to-white/1" />
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-accent/5 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/30 to-transparent" />

        <div className="relative z-10 p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
                <Plane className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-white text-lg font-bold leading-tight">
                  {plan.destination || "Ваша подорож"}
                </h3>
                {plan.region && (
                  <p className="text-accent/70 text-sm">{plan.region}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Trip type badge */}
          {plan.tripType && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
                <Globe className="w-3.5 h-3.5" />
                {plan.tripType}
              </span>
            </motion.div>
          )}

          {/* Details grid */}
          <div className="space-y-4">
            {/* Dates */}
            {plan.dates && (plan.dates.from || plan.dates.to) && (
              <PlanSection icon={Calendar} title="Дати" delay={0.15}>
                <p className="text-white/90 text-sm">
                  {plan.dates.from || "—"} — {plan.dates.to || "—"}
                  {plan.dates.flexible && (
                    <span className="text-accent/60 ml-2 text-xs">(гнучкі дати)</span>
                  )}
                </p>
              </PlanSection>
            )}

            {/* Travelers */}
            {plan.travelers && (plan.travelers.adults || plan.travelers.children) && (
              <PlanSection icon={Users} title="Туристи" delay={0.2}>
                <p className="text-white/90 text-sm">
                  {plan.travelers.adults ? `${plan.travelers.adults} дорослих` : ""}
                  {plan.travelers.adults && plan.travelers.children ? ", " : ""}
                  {plan.travelers.children
                    ? `${plan.travelers.children} дітей${
                        plan.travelers.childrenAges?.length
                          ? ` (${plan.travelers.childrenAges.join(", ")} р.)`
                          : ""
                      }`
                    : ""}
                </p>
              </PlanSection>
            )}

            {/* Budget */}
            {plan.budget?.amount && (
              <PlanSection icon={Wallet} title="Бюджет" delay={0.25}>
                <p className="text-white/90 text-sm">
                  {plan.budget.amount} {plan.budget.currency || "USD"}
                  <span className="text-white/40 ml-1">
                    {plan.budget.perPerson ? "на людину" : "загалом"}
                  </span>
                </p>
              </PlanSection>
            )}

            {/* Hotel */}
            {plan.hotel && (plan.hotel.stars || plan.hotel.mealPlan) && (
              <PlanSection icon={Hotel} title="Готель" delay={0.3}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {plan.hotel.stars && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs">
                        <Star className="w-3 h-3" />
                        {plan.hotel.stars}
                      </span>
                    )}
                    {plan.hotel.mealPlan && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs">
                        <Utensils className="w-3 h-3" />
                        {plan.hotel.mealPlan}
                      </span>
                    )}
                  </div>
                  {plan.hotel.preferences?.length ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {plan.hotel.preferences.map((pref) => (
                        <span
                          key={pref}
                          className="px-2 py-0.5 bg-white/5 border border-white/8 rounded-lg text-white/60 text-xs"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </PlanSection>
            )}

            {/* Activities */}
            {plan.activities?.length ? (
              <PlanSection icon={Sparkles} title="Активності" delay={0.35}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.activities.map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 px-3 py-2 bg-white/3 border border-white/6 rounded-xl"
                    >
                      <span className="text-base shrink-0 mt-0.5">{activity.icon}</span>
                      <div className="min-w-0">
                        <p className="text-white/90 text-xs font-medium">{activity.name}</p>
                        <p className="text-white/40 text-xs leading-snug">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </PlanSection>
            ) : null}
          </div>

          {/* Recommendations */}
          {plan.recommendations?.length ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="h-px bg-linear-to-r from-white/6 via-white/10 to-transparent my-2" />
              <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                Рекомендовані напрямки
              </p>
              <div className="space-y-2.5">
                {plan.recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.45 + i * 0.1 }}
                    className="px-4 py-3 bg-white/3 border border-white/6 rounded-xl hover:border-accent/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold">{rec.destination}</p>
                        <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{rec.reason}</p>
                      </div>
                      {rec.estimatedCost && (
                        <span className="text-accent text-xs font-medium whitespace-nowrap shrink-0">
                          {rec.estimatedCost}
                        </span>
                      )}
                    </div>
                    {rec.highlights?.length ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {rec.highlights.map((h) => (
                          <span
                            key={h}
                            className="px-2 py-0.5 bg-accent/8 border border-accent/15 rounded-lg text-accent/80 text-xs"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : null}

          {/* Notes */}
          {plan.notes && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-white/35 text-xs italic leading-relaxed"
            >
              📝 {plan.notes}
            </motion.p>
          )}

          {/* CTA — Book with manager */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="pt-2"
          >
            <div className="h-px bg-linear-to-r from-transparent via-accent/20 to-transparent mb-4" />
            <Link
              href={contactUrl}
              className="group flex items-center justify-center gap-2.5 w-full py-3.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold text-sm shadow-lg shadow-accent/25 hover:shadow-accent/35 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            >
              <Send className="w-4 h-4" />
              Забронювати з менеджером
              <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <p className="text-center text-white/25 text-xs mt-2">
              Форму буде заповнено автоматично з деталями вашого плану
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
