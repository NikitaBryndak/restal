"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const STAGES = [
    { key: "In Booking", label: "Бронювання", icon: "📋" },
    { key: "Booked", label: "Заброньовано", icon: "✅" },
    { key: "Paid", label: "Оплачено", icon: "💳" },
    { key: "In Progress", label: "У подорожі", icon: "✈️" },
    { key: "Completed", label: "Завершено", icon: "🏆" },
    { key: "Archived", label: "Архів", icon: "📁" },
] as const;

type TripTimelineProps = {
    status: string;
};

export default function TripTimeline({ status }: TripTimelineProps) {
    const currentIndex = STAGES.findIndex((s) => s.key === status);
    const isTerminal = status === "Completed" || status === "Archived";

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
            <p className="text-sm font-semibold text-white mb-4">Прогрес подорожі</p>
            <div className="flex items-center gap-0">
                {STAGES.map((stage, i) => {
                    const isPast = i < currentIndex;
                    const isCurrent = i === currentIndex;
                    const isFuture = i > currentIndex;

                    return (
                        <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                            {/* Node */}
                            <div className="flex flex-col items-center relative group">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                                        isPast || (isCurrent && isTerminal)
                                            ? "bg-green-500/30 border-2 border-green-400"
                                            : isCurrent
                                            ? "bg-accent/30 border-2 border-accent animate-pulse"
                                            : "bg-white/5 border border-white/20"
                                    }`}
                                >
                                    {isPast || (isCurrent && isTerminal) ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    ) : isCurrent ? (
                                        <Loader2 className="w-4 h-4 text-accent animate-spin" />
                                    ) : (
                                        <Circle className="w-3 h-3 text-white/30" />
                                    )}
                                </div>
                                {/* Label — visible on hover or for current */}
                                <span
                                    className={`absolute -bottom-6 text-[10px] whitespace-nowrap transition-opacity ${
                                        isCurrent && isTerminal
                                            ? "text-green-400 font-semibold opacity-100"
                                            : isCurrent
                                            ? "text-accent font-semibold opacity-100"
                                            : isPast
                                            ? "text-green-400/70 opacity-0 group-hover:opacity-100"
                                            : "text-white/40 opacity-0 group-hover:opacity-100"
                                    }`}
                                >
                                    {stage.label}
                                </span>
                            </div>
                            {/* Connector line */}
                            {i < STAGES.length - 1 && (
                                <div
                                    className={`h-0.5 flex-1 mx-1 rounded-full transition-colors ${
                                        i < currentIndex || (isTerminal && i === currentIndex - 1)
                                            ? "bg-green-400/50"
                                            : "bg-white/10"
                                    }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Current status label (always visible) */}
            <p className="text-xs text-white/50 mt-8 text-center">
                Поточний статус: <span className={isTerminal ? "text-green-400 font-medium" : "text-accent font-medium"}>{STAGES[currentIndex]?.label ?? status}</span>
            </p>
        </div>
    );
}
