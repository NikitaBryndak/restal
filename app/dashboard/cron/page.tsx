"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw, Loader2, TimerReset } from "lucide-react";

interface CronRun {
    _id: string;
    job: string;
    status: "success" | "error";
    summary: Record<string, unknown>;
    errors: string[];
    durationMs: number;
    createdAt: string;
}

const JOB_LABELS: Record<string, string> = {
    "auto-status": "Авто-статуси подорожей",
    "process-cashback": "Облік кешбеку",
    "promo-maintenance": "Обслуговування промокодів",
};

export default function CronPage() {
    const { data: session, status } = useSession();
    const [runs, setRuns] = useState<CronRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/cron-runs");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setRuns(data.runs ?? []);
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Помилка завантаження");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") load();
        else setLoading(false);
    }, [status, load]);

    if (!session) {
        return (
            <div className="flex items-center justify-center h-64 text-white/50">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Завантаження...
            </div>
        );
    }

    const errorCount = runs.filter((r) => r.status === "error" || r.errors.length > 0).length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <TimerReset className="w-5 h-5 text-blue-400" />
                        Cron-завдання
                    </h1>
                    <p className="text-sm text-white/40 mt-1">
                        Останні 50 запусків · {runs.length > 0 && errorCount > 0 ? (
                            <span className="text-red-400">{errorCount} з помилками</span>
                        ) : runs.length > 0 ? "помилок немає" : ""}
                    </p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Оновити
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
                    Не вдалося завантажити історію запусків: {error}
                </div>
            )}

            {!loading && runs.length === 0 && !error && (
                <div className="bg-white/5 rounded-xl p-8 text-center text-white/40">
                    Запусків ще не було. Cron-завдання починають логуватися після першого виклику.
                </div>
            )}

            {runs.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-white/5 text-left text-white/50 text-xs uppercase tracking-wider">
                                <th className="px-4 py-3">Час</th>
                                <th className="px-4 py-3">Завдання</th>
                                <th className="px-4 py-3">Статус</th>
                                <th className="px-4 py-3">Тривалість</th>
                                <th className="px-4 py-3">Результати</th>
                            </tr>
                        </thead>
                        <tbody>
                            {runs.map((run) => (
                                <RunRow key={run._id} run={run} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function RunRow({ run }: { run: CronRun }) {
    const hasErrors = run.status === "error" || run.errors.length > 0;
    const summaryEntries = Object.entries(run.summary ?? {}).filter(([, v]) => typeof v === "number");

    return (
        <tr className="border-t border-white/5 hover:bg-white/[0.03]">
            <td className="px-4 py-3 text-white/60 whitespace-nowrap">
                {new Date(run.createdAt).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "medium" })}
            </td>
            <td className="px-4 py-3 text-white font-medium">{JOB_LABELS[run.job] ?? run.job}</td>
            <td className="px-4 py-3">
                {hasErrors ? (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-semibold">
                        помилки
                    </span>
                ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                        успіх
                    </span>
                )}
            </td>
            <td className="px-4 py-3 text-white/60 whitespace-nowrap">{run.durationMs} мс</td>
            <td className="px-4 py-3 text-white/50">
                {summaryEntries.length > 0 && (
                    <span>{summaryEntries.map(([k, v]) => `${k}: ${v}`).join(" · ")}</span>
                )}
                {run.errors.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                        {run.errors.slice(0, 3).map((e, i) => (
                            <li key={i} className="text-red-400 text-xs break-all">{e}</li>
                        ))}
                        {run.errors.length > 3 && (
                            <li className="text-white/30 text-xs">… ще {run.errors.length - 3}</li>
                        )}
                    </ul>
                )}
            </td>
        </tr>
    );
}
