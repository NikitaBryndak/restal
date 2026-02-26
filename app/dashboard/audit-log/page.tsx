"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import {
    ScrollText, ChevronLeft, ChevronRight, Filter,
    Loader2, User, Plane, FileText, Tag, MessageCircle,
    Bell, File, Settings, Calendar, Search
} from "lucide-react";

type AuditEntry = {
    _id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    userPhone: string;
    userName: string;
    details: Record<string, unknown>;
    ip: string;
    createdAt: string;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

const ENTITY_TYPES = [
    { value: "", label: "Всі типи" },
    { value: "trip", label: "Тури" },
    { value: "user", label: "Користувачі" },
    { value: "article", label: "Статті" },
    { value: "promo-code", label: "Промокоди" },
    { value: "contact-request", label: "Запити" },
    { value: "notification", label: "Сповіщення" },
    { value: "document", label: "Документи" },
    { value: "system", label: "Система" },
];

const ENTITY_ICONS: Record<string, typeof Plane> = {
    trip: Plane,
    user: User,
    article: FileText,
    "promo-code": Tag,
    "contact-request": MessageCircle,
    notification: Bell,
    document: File,
    system: Settings,
};

const ENTITY_COLORS: Record<string, string> = {
    trip: "text-accent bg-accent/10",
    user: "text-blue-400 bg-blue-500/10",
    article: "text-purple-400 bg-purple-500/10",
    "promo-code": "text-emerald-400 bg-emerald-500/10",
    "contact-request": "text-amber-400 bg-amber-500/10",
    notification: "text-cyan-400 bg-cyan-500/10",
    document: "text-orange-400 bg-orange-500/10",
    system: "text-red-400 bg-red-500/10",
};

export default function AuditLogPage() {
    const { data: session, status } = useSession({ required: true });
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);

    // Filters
    const [entityType, setEntityType] = useState("");
    const [actionSearch, setActionSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const isAdmin = (session?.user?.privilegeLevel ?? 1) >= ADMIN_PRIVILEGE_LEVEL;

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", "50");
            if (entityType) params.set("entityType", entityType);
            if (actionSearch) params.set("action", actionSearch);
            if (dateFrom) params.set("from", dateFrom);
            if (dateTo) params.set("to", dateTo);

            const res = await fetch(`/api/audit-log?${params}`);
            const data = await res.json();
            if (data.logs) {
                setLogs(data.logs);
                setPagination(data.pagination);
            }
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, [entityType, actionSearch, dateFrom, dateTo]);

    useEffect(() => {
        if (status !== "authenticated" || !isAdmin) return;
        fetchLogs(1);
    }, [status, isAdmin, fetchLogs]);

    if (status === "loading") {
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

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString("uk-UA", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    const formatDetails = (details: Record<string, unknown>) => {
        const entries = Object.entries(details);
        if (entries.length === 0) return null;
        return entries
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
            .join(" · ");
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                            <ScrollText className="w-5 h-5 text-accent" />
                        </div>
                        Журнал дій
                    </h1>
                    <p className="text-white/40 text-sm mt-1">
                        {pagination.total} записів
                    </p>
                </div>
                <button
                    onClick={() => setFilterOpen((p) => !p)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-sm cursor-pointer ${
                        filterOpen ? "bg-accent/10 border-accent/30 text-accent" : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    Фільтри
                </button>
            </div>

            {/* Filters */}
            {filterOpen && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs text-white/40 mb-1 block">Тип</label>
                        <select
                            value={entityType}
                            onChange={(e) => setEntityType(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
                        >
                            {ENTITY_TYPES.map((t) => (
                                <option key={t.value} value={t.value} className="bg-neutral-900">{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-white/40 mb-1 block">Дія</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                            <input
                                value={actionSearch}
                                onChange={(e) => setActionSearch(e.target.value)}
                                placeholder="Пошук..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-white/40 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Від
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> До
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
                        />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-3">
                        <button
                            onClick={() => { setEntityType(""); setActionSearch(""); setDateFrom(""); setDateTo(""); }}
                            className="text-sm text-white/40 hover:text-white transition-colors cursor-pointer"
                        >
                            Скинути
                        </button>
                        <button
                            onClick={() => fetchLogs(1)}
                            className="px-4 py-2 bg-accent/20 text-accent rounded-lg text-sm hover:bg-accent/30 transition-colors cursor-pointer"
                        >
                            Застосувати
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-20 text-white/30 text-sm">
                        Немає записів
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {logs.map((log) => {
                            const Icon = ENTITY_ICONS[log.entityType] ?? Settings;
                            const colorClass = ENTITY_COLORS[log.entityType] ?? "text-white/50 bg-white/5";
                            const detailStr = formatDetails(log.details);

                            return (
                                <div key={log._id} className="flex items-start gap-4 p-4 hover:bg-white/2 transition-colors">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium text-white">{log.action}</span>
                                            {log.entityId && (
                                                <span className="text-xs text-white/20 font-mono">#{log.entityId.slice(-6)}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-white/30 mt-1">
                                            <span>{log.userName || log.userPhone || log.userId.slice(-6)}</span>
                                            <span>·</span>
                                            <span>{formatDate(log.createdAt)}</span>
                                            {log.ip && (
                                                <>
                                                    <span>·</span>
                                                    <span className="font-mono">{log.ip}</span>
                                                </>
                                            )}
                                        </div>
                                        {detailStr && (
                                            <p className="text-xs text-white/20 mt-1 truncate">{detailStr}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => fetchLogs(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-white/40">
                        {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => fetchLogs(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
