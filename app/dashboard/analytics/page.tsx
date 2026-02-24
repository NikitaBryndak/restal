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
    Filter, CheckCircle2, Percent,
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
    };
    comparison: {
        trips: number | null;
        users: number | null;
        contactRequests: number | null;
        revenue: number | null;
        paid: number | null;
        avgTripValue: number | null;
    } | null;
    tripsByStatus: { _id: string; count: number }[];
    tripsByCountry: { _id: string; count: number }[];
    tripsOverTime: { month: string; count: number; revenue: number; paid: number }[];
    userGrowth: { month: string; count: number }[];
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
        rows.push(['Користувачі', String(data.overview.totalUsers)]);
        rows.push(['Загальний дохід', String(data.overview.totalRevenue)]);
        rows.push(['Оплачено', String(data.overview.totalPaid)]);
        rows.push(['Середній чек', String(data.overview.avgTripValue)]);
        rows.push(['Кешбек видано', String(data.overview.totalCashback)]);
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
    const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'users'>('overview');

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

    const handlePeriodChange = useCallback((p: Period) => {
        setPeriod(p);
        fetchAnalytics(p);
    }, [fetchAnalytics]);

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

    const { overview, comparison, tripsByStatus, tripsByCountry, tripsOverTime, userGrowth, recentTrips, topManagers, conversionFunnel } = data;

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
                ]).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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
                                icon={MessageCircle} label="Запити"
                                value={overview.totalContactRequests}
                                subValue={`Нових за 7д: ${overview.newContactRequests}`}
                                color="text-yellow-400" change={comparison?.contactRequests} delay={0.3}
                            />
                            <StatCard
                                icon={Percent} label="Збір оплат"
                                value={`${overview.collectionRate}%`}
                                subValue={overview.collectionRate < 80 ? 'Потребує уваги' : 'Добре'}
                                color={overview.collectionRate >= 80 ? 'text-emerald-400' : 'text-amber-400'} delay={0.35}
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
                            <StatCard icon={MessageCircle} label="Запити" value={overview.totalContactRequests} color="text-yellow-400" change={comparison?.contactRequests} delay={0.05} />
                            <StatCard icon={Plane} label="Подорожей" value={overview.totalTrips} change={comparison?.trips} delay={0.1} />
                            <StatCard
                                icon={TrendingUp} label="Подорожей/корист."
                                value={overview.totalUsers > 0 ? (overview.totalTrips / overview.totalUsers).toFixed(1) : '0'}
                                color="text-cyan-400" delay={0.15}
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
            </AnimatePresence>
        </div>
    );
}
