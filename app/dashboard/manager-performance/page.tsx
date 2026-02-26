"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import {
    Users, TrendingUp, Award, DollarSign, BarChart3,
    Globe, Activity, ArrowUp, ArrowDown, Minus, Loader2
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from "recharts";

type ManagerStat = {
    name: string;
    phone: string;
    isAdmin: boolean;
    totalTrips: number;
    completedTrips: number;
    activeTrips: number;
    totalRevenue: number;
    totalPaid: number;
    conversionRate: number;
    avgDealSize: number;
    statusBreakdown: Record<string, number>;
    topCountries: { country: string; count: number }[];
    monthlyTrend: { month: string; count: number; revenue: number }[];
};

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

export default function ManagerPerformancePage() {
    const { data: session, status } = useSession({ required: true });
    const [managers, setManagers] = useState<ManagerStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedManager, setSelectedManager] = useState<string | null>(null);

    const isAdmin = (session?.user?.privilegeLevel ?? 1) >= ADMIN_PRIVILEGE_LEVEL;

    useEffect(() => {
        if (status !== "authenticated" || !isAdmin) return;

        fetch("/api/analytics/managers")
            .then((r) => r.json())
            .then((data) => {
                if (data.managers) {
                    setManagers(data.managers);
                    if (data.managers.length > 0) {
                        setSelectedManager(data.managers[0].phone);
                    }
                } else {
                    setError("Не вдалося завантажити дані");
                }
            })
            .catch(() => setError("Помилка з'єднання"))
            .finally(() => setLoading(false));
    }, [status, isAdmin]);

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-white/50">Доступ заборонено</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    const selected = managers.find((m) => m.phone === selectedManager);

    // Summary totals
    const totalTrips = managers.reduce((s, m) => s + m.totalTrips, 0);
    const totalRevenue = managers.reduce((s, m) => s + m.totalRevenue, 0);
    const avgConversion = managers.length > 0
        ? Math.round(managers.reduce((s, m) => s + m.conversionRate, 0) / managers.length)
        : 0;

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(n);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Award className="w-5 h-5 text-accent" />
                    </div>
                    Ефективність менеджерів
                </h1>
                <p className="text-white/40 text-sm mt-1">Аналітика продуктивності команди</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                        <Users className="w-4 h-4" />
                        Менеджерів
                    </div>
                    <p className="text-2xl font-bold text-white">{managers.length}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                        <BarChart3 className="w-4 h-4" />
                        Всього турів
                    </div>
                    <p className="text-2xl font-bold text-white">{totalTrips}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                        <DollarSign className="w-4 h-4" />
                        Загальна виручка
                    </div>
                    <p className="text-2xl font-bold text-accent">{formatCurrency(totalRevenue)}</p>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-5 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent" />
                        Рейтинг менеджерів
                    </h2>
                </div>
                <div className="divide-y divide-white/5">
                    {managers.map((m, i) => {
                        const isSelected = m.phone === selectedManager;
                        return (
                            <button
                                key={m.phone}
                                onClick={() => setSelectedManager(m.phone)}
                                className={`w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left cursor-pointer ${isSelected ? "bg-accent/5 border-l-2 border-accent" : ""}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                    i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                                    i === 1 ? "bg-gray-400/20 text-gray-300" :
                                    i === 2 ? "bg-orange-500/20 text-orange-400" :
                                    "bg-white/5 text-white/30"
                                }`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">
                                        {m.name}
                                        {m.isAdmin && <span className="ml-2 text-xs text-accent">admin</span>}
                                    </p>
                                    <p className="text-xs text-white/30">{m.totalTrips} турів</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-white">{formatCurrency(m.totalRevenue)}</p>
                                    <div className="flex items-center gap-1 text-xs">
                                        {m.conversionRate >= 70 ? (
                                            <ArrowUp className="w-3 h-3 text-green-400" />
                                        ) : m.conversionRate >= 40 ? (
                                            <Minus className="w-3 h-3 text-yellow-400" />
                                        ) : (
                                            <ArrowDown className="w-3 h-3 text-red-400" />
                                        )}
                                        <span className={
                                            m.conversionRate >= 70 ? "text-green-400" :
                                            m.conversionRate >= 40 ? "text-yellow-400" : "text-red-400"
                                        }>
                                            {m.conversionRate}% конверсія
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Manager Detail */}
            {selected && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Stats grid */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">{selected.name}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-white/40">Активні тури</p>
                                <p className="text-xl font-bold text-blue-400">{selected.activeTrips}</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/40">Завершені</p>
                                <p className="text-xl font-bold text-green-400">{selected.completedTrips}</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/40">Середній чек</p>
                                <p className="text-xl font-bold text-accent">{formatCurrency(selected.avgDealSize)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/40">Оплачено</p>
                                <p className="text-xl font-bold text-emerald-400">{formatCurrency(selected.totalPaid)}</p>
                            </div>
                        </div>

                        {/* Top countries */}
                        {selected.topCountries.length > 0 && (
                            <div className="mt-6">
                                <p className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    Топ напрямки
                                </p>
                                <div className="space-y-2">
                                    {selected.topCountries.map((c, i) => (
                                        <div key={c.country} className="flex items-center gap-3">
                                            <span className="text-sm w-20 truncate text-white/70">{c.country}</span>
                                            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${(c.count / selected.totalTrips) * 100}%`,
                                                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-white/40 w-6 text-right">{c.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Monthly chart */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-accent" />
                            Тренд по місяцях (тури)
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={selected.monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                                    />
                                    <YAxis
                                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "rgba(0,0,0,0.9)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "8px",
                                            color: "white",
                                            fontSize: "12px",
                                        }}
                                        formatter={(value, name) => [
                                            name === "count" ? value : formatCurrency(Number(value)),
                                            name === "count" ? "Тури" : "Виручка",
                                        ]}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {selected.monthlyTrend.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[0]} fillOpacity={0.7} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
