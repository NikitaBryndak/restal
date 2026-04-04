'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AnalyticsSkeleton } from '@/components/ui/skeleton';
import { TOUR_STATUS_LABELS } from '@/types';
import type { TourStatus } from '@/types';
import {
    BarChart3, Users, Map, DollarSign,
    TrendingUp, MessageCircle, RefreshCw,
    Plane, Award, CreditCard, Clock,
    Download, ArrowUpRight, ArrowDownRight,
    Filter, CheckCircle2, Percent, Gift, UserCheck,
    Wallet, Search, Phone, ArrowUpDown,
} from 'lucide-react';
import {
    ADMIN_PRIVILEGE_LEVEL,
    TOUR_STATUS_COLORS,
    PIE_COLORS,
    PERIOD_OPTIONS,
} from '@/config/constants';
import type { Period } from '@/config/constants';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
    AreaChart, Area, Legend, LineChart, Line,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ──────────────────────────────────────────────────────────

interface AnalyticsData {
    period: Period;
    overview: {
        totalTrips: number;
        totalUsers: number;
        totalContactRequests: number;
        newContactRequests: number;
        totalRevenue: number;
        totalPaid: number;
        totalCashback: number;
        avgTripValue: number;
        outstandingPayments: number;
        collectionRate: number;
        avgResponseTimeMinutes: number | null;
        respondedCount: number;
        totalCashbackUsed: number;
        cashbackUsedCount: number;
        totalTourists: number;
    };
    comparison: {
        trips: number | null;
        users: number | null;
        contactRequests: number | null;
        revenue: number | null;
        paid: number | null;
        avgTripValue: number | null;
        tourists: number | null;
    } | null;
    tripsByStatus: { _id: string; count: number }[];
    tripsByCountry: { _id: string; count: number }[];
    tripsOverTime: { month: string; count: number; revenue: number; paid: number }[];
    userGrowth: { month: string; count: number }[];
    touristsOverTime: { month: string; tourists: number }[];
    recentTrips: {
        _id: string;
        number: string;
        country: string;
        status: string;
        payment: { totalAmount: number; paidAmount: number };
        tripStartDate: string;
        managerName?: string;
        createdAt: string;
    }[];
    topManagers: { _id: string; tripCount: number; totalRevenue: number; totalPaid: number }[];
    conversionFunnel: { status: string; count: number; revenue: number }[];
}

// STATUS_COLORS, PIE_COLORS, PERIOD_OPTIONS, Period — imported from @/config/constants

interface RequestsData {
    period: string;
    total: number;
    comparison: number | null;
    bySource: { _id: string; count: number }[];
    byStatus: { _id: string; count: number }[];
    sourceStatus: { source: string; new: number; in_progress: number; completed: number; dismissed: number; total: number }[];
    overTime: { month: string; contact: number; manager: number; tour: number; 'ai-trip-plan': number; total: number }[];
    responseTimeBySource: { source: string; avgMinutes: number; count: number }[];
}

const SOURCE_LABELS: Record<string, string> = {
    contact: 'Контактна форма',
    manager: 'Консультація менеджера',
    tour: 'Сторінка туру',
    'ai-trip-plan': 'AI підбір туру',
};

const SOURCE_COLORS: Record<string, string> = {
    contact: '#0fa4e6',
    manager: '#8b5cf6',
    tour: '#10b981',
    'ai-trip-plan': '#f59e0b',
};

const STATUS_LABELS_REQUESTS: Record<string, string> = {
    new: 'Новий',
    in_progress: 'В роботі',
    completed: 'Завершений',
    dismissed: 'Відхилений',
};

const STATUS_COLORS_REQUESTS: Record<string, string> = {
    new: '#0fa4e6',
    in_progress: '#f59e0b',
    completed: '#10b981',
    dismissed: '#ef4444',
};

interface BonusUser {
    phoneNumber: string;
    name: string;
    balance: number;
    totalAccrued: number;
    accruedFromTrips: number;
    referralBonus: number;
    totalUsed: number;
    usedCount: number;
    tripCashbackCount: number;
    createdAt: string;
}

interface BonusData {
    date: string;
    totals: {
        balance: number;
        accrued: number;
        used: number;
        userCount: number;
    };
    users: BonusUser[];
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(value) + ' ₴';
}

function formatCompact(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ₴`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k ₴`;
    return `${value} ₴`;
}

// ─── Components ─────────────────────────────────────────────────────

function ChangeIndicator({ value }: { value: number | null | undefined }) {
    if (value === null || value === undefined) return null;
    const isPositive = value >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${isPositive
            ? 'text-emerald-400 bg-emerald-400/10'
            : 'text-red-400 bg-red-400/10'
            }`}>
            {isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(value)}%
        </span>
    );
}

function StatCard({ icon: Icon, label, value, subValue, color, change, delay = 0 }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subValue?: string;
    color?: string;
    change?: number | null;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            className="group bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-xl p-4 sm:p-5 flex flex-col gap-2 transition-all duration-300"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-secondary text-sm">
                    <div className={`p-1.5 rounded-lg bg-white/5 ${color ? '' : 'text-accent'}`}>
                        <Icon size={14} className={color || 'text-accent'} />
                    </div>
                    {label}
                </div>
                <ChangeIndicator value={change} />
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{value}</div>
            {subValue && <div className="text-xs text-secondary">{subValue}</div>}
        </motion.div>
    );
}

function ProgressBar({ value, label, color = '#0fa4e6' }: { value: number; label: string; color?: string }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">{label}</span>
                <span className="text-white font-medium">{value}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(value, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                />
            </div>
        </div>
    );
}

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
    return (
        <div className="flex items-center gap-1 bg-white/3 border border-white/8 rounded-xl p-1">
            {PERIOD_OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-200 ${value === opt.value
                        ? 'bg-accent text-white shadow-sm shadow-accent/20'
                        : 'text-secondary hover:text-white hover:bg-white/5'
                        }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#111]/95 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3 text-sm shadow-xl">
            <p className="text-white font-medium mb-1.5">{label}</p>
            {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
                <p key={i} style={{ color: entry.color }} className="text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-secondary">{entry.name}:</span>
                    <span className="font-medium" style={{ color: entry.color }}>
                        {typeof entry.value === 'number' && (entry.name.toLowerCase().includes('дохід') || entry.name.toLowerCase().includes('оплачено'))
                            ? formatCurrency(entry.value)
                            : entry.value}
                    </span>
                </p>
            ))}
        </div>
    );
}

function ChartCard({ title, icon: Icon, children, className = '' }: {
    title: string;
    icon?: React.ElementType;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`bg-white/3 border border-white/8 rounded-xl p-4 sm:p-6 ${className}`}
        >
            <h2 className="text-sm font-medium text-secondary mb-4 flex items-center gap-2">
                {Icon && <Icon size={14} className="text-accent" />}
                {title}
            </h2>
            {children}
        </motion.div>
    );
}

function ConversionFunnel({ data }: { data: AnalyticsData['conversionFunnel'] }) {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    if (total === 0) return <p className="text-secondary text-sm text-center py-8">Немає даних</p>;

    return (
        <div className="space-y-2.5">
            {data.filter(d => d.count > 0).map((item, i) => {
                const percentage = Math.round((item.count / total) * 100);
                const statusLabel = TOUR_STATUS_LABELS[item.status as TourStatus] || item.status;
                const color = TOUR_STATUS_COLORS[item.status] || '#6b7280';
                return (
                    <motion.div
                        key={item.status}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="group"
                    >
                        <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-secondary group-hover:text-white transition-colors">{statusLabel}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-white font-medium">{item.count}</span>
                                <span className="text-secondary text-[10px] w-8 text-right">{percentage}%</span>
                            </div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: color }}
                            />
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

function ExportCSV({ data }: { data: AnalyticsData }) {
    const handleExport = useCallback(() => {
        const rows: string[][] = [];

        // Overview
        rows.push(['--- Огляд ---']);
        rows.push(['Метрика', 'Значення']);
        rows.push(['Всього подорожей', String(data.overview.totalTrips)]);
        rows.push(['Туристів', String(data.overview.totalTourists)]);
        rows.push(['Користувачі', String(data.overview.totalUsers)]);
        rows.push(['Загальний дохід', String(data.overview.totalRevenue)]);
        rows.push(['Оплачено', String(data.overview.totalPaid)]);
        rows.push(['Середній чек', String(data.overview.avgTripValue)]);
        rows.push(['Кешбек видано', String(data.overview.totalCashback)]);
        rows.push(['Кешбек використано', String(data.overview.totalCashbackUsed)]);
        rows.push(['Запити', String(data.overview.totalContactRequests)]);
        rows.push(['Заборгованість', String(data.overview.outstandingPayments)]);
        rows.push([]);

        // Trips over time
        rows.push(['--- Подорожі за місяцями ---']);
        rows.push(['Місяць', 'Кількість', 'Дохід', 'Оплачено']);
        data.tripsOverTime.forEach((t) => rows.push([t.month, String(t.count), String(t.revenue), String(t.paid)]));
        rows.push([]);

        // By country
        rows.push(['--- Топ напрямки ---']);
        rows.push(['Країна', 'Кількість']);
        data.tripsByCountry.forEach((c) => rows.push([c._id || 'Невідомо', String(c.count)]));
        rows.push([]);

        // Top managers
        rows.push(['--- Топ менеджери ---']);
        rows.push(['Менеджер', 'Подорожей', 'Дохід']);
        data.topManagers.forEach((m) => rows.push([m._id || 'Без імені', String(m.tripCount), String(m.totalRevenue)]));
        rows.push([]);

        // Recent trips
        rows.push(['--- Останні подорожі ---']);
        rows.push(['Номер', 'Країна', 'Статус', 'Сума', 'Оплачено', 'Менеджер', 'Створено']);
        data.recentTrips.forEach((t) => rows.push([
            t.number, t.country, t.status,
            String(t.payment.totalAmount), String(t.payment.paidAmount),
            t.managerName || '', new Date(t.createdAt).toLocaleDateString('uk-UA'),
        ]));

        const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${data.period}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [data]);

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 text-xs bg-white/3 border border-white/8 rounded-xl px-3 py-2 text-secondary hover:text-white hover:bg-white/6 transition-all duration-200"
            title="Експортувати CSV"
        >
            <Download size={13} />
            <span className="hidden sm:inline">Експорт</span>
        </button>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const { userProfile, loading: profileLoading } = useUserProfile();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState<Period>('all');
    const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'users' | 'requests' | 'bonuses'>('overview');
    const [requestsData, setRequestsData] = useState<RequestsData | null>(null);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [bonusData, setBonusData] = useState<BonusData | null>(null);
    const [bonusLoading, setBonusLoading] = useState(false);
    const [bonusSearch, setBonusSearch] = useState('');
    const [bonusSortField, setBonusSortField] = useState<'balance' | 'totalAccrued' | 'totalUsed' | 'name'>('balance');
    const [bonusSortDir, setBonusSortDir] = useState<'asc' | 'desc'>('desc');

    const isAdmin = userProfile && userProfile.privilegeLevel >= ADMIN_PRIVILEGE_LEVEL;

    const fetchAnalytics = useCallback(async (p: Period = period) => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch(`/api/analytics?period=${p}`);
            if (!res.ok) throw new Error('Помилка завантаження');
            const json = await res.json();
            setData(json);
        } catch {
            setError('Не вдалося завантажити аналітику');
        } finally {
            setLoading(false);
        }
    }, [period]);

    const fetchRequests = useCallback(async (p: Period = period) => {
        try {
            setRequestsLoading(true);
            const res = await fetch(`/api/analytics/requests?period=${p}`);
            if (!res.ok) throw new Error('Помилка завантаження');
            const json = await res.json();
            setRequestsData(json);
        } catch {
            setError('Не вдалося завантажити дані запитів');
        } finally {
            setRequestsLoading(false);
        }
    }, [period]);

    const handlePeriodChange = useCallback((p: Period) => {
        setPeriod(p);
        fetchAnalytics(p);
        if (requestsData) fetchRequests(p);
    }, [fetchAnalytics, fetchRequests, requestsData]);

    const fetchBonuses = useCallback(async () => {
        try {
            setBonusLoading(true);
            const res = await fetch('/api/analytics/bonuses');
            if (!res.ok) throw new Error('Помилка завантаження');
            const json = await res.json();
            setBonusData(json);
        } catch {
            setError('Не вдалося завантажити дані бонусів');
        } finally {
            setBonusLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) fetchAnalytics();
    }, [isAdmin, fetchAnalytics]);

    if (profileLoading) {
        return <AnalyticsSkeleton />;
    }

    if (!isAdmin) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-5rem)]">
                <p className="text-secondary">Недостатньо прав для перегляду аналітики</p>
            </div>
        );
    }

    if (loading && !data) {
        return <AnalyticsSkeleton />;
    }

    if (error && !data) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-5rem)] gap-4">
                <p className="text-red-400">{error || 'Немає даних'}</p>
                <button
                    onClick={() => fetchAnalytics()}
                    className="flex items-center gap-2 text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-secondary hover:text-white hover:bg-white/10 transition-colors"
                >
                    <RefreshCw size={14} /> Спробувати знову
                </button>
            </div>
        );
    }

    if (!data) return null;

    const { overview, comparison, tripsByStatus, tripsByCountry, tripsOverTime, userGrowth, touristsOverTime, recentTrips, topManagers, conversionFunnel } = data;

    const statusChartData = tripsByStatus.map((s) => ({
        name: TOUR_STATUS_LABELS[s._id as TourStatus] || s._id,
        value: s.count,
        fill: TOUR_STATUS_COLORS[s._id] || '#6b7280',
    }));

    const countryChartData = tripsByCountry.map((c) => ({
        name: c._id || 'Невідомо',
        count: c.count,
    }));

    // Cumulative revenue data
    const cumulativeData = tripsOverTime.reduce<{ month: string; revenue: number; paid: number; cumRevenue: number; cumPaid: number }[]>((acc, item) => {
        const prev = acc.length > 0 ? acc[acc.length - 1] : { cumRevenue: 0, cumPaid: 0 };
        acc.push({
            month: item.month,
            revenue: item.revenue,
            paid: item.paid,
            cumRevenue: prev.cumRevenue + item.revenue,
            cumPaid: prev.cumPaid + item.paid,
        });
        return acc;
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-accent/10">
                            <BarChart3 size={22} className="text-accent" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-light text-white">Аналітика</h1>
                            <p className="text-xs text-secondary mt-0.5">
                                {period === 'all' ? 'Усі дані' : `Останні ${PERIOD_OPTIONS.find(o => o.value === period)?.label}`}
                                {loading && <span className="ml-2 text-accent">оновлюється…</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <ExportCSV data={data} />
                        <button
                            onClick={() => fetchAnalytics()}
                            disabled={loading}
                            className="flex items-center gap-2 text-xs bg-white/3 border border-white/8 rounded-xl px-3 py-2 text-secondary hover:text-white hover:bg-white/6 transition-all duration-200"
                        >
                            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Оновити</span>
                        </button>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-secondary">
                        <Filter size={12} />
                        Період:
                    </div>
                    <PeriodSelector value={period} onChange={handlePeriodChange} />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/3 border border-white/8 rounded-xl p-1 w-fit">
                {([
                    { id: 'overview' as const, label: 'Огляд', icon: BarChart3 },
                    { id: 'revenue' as const, label: 'Фінанси', icon: DollarSign },
                    { id: 'users' as const, label: 'Користувачі', icon: Users },
                    { id: 'requests' as const, label: 'Запити', icon: MessageCircle },
                    { id: 'bonuses' as const, label: 'Бонуси', icon: Wallet },
                ]).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            if (tab.id === 'requests' && !requestsData) fetchRequests();
                            if (tab.id === 'bonuses' && !bonusData) fetchBonuses();
                        }}
                        className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg transition-all duration-200 ${activeTab === tab.id
                            ? 'bg-white/8 text-white'
                            : 'text-secondary hover:text-white hover:bg-white/3'
                            }`}
                    >
                        <tab.icon size={13} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-6 sm:space-y-8"
                    >
                        {/* Overview Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <StatCard icon={Plane} label="Подорожей" value={overview.totalTrips} change={comparison?.trips} delay={0} />
                            <StatCard icon={UserCheck} label="Туристів" value={overview.totalTourists} change={comparison?.tourists} color="text-teal-400" delay={0.03} />
                            <StatCard icon={Users} label="Користувачі" value={overview.totalUsers} change={comparison?.users} delay={0.05} />
                            <StatCard
                                icon={DollarSign} label="Дохід"
                                value={formatCurrency(overview.totalRevenue)}
                                color="text-green-400" change={comparison?.revenue} delay={0.1}
                            />
                            <StatCard
                                icon={CreditCard} label="Оплачено"
                                value={formatCurrency(overview.totalPaid)}
                                subValue={overview.outstandingPayments > 0 ? `Борг: ${formatCurrency(overview.outstandingPayments)}` : undefined}
                                color="text-emerald-400" change={comparison?.paid} delay={0.15}
                            />
                            <StatCard
                                icon={TrendingUp} label="Середній чек"
                                value={formatCurrency(overview.avgTripValue)}
                                color="text-blue-400" change={comparison?.avgTripValue} delay={0.2}
                            />
                            <StatCard
                                icon={Award} label="Кешбек"
                                value={formatCurrency(overview.totalCashback)}
                                color="text-purple-400" delay={0.25}
                            />
                            <StatCard
                                icon={Gift} label="Кешбек використано"
                                value={formatCurrency(overview.totalCashbackUsed)}
                                subValue={overview.cashbackUsedCount > 0 ? `${overview.cashbackUsedCount} промокодів` : undefined}
                                color="text-pink-400" delay={0.28}
                            />
                            <StatCard
                                icon={MessageCircle} label="Запити"
                                value={overview.totalContactRequests}
                                subValue={`Нових за 7д: ${overview.newContactRequests}`}
                                color="text-yellow-400" change={comparison?.contactRequests} delay={0.3}
                            />
                            <StatCard
                                icon={Clock} label="Час відповіді"
                                value={overview.avgResponseTimeMinutes !== null
                                    ? overview.avgResponseTimeMinutes < 60
                                        ? `${overview.avgResponseTimeMinutes} хв`
                                        : overview.avgResponseTimeMinutes < 1440
                                            ? `${Math.round(overview.avgResponseTimeMinutes / 60)} год`
                                            : `${Math.round(overview.avgResponseTimeMinutes / 1440)} д`
                                    : 'Н/Д'}
                                subValue={overview.respondedCount > 0 ? `На основі ${overview.respondedCount} запитів` : 'Ще немає даних'}
                                color={overview.avgResponseTimeMinutes !== null && overview.avgResponseTimeMinutes <= 60 ? 'text-emerald-400' : 'text-orange-400'}
                                delay={0.35}
                            />
                            <StatCard
                                icon={Percent} label="Збір оплат"
                                value={`${overview.collectionRate}%`}
                                subValue={overview.collectionRate < 80 ? 'Потребує уваги' : 'Добре'}
                                color={overview.collectionRate >= 80 ? 'text-emerald-400' : 'text-amber-400'} delay={0.4}
                            />
                        </div>

                        {/* Collection Rate + Conversion Funnel */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <ChartCard title="Збір оплат" icon={CreditCard}>
                                <div className="space-y-6">
                                    <ProgressBar
                                        value={overview.collectionRate}
                                        label="Оплачено від загальної суми"
                                        color={overview.collectionRate >= 80 ? '#10b981' : overview.collectionRate >= 50 ? '#f59e0b' : '#ef4444'}
                                    />
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 bg-white/3 rounded-lg">
                                            <div className="text-lg font-semibold text-white">{formatCompact(overview.totalRevenue)}</div>
                                            <div className="text-[10px] text-secondary mt-1">Загальний дохід</div>
                                        </div>
                                        <div className="text-center p-3 bg-white/3 rounded-lg">
                                            <div className="text-lg font-semibold text-emerald-400">{formatCompact(overview.totalPaid)}</div>
                                            <div className="text-[10px] text-secondary mt-1">Оплачено</div>
                                        </div>
                                        <div className="text-center p-3 bg-white/3 rounded-lg">
                                            <div className="text-lg font-semibold text-red-400">{formatCompact(overview.outstandingPayments)}</div>
                                            <div className="text-[10px] text-secondary mt-1">Заборгованість</div>
                                        </div>
                                    </div>
                                </div>
                            </ChartCard>

                            <ChartCard title="Воронка статусів" icon={Filter}>
                                <ConversionFunnel data={conversionFunnel} />
                            </ChartCard>
                        </div>

                        {/* Charts Row 1 - Trips */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <ChartCard title="Подорожі за місяцями" icon={Plane}>
                                {tripsOverTime.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <AreaChart data={tripsOverTime}>
                                            <defs>
                                                <linearGradient id="tripsGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0fa4e6" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#0fa4e6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                            <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone" dataKey="count" name="Подорожей"
                                                stroke="#0fa4e6" fill="url(#tripsGradient)" strokeWidth={2}
                                                dot={{ r: 3, fill: '#0fa4e6', strokeWidth: 0 }}
                                                activeDot={{ r: 5, fill: '#0fa4e6', stroke: '#fff', strokeWidth: 2 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                                )}
                            </ChartCard>

                            {/* Trip Status Distribution */}
                            <ChartCard title="Статуси подорожей" icon={CheckCircle2}>
                                {statusChartData.length > 0 ? (
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie
                                                    data={statusChartData}
                                                    cx="50%" cy="50%"
                                                    innerRadius={55} outerRadius={90}
                                                    paddingAngle={3} dataKey="value"
                                                    animationBegin={0} animationDuration={800}
                                                >
                                                    {statusChartData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.fill} stroke="transparent" />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(17,17,17,0.95)',
                                                        border: '1px solid rgba(255,255,255,0.15)',
                                                        borderRadius: 12, fontSize: 12, backdropFilter: 'blur(8px)',
                                                        color: '#fff',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex flex-wrap sm:flex-col gap-2 text-xs">
                                            {statusChartData.map((s, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.fill }} />
                                                    <span className="text-secondary whitespace-nowrap">{s.name}</span>
                                                    <span className="text-white font-medium">{s.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                                )}
                            </ChartCard>
                        </div>

                        {/* Top Countries */}
                        <ChartCard title="Топ напрямки" icon={Map}>
                            {countryChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={Math.max(280, countryChartData.length * 35)}>
                                    <BarChart data={countryChartData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis type="number" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} />
                                        <YAxis dataKey="name" type="category" tick={{ fill: '#999', fontSize: 11 }} width={110} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="count" name="Подорожей" radius={[0, 6, 6, 0]} animationDuration={600}>
                                            {countryChartData.map((_, index) => (
                                                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                            )}
                        </ChartCard>

                        {/* Bottom Row: Recent Trips + Top Managers */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <ChartCard title="Останні подорожі" icon={Map}>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                    {recentTrips.length > 0 ? recentTrips.map((trip, i) => (
                                        <motion.div
                                            key={trip._id}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/3 border-b border-white/4 last:border-0 transition-colors"
                                        >
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-white font-medium truncate">#{trip.number}</span>
                                                    <span
                                                        className="text-[10px] px-1.5 py-0.5 rounded-full border shrink-0"
                                                        style={{
                                                            color: TOUR_STATUS_COLORS[trip.status] || '#6b7280',
                                                            borderColor: `${TOUR_STATUS_COLORS[trip.status] || '#6b7280'}40`,
                                                            backgroundColor: `${TOUR_STATUS_COLORS[trip.status] || '#6b7280'}10`,
                                                        }}
                                                    >
                                                        {TOUR_STATUS_LABELS[trip.status as TourStatus] || trip.status}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-secondary truncate">
                                                    {trip.country}{trip.managerName ? ` · ${trip.managerName}` : ''}
                                                </span>
                                            </div>
                                            <div className="text-right shrink-0 ml-3">
                                                <div className="text-sm text-white font-medium">{formatCurrency(trip.payment.totalAmount)}</div>
                                                <div className="text-[10px] text-secondary">
                                                    {new Date(trip.createdAt).toLocaleDateString('uk-UA')}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <p className="text-secondary text-sm text-center py-4">Немає подорожей</p>
                                    )}
                                </div>
                            </ChartCard>

                            <ChartCard title="Топ менеджери" icon={Award}>
                                <div className="space-y-2">
                                    {topManagers.length > 0 ? topManagers.map((mgr, index) => {
                                        const mgrCollectionRate = mgr.totalRevenue > 0 ? Math.round((mgr.totalPaid / mgr.totalRevenue) * 100) : 0;
                                        return (
                                            <motion.div
                                                key={mgr._id}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.06 }}
                                                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/3 border-b border-white/4 last:border-0 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${index === 0 ? 'bg-amber-500/20 text-amber-400' :
                                                        index === 1 ? 'bg-gray-400/20 text-gray-300' :
                                                            index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-white/5 text-secondary'
                                                        }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-white">{mgr._id || 'Без імені'}</span>
                                                        <span className="text-xs text-secondary">{mgr.tripCount} подорожей · збір {mgrCollectionRate}%</span>
                                                    </div>
                                                </div>
                                                <span className="text-sm text-green-400 font-medium">{formatCurrency(mgr.totalRevenue)}</span>
                                            </motion.div>
                                        );
                                    }) : (
                                        <p className="text-secondary text-sm text-center py-4">Немає даних</p>
                                    )}
                                </div>
                            </ChartCard>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'revenue' && (
                    <motion.div
                        key="revenue"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-6 sm:space-y-8"
                    >
                        {/* Revenue KPIs */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <StatCard icon={DollarSign} label="Загальний дохід" value={formatCurrency(overview.totalRevenue)} color="text-green-400" change={comparison?.revenue} />
                            <StatCard icon={CreditCard} label="Оплачено" value={formatCurrency(overview.totalPaid)} color="text-emerald-400" change={comparison?.paid} delay={0.05} />
                            <StatCard icon={TrendingUp} label="Середній чек" value={formatCurrency(overview.avgTripValue)} color="text-blue-400" change={comparison?.avgTripValue} delay={0.1} />
                            <StatCard icon={Clock} label="Заборгованість" value={formatCurrency(overview.outstandingPayments)} color="text-red-400" delay={0.15} />
                        </div>

                        {/* Revenue Over Time */}
                        <ChartCard title="Дохід та оплати за місяцями">
                            {tripsOverTime.length > 0 ? (
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={tripsOverTime}>
                                        <defs>
                                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#0fa4e6" stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#0fa4e6" stopOpacity={0.4} />
                                            </linearGradient>
                                            <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12, color: '#666' }} />
                                        <Bar dataKey="revenue" name="Дохід" fill="url(#revenueGrad)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="paid" name="Оплачено" fill="url(#paidGrad)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                            )}
                        </ChartCard>

                        {/* Cumulative Revenue */}
                        <ChartCard title="Кумулятивний дохід">
                            {cumulativeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={cumulativeData}>
                                        <defs>
                                            <linearGradient id="cumRevGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0fa4e6" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#0fa4e6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12, color: '#666' }} />
                                        <Line type="monotone" dataKey="cumRevenue" name="Кумулятивний дохід" stroke="#0fa4e6" strokeWidth={2.5} dot={false} />
                                        <Line type="monotone" dataKey="cumPaid" name="Кумулятивно оплачено" stroke="#10b981" strokeWidth={2.5} dot={false} strokeDasharray="5 3" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                            )}
                        </ChartCard>

                        {/* Payment Collection Rate */}
                        <ChartCard title="Аналіз оплат" icon={CreditCard}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <ProgressBar
                                        value={overview.collectionRate}
                                        label="Загальний збір"
                                        color={overview.collectionRate >= 80 ? '#10b981' : overview.collectionRate >= 50 ? '#f59e0b' : '#ef4444'}
                                    />
                                    {topManagers.filter(m => m.totalRevenue > 0).slice(0, 3).map((mgr) => (
                                        <ProgressBar
                                            key={mgr._id}
                                            value={Math.round((mgr.totalPaid / mgr.totalRevenue) * 100)}
                                            label={mgr._id || 'Без імені'}
                                            color="#8b5cf6"
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="p-4 bg-white/3 rounded-xl">
                                        <div className="text-xs text-secondary mb-1">Кешбек видано</div>
                                        <div className="text-xl font-semibold text-purple-400">{formatCurrency(overview.totalCashback)}</div>
                                    </div>
                                    <div className="p-4 bg-white/3 rounded-xl">
                                        <div className="text-xs text-secondary mb-1">Кешбек використано</div>
                                        <div className="text-xl font-semibold text-pink-400">{formatCurrency(overview.totalCashbackUsed)}</div>
                                        {overview.cashbackUsedCount > 0 && <div className="text-[10px] text-secondary mt-1">{overview.cashbackUsedCount} промокодів</div>}
                                    </div>
                                    <div className="p-4 bg-white/3 rounded-xl">
                                        <div className="text-xs text-secondary mb-1">Середній чек</div>
                                        <div className="text-xl font-semibold text-blue-400">{formatCurrency(overview.avgTripValue)}</div>
                                    </div>
                                </div>
                            </div>
                        </ChartCard>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-6 sm:space-y-8"
                    >
                        {/* User KPIs */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <StatCard icon={Users} label="Користувачі" value={overview.totalUsers} change={comparison?.users} />
                            <StatCard icon={UserCheck} label="Туристів" value={overview.totalTourists} change={comparison?.tourists} color="text-teal-400" delay={0.05} />
                            <StatCard icon={MessageCircle} label="Запити" value={overview.totalContactRequests} color="text-yellow-400" change={comparison?.contactRequests} delay={0.1} />
                            <StatCard icon={Plane} label="Подорожей" value={overview.totalTrips} change={comparison?.trips} delay={0.15} />
                            <StatCard
                                icon={TrendingUp} label="Подорожей/корист."
                                value={overview.totalUsers > 0 ? (overview.totalTrips / overview.totalUsers).toFixed(1) : '0'}
                                color="text-cyan-400" delay={0.2}
                            />
                            <StatCard
                                icon={TrendingUp} label="Тур./подорож"
                                value={overview.totalTrips > 0 ? (overview.totalTourists / overview.totalTrips).toFixed(1) : '0'}
                                color="text-teal-400" delay={0.25}
                            />
                        </div>

                        {/* User Growth */}
                        <ChartCard title="Реєстрації користувачів" icon={Users}>
                            {userGrowth.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={userGrowth}>
                                        <defs>
                                            <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone" dataKey="count" name="Нових користувачів"
                                            stroke="#8b5cf6" fill="url(#userGrowthGrad)" strokeWidth={2}
                                            dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                                            activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                            )}
                        </ChartCard>

                        {/* Tourists Over Time */}
                        <ChartCard title="Туристи за місяцями" icon={UserCheck}>
                            {touristsOverTime.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={touristsOverTime}>
                                        <defs>
                                            <linearGradient id="touristsGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone" dataKey="tourists" name="Туристів"
                                            stroke="#14b8a6" fill="url(#touristsGrad)" strokeWidth={2}
                                            dot={{ r: 3, fill: '#14b8a6', strokeWidth: 0 }}
                                            activeDot={{ r: 5, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                            )}
                        </ChartCard>

                        {/* Contact Requests Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <ChartCard title="Запити від клієнтів" icon={MessageCircle}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/3 rounded-xl text-center">
                                        <div className="text-2xl font-semibold text-white">{overview.totalContactRequests}</div>
                                        <div className="text-xs text-secondary mt-1">Всього запитів</div>
                                    </div>
                                    <div className="p-4 bg-white/3 rounded-xl text-center">
                                        <div className="text-2xl font-semibold text-accent">{overview.newContactRequests}</div>
                                        <div className="text-xs text-secondary mt-1">Нових за 7 днів</div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <ProgressBar
                                        value={overview.totalContactRequests > 0 ? Math.round((overview.newContactRequests / overview.totalContactRequests) * 100) : 0}
                                        label="Частка нових запитів"
                                        color="#0fa4e6"
                                    />
                                </div>
                            </ChartCard>

                            <ChartCard title="Активність менеджерів" icon={Award}>
                                <div className="space-y-3">
                                    {topManagers.length > 0 ? topManagers.map((mgr, index) => (
                                        <div key={mgr._id} className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${index === 0 ? 'bg-amber-500/20 text-amber-400' :
                                                index === 1 ? 'bg-gray-400/20 text-gray-300' :
                                                    index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                        'bg-white/5 text-secondary'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm text-white truncate">{mgr._id || 'Без імені'}</span>
                                                    <span className="text-xs text-secondary ml-2">{mgr.tripCount} подорожей</span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${(mgr.tripCount / (topManagers[0]?.tripCount || 1)) * 100}%`,
                                                            backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-secondary text-sm text-center py-4">Немає даних</p>
                                    )}
                                </div>
                            </ChartCard>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'requests' && (
                    <motion.div
                        key="requests"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-6 sm:space-y-8"
                    >
                        {requestsLoading && !requestsData ? (
                            <div className="flex justify-center items-center py-20">
                                <RefreshCw size={20} className="animate-spin text-accent" />
                            </div>
                        ) : requestsData ? (
                            <>
                                {/* KPI cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <StatCard icon={MessageCircle} label="Всього запитів" value={requestsData.total} change={requestsData.comparison} color="text-yellow-400" delay={0} />
                                    {requestsData.bySource.map((s, i) => (
                                        <StatCard
                                            key={s._id}
                                            icon={s._id === 'contact' ? Phone : s._id === 'manager' ? Users : s._id === 'tour' ? Map : Search}
                                            label={SOURCE_LABELS[s._id] || s._id}
                                            value={s.count}
                                            subValue={requestsData.total > 0 ? `${Math.round((s.count / requestsData.total) * 100)}%` : undefined}
                                            color={`text-[${SOURCE_COLORS[s._id] || '#6b7280'}]`}
                                            delay={(i + 1) * 0.05}
                                        />
                                    ))}
                                </div>

                                {/* Charts Row 1: By Source + By Status */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    <ChartCard title="Запити за джерелом" icon={MessageCircle}>
                                        {requestsData.bySource.length > 0 ? (
                                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <PieChart>
                                                        <Pie
                                                            data={requestsData.bySource.map(s => ({
                                                                name: SOURCE_LABELS[s._id] || s._id,
                                                                value: s.count,
                                                                fill: SOURCE_COLORS[s._id] || '#6b7280',
                                                            }))}
                                                            cx="50%" cy="50%"
                                                            innerRadius={55} outerRadius={90}
                                                            paddingAngle={3} dataKey="value"
                                                            animationBegin={0} animationDuration={800}
                                                        >
                                                            {requestsData.bySource.map((s, index) => (
                                                                <Cell key={index} fill={SOURCE_COLORS[s._id] || '#6b7280'} stroke="transparent" />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: 'rgba(17,17,17,0.95)',
                                                                border: '1px solid rgba(255,255,255,0.15)',
                                                                borderRadius: 12, fontSize: 12, backdropFilter: 'blur(8px)',
                                                                color: '#fff',
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="flex flex-wrap sm:flex-col gap-2 text-xs">
                                                    {requestsData.bySource.map((s) => (
                                                        <div key={s._id} className="flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[s._id] || '#6b7280' }} />
                                                            <span className="text-secondary whitespace-nowrap">{SOURCE_LABELS[s._id] || s._id}</span>
                                                            <span className="text-white font-medium">{s.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                                        )}
                                    </ChartCard>

                                    <ChartCard title="Запити за статусом" icon={CheckCircle2}>
                                        {requestsData.byStatus.length > 0 ? (
                                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <PieChart>
                                                        <Pie
                                                            data={requestsData.byStatus.map(s => ({
                                                                name: STATUS_LABELS_REQUESTS[s._id] || s._id,
                                                                value: s.count,
                                                                fill: STATUS_COLORS_REQUESTS[s._id] || '#6b7280',
                                                            }))}
                                                            cx="50%" cy="50%"
                                                            innerRadius={55} outerRadius={90}
                                                            paddingAngle={3} dataKey="value"
                                                            animationBegin={0} animationDuration={800}
                                                        >
                                                            {requestsData.byStatus.map((s, index) => (
                                                                <Cell key={index} fill={STATUS_COLORS_REQUESTS[s._id] || '#6b7280'} stroke="transparent" />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: 'rgba(17,17,17,0.95)',
                                                                border: '1px solid rgba(255,255,255,0.15)',
                                                                borderRadius: 12, fontSize: 12, backdropFilter: 'blur(8px)',
                                                                color: '#fff',
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="flex flex-wrap sm:flex-col gap-2 text-xs">
                                                    {requestsData.byStatus.map((s) => (
                                                        <div key={s._id} className="flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS_REQUESTS[s._id] || '#6b7280' }} />
                                                            <span className="text-secondary whitespace-nowrap">{STATUS_LABELS_REQUESTS[s._id] || s._id}</span>
                                                            <span className="text-white font-medium">{s.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                                        )}
                                    </ChartCard>
                                </div>

                                {/* Requests over time by source */}
                                <ChartCard title="Запити за місяцями (по джерелах)" icon={TrendingUp}>
                                    {requestsData.overTime.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={320}>
                                            <BarChart data={requestsData.overTime}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                                <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ fontSize: 12, color: '#666' }} />
                                                <Bar dataKey="contact" name="Контактна форма" fill="#0fa4e6" stackId="a" radius={[0, 0, 0, 0]} />
                                                <Bar dataKey="manager" name="Консультація" fill="#8b5cf6" stackId="a" radius={[0, 0, 0, 0]} />
                                                <Bar dataKey="tour" name="Сторінка туру" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                                                <Bar dataKey="ai-trip-plan" name="AI підбір" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                                    )}
                                </ChartCard>

                                {/* Response time by source + Source-Status table */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    <ChartCard title="Час відповіді за джерелом" icon={Clock}>
                                        {requestsData.responseTimeBySource.length > 0 ? (
                                            <div className="space-y-3">
                                                {requestsData.responseTimeBySource.map((item, i) => {
                                                    const label = SOURCE_LABELS[item.source] || item.source;
                                                    const maxMinutes = Math.max(...requestsData.responseTimeBySource.map(r => r.avgMinutes));
                                                    const percentage = maxMinutes > 0 ? Math.round((item.avgMinutes / maxMinutes) * 100) : 0;
                                                    const displayTime = item.avgMinutes < 60
                                                        ? `${item.avgMinutes} хв`
                                                        : item.avgMinutes < 1440
                                                            ? `${Math.round(item.avgMinutes / 60)} год`
                                                            : `${Math.round(item.avgMinutes / 1440)} д`;
                                                    return (
                                                        <motion.div
                                                            key={item.source}
                                                            initial={{ opacity: 0, x: -8 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.08 }}
                                                        >
                                                            <div className="flex items-center justify-between text-xs mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS[item.source] || '#6b7280' }} />
                                                                    <span className="text-secondary">{label}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-white font-medium">{displayTime}</span>
                                                                    <span className="text-secondary text-[10px]">({item.count} відп.)</span>
                                                                </div>
                                                            </div>
                                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${percentage}%` }}
                                                                    transition={{ duration: 0.6, delay: i * 0.08 }}
                                                                    className="h-full rounded-full"
                                                                    style={{ backgroundColor: SOURCE_COLORS[item.source] || '#6b7280' }}
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-secondary text-sm text-center py-8">Немає даних про час відповіді</p>
                                        )}
                                    </ChartCard>

                                    <ChartCard title="Джерело × Статус" icon={Filter}>
                                        {requestsData.sourceStatus.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b border-white/8">
                                                            <th className="text-left text-secondary font-medium py-2 pr-3">Джерело</th>
                                                            <th className="text-right text-secondary font-medium py-2 px-2">Новий</th>
                                                            <th className="text-right text-secondary font-medium py-2 px-2">В роботі</th>
                                                            <th className="text-right text-secondary font-medium py-2 px-2">Заверш.</th>
                                                            <th className="text-right text-secondary font-medium py-2 px-2">Відхил.</th>
                                                            <th className="text-right text-secondary font-medium py-2 pl-2">Всього</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {requestsData.sourceStatus.map((row) => (
                                                            <tr key={row.source} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                                                                <td className="py-2.5 pr-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[row.source] || '#6b7280' }} />
                                                                        <span className="text-white">{SOURCE_LABELS[row.source] || row.source}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="text-right py-2.5 px-2 text-blue-400 font-medium">{row.new || '—'}</td>
                                                                <td className="text-right py-2.5 px-2 text-yellow-400 font-medium">{row.in_progress || '—'}</td>
                                                                <td className="text-right py-2.5 px-2 text-green-400 font-medium">{row.completed || '—'}</td>
                                                                <td className="text-right py-2.5 px-2 text-red-400 font-medium">{row.dismissed || '—'}</td>
                                                                <td className="text-right py-2.5 pl-2 text-white font-semibold">{row.total}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="border-t border-white/8">
                                                            <td className="py-2.5 pr-3 text-secondary font-medium">Всього</td>
                                                            <td className="text-right py-2.5 px-2 text-blue-400 font-semibold">{requestsData.sourceStatus.reduce((s, r) => s + r.new, 0) || '—'}</td>
                                                            <td className="text-right py-2.5 px-2 text-yellow-400 font-semibold">{requestsData.sourceStatus.reduce((s, r) => s + r.in_progress, 0) || '—'}</td>
                                                            <td className="text-right py-2.5 px-2 text-green-400 font-semibold">{requestsData.sourceStatus.reduce((s, r) => s + r.completed, 0) || '—'}</td>
                                                            <td className="text-right py-2.5 px-2 text-red-400 font-semibold">{requestsData.sourceStatus.reduce((s, r) => s + r.dismissed, 0) || '—'}</td>
                                                            <td className="text-right py-2.5 pl-2 text-white font-bold">{requestsData.total}</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                                        )}
                                    </ChartCard>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col justify-center items-center py-20 gap-4">
                                <p className="text-secondary text-sm">Натисніть кнопку для завантаження</p>
                                <button
                                    onClick={() => fetchRequests()}
                                    className="flex items-center gap-2 text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-secondary hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <RefreshCw size={14} /> Завантажити
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'bonuses' && (
                    <motion.div
                        key="bonuses"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-6 sm:space-y-8"
                    >
                        {bonusLoading && !bonusData ? (
                            <div className="flex justify-center items-center py-20">
                                <RefreshCw size={20} className="animate-spin text-accent" />
                            </div>
                        ) : bonusData ? (
                            <>
                                {/* Summary header */}
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-secondary">
                                            Дані станом на {new Date(bonusData.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}, {new Date(bonusData.date).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => fetchBonuses()}
                                        disabled={bonusLoading}
                                        className="flex items-center gap-2 text-xs bg-white/3 border border-white/8 rounded-xl px-3 py-2 text-secondary hover:text-white hover:bg-white/6 transition-all duration-200 self-start sm:self-auto"
                                    >
                                        <RefreshCw size={13} className={bonusLoading ? 'animate-spin' : ''} />
                                        <span className="hidden sm:inline">Оновити</span>
                                    </button>
                                </div>

                                {/* KPI cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <StatCard icon={Wallet} label="Сума на рахунках" value={formatCurrency(bonusData.totals.balance)} color="text-amber-400" delay={0} />
                                    <StatCard icon={TrendingUp} label="Нараховано" value={formatCurrency(bonusData.totals.accrued)} color="text-green-400" delay={0.05} />
                                    <StatCard icon={CreditCard} label="Використано" value={formatCurrency(bonusData.totals.used)} color="text-pink-400" delay={0.1} />
                                    <StatCard icon={Users} label="Користувачів" value={bonusData.totals.userCount} color="text-blue-400" delay={0.15} />
                                </div>

                                {/* Search + sort controls */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1 max-w-md">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                                        <input
                                            type="text"
                                            placeholder="Пошук за номером телефону або ім'ям…"
                                            value={bonusSearch}
                                            onChange={(e) => setBonusSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-white/3 border border-white/8 rounded-xl text-white placeholder:text-secondary/60 focus:outline-none focus:border-accent/40 transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1 bg-white/3 border border-white/8 rounded-xl p-1">
                                        {([
                                            { field: 'balance' as const, label: 'Баланс' },
                                            { field: 'totalAccrued' as const, label: 'Нараховано' },
                                            { field: 'totalUsed' as const, label: 'Використано' },
                                            { field: 'name' as const, label: 'Ім\'я' },
                                        ]).map((opt) => (
                                            <button
                                                key={opt.field}
                                                onClick={() => {
                                                    if (bonusSortField === opt.field) {
                                                        setBonusSortDir((d) => d === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setBonusSortField(opt.field);
                                                        setBonusSortDir(opt.field === 'name' ? 'asc' : 'desc');
                                                    }
                                                }}
                                                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all duration-200 ${bonusSortField === opt.field
                                                    ? 'bg-accent text-white shadow-sm shadow-accent/20'
                                                    : 'text-secondary hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {opt.label}
                                                {bonusSortField === opt.field && (
                                                    <ArrowUpDown size={11} className="opacity-70" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
                                    {/* Desktop header */}
                                    <div className="hidden md:grid grid-cols-[1fr_140px_140px_140px_140px] gap-2 px-4 py-3 bg-white/3 border-b border-white/8 text-xs text-secondary font-medium">
                                        <div className="flex items-center gap-1">
                                            <Phone size={11} />
                                            Телефон / Ім'я
                                        </div>
                                        <div className="text-right">Баланс</div>
                                        <div className="text-right">Нараховано</div>
                                        <div className="text-right">Використано</div>
                                        <div className="text-right">Деталі</div>
                                    </div>

                                    <div className="max-h-[600px] overflow-y-auto divide-y divide-white/4">
                                        {(() => {
                                            const filtered = bonusData.users
                                                .filter((u) => {
                                                    if (!bonusSearch) return true;
                                                    const q = bonusSearch.toLowerCase();
                                                    return u.phoneNumber.includes(q) || u.name.toLowerCase().includes(q);
                                                })
                                                .sort((a, b) => {
                                                    let cmp = 0;
                                                    if (bonusSortField === 'name') {
                                                        cmp = a.name.localeCompare(b.name, 'uk');
                                                    } else {
                                                        cmp = (a[bonusSortField] ?? 0) - (b[bonusSortField] ?? 0);
                                                    }
                                                    return bonusSortDir === 'asc' ? cmp : -cmp;
                                                });

                                            if (filtered.length === 0) {
                                                return (
                                                    <p className="text-secondary text-sm text-center py-8">
                                                        {bonusSearch ? 'Нічого не знайдено' : 'Немає даних'}
                                                    </p>
                                                );
                                            }

                                            return filtered.map((user, i) => (
                                                <motion.div
                                                    key={user.phoneNumber}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: Math.min(i * 0.015, 0.3) }}
                                                    className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_140px_140px] gap-1 md:gap-2 px-4 py-3 hover:bg-white/3 transition-colors"
                                                >
                                                    {/* Phone + Name */}
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm text-white font-medium">{user.phoneNumber}</span>
                                                        <span className="text-xs text-secondary">{user.name}</span>
                                                    </div>

                                                    {/* Balance */}
                                                    <div className="flex items-center justify-between md:justify-end gap-2">
                                                        <span className="text-xs text-secondary md:hidden">Баланс:</span>
                                                        <span className={`text-sm font-semibold ${user.balance > 0 ? 'text-amber-400' : 'text-secondary'}`}>
                                                            {formatCurrency(user.balance)}
                                                        </span>
                                                    </div>

                                                    {/* Accrued */}
                                                    <div className="flex items-center justify-between md:justify-end gap-2">
                                                        <span className="text-xs text-secondary md:hidden">Нараховано:</span>
                                                        <span className="text-sm text-green-400 font-medium">
                                                            {formatCurrency(user.totalAccrued)}
                                                        </span>
                                                    </div>

                                                    {/* Used */}
                                                    <div className="flex items-center justify-between md:justify-end gap-2">
                                                        <span className="text-xs text-secondary md:hidden">Використано:</span>
                                                        <span className={`text-sm font-medium ${user.totalUsed > 0 ? 'text-pink-400' : 'text-secondary'}`}>
                                                            {formatCurrency(user.totalUsed)}
                                                        </span>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="flex items-center justify-between md:justify-end gap-2">
                                                        <span className="text-xs text-secondary md:hidden">Деталі:</span>
                                                        <div className="flex flex-wrap gap-1.5 justify-end">
                                                            {user.tripCashbackCount > 0 && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
                                                                    {user.tripCashbackCount} подор.
                                                                </span>
                                                            )}
                                                            {user.referralBonus > 0 && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20">
                                                                    Реф. {formatCurrency(user.referralBonus)}
                                                                </span>
                                                            )}
                                                            {user.usedCount > 0 && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-400/10 text-pink-400 border border-pink-400/20">
                                                                    {user.usedCount} промо
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ));
                                        })()}
                                    </div>

                                    {/* Footer totals */}
                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_140px_140px] gap-1 md:gap-2 px-4 py-3 bg-white/3 border-t border-white/8 text-sm font-medium">
                                        <div className="text-secondary">Всього ({bonusData.totals.userCount} корист.)</div>
                                        <div className="flex items-center justify-between md:justify-end gap-2">
                                            <span className="text-xs text-secondary md:hidden">Баланс:</span>
                                            <span className="text-amber-400">{formatCurrency(bonusData.totals.balance)}</span>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-2">
                                            <span className="text-xs text-secondary md:hidden">Нараховано:</span>
                                            <span className="text-green-400">{formatCurrency(bonusData.totals.accrued)}</span>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-2">
                                            <span className="text-xs text-secondary md:hidden">Використано:</span>
                                            <span className="text-pink-400">{formatCurrency(bonusData.totals.used)}</span>
                                        </div>
                                        <div />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col justify-center items-center py-20 gap-4">
                                <p className="text-secondary text-sm">Натисніть кнопку для завантаження</p>
                                <button
                                    onClick={() => fetchBonuses()}
                                    className="flex items-center gap-2 text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-secondary hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <RefreshCw size={14} /> Завантажити
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
