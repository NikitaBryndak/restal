"use client";

import { useEffect, useState } from "react";
import { Plane, Clock, PartyPopper, CheckCircle2 } from "lucide-react";

type TripCountdownProps = {
    tripStartDate: string; // dd/mm/yyyy
    tripEndDate: string;   // dd/mm/yyyy
    status: string;
};

function parseDDMMYYYY(dateStr: string): Date | null {
    const parts = dateStr.split("/").map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [day, month, year] = parts;
    return new Date(year, month - 1, day);
}

export default function TripCountdown({ tripStartDate, tripEndDate, status }: TripCountdownProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60_000); // update every minute
        return () => clearInterval(interval);
    }, []);

    const start = parseDDMMYYYY(tripStartDate);
    const end = parseDDMMYYYY(tripEndDate);

    if (!start || !end) return null;

    // Already completed / archived
    if (status === "Completed" || status === "Archived") {
        return (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 h-full flex items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <p className="text-base font-semibold text-white">Подорож завершена</p>
                        <p className="text-sm text-white/50">Дякуємо, що подорожували з RestAL!</p>
                    </div>
                </div>
            </div>
        );
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const msPerDay = 86_400_000;

    // Currently on the trip
    if (todayStart >= startDay && todayStart <= endDay) {
        const daysLeft = Math.ceil((endDay.getTime() - todayStart.getTime()) / msPerDay);
        return (
            <div className="bg-linear-to-r from-purple-500/15 to-accent/15 backdrop-blur-md rounded-xl p-6 border border-purple-400/30 h-full flex items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
                        <PartyPopper className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-base font-semibold text-white">Ви зараз у подорожі! 🎉</p>
                        <p className="text-sm text-white/60">
                            {daysLeft === 0
                                ? "Останній день подорожі"
                                : `Залишилось ${daysLeft} ${daysLeft === 1 ? "день" : daysLeft < 5 ? "дні" : "днів"} відпочинку`}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Trip already ended but status not yet updated
    if (todayStart > endDay) {
        return null;
    }

    // Upcoming trip — countdown
    const daysUntil = Math.ceil((startDay.getTime() - todayStart.getTime()) / msPerDay);

    // Compute hours/minutes remaining for the current day
    const msRemaining = startDay.getTime() - now.getTime();
    const totalHours = Math.floor(msRemaining / 3_600_000);
    const totalMinutes = Math.floor((msRemaining % 3_600_000) / 60_000);

    const dayWord = daysUntil === 1 ? "день" : daysUntil < 5 ? "дні" : "днів";

    // Color intensity based on proximity
    const isClose = daysUntil <= 7;
    const borderColor = isClose ? "border-accent/40" : "border-white/10";
    const bgGradient = isClose
        ? "bg-linear-to-r from-accent/15 to-blue-500/10"
        : "bg-white/10";

    return (
        <div className={`${bgGradient} backdrop-blur-md rounded-xl p-6 border ${borderColor} h-full flex items-center`}>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isClose ? "bg-accent/20 animate-pulse" : "bg-blue-500/20"}`}>
                        <Plane className={`w-6 h-6 ${isClose ? "text-accent" : "text-blue-400"}`} />
                    </div>
                    <div>
                        <p className="text-base font-semibold text-white">До подорожі</p>
                        <p className="text-sm text-white/50 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {totalHours} год {totalMinutes} хв
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-5xl font-bold ${isClose ? "text-accent" : "text-white"}`}>
                        {daysUntil}
                    </p>
                    <p className="text-sm text-white/50">{dayWord}</p>
                </div>
            </div>
            {isClose && (
                <p className="text-xs text-accent/70 mt-3 text-center">
                    ✨ Не забудьте зібрати валізу!
                </p>
            )}
        </div>
    );
}
