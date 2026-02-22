'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { LoaderOne } from '@/components/ui/loader';
import { TOUR_STATUS_LABELS } from '@/types';
import type { TourStatus } from '@/types';
import {
    BarChart3, Users, Map, DollarSign,
    TrendingUp, MessageCircle, RefreshCw,
    Plane, Award, CreditCard, Clock,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
    AreaChart, Area, Legend,
} from 'recharts';

interface AnalyticsData {
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
    };
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
    topManagers: { _id: string; tripCount: number; totalRevenue: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    "In Booking": "#f59e0b",
    "Booked": "#3b82f6",
    "Paid": "#10b981",
    "In Progress": "#8b5cf6",
    "Completed": "#06b6d4",
    "Archived": "#6b7280",
};

const PIE_COLORS = ['#0fa4e6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(value) + ' ₴';
}

function StatCard({ icon: Icon, label, value, subValue, color }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subValue?: string;
    color?: string;
}) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-secondary text-sm">
                <Icon size={16} className={color || 'text-accent'} />
                {label}
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-white">{value}</div>
            {subValue && <div className="text-xs text-secondary">{subValue}</div>}
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-black/90 border border-white/20 rounded-lg px-3 py-2 text-sm">
            <p className="text-white font-medium mb-1">{label}</p>
            {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
                <p key={i} style={{ color: entry.color }} className="text-xs">
                    {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('дохід')
                        ? formatCurrency(entry.value)
                        : entry.value}
                </p>
            ))}
        </div>
    );
}

export default function AnalyticsPage() {
    const { userProfile, loading: profileLoading } = useUserProfile();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const isAdmin = userProfile && userProfile.privilegeLevel >= 3;

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch('/api/analytics');
            if (!res.ok) throw new Error('Помилка завантаження');
            const json = await res.json();
            setData(json);
        } catch {
            setError('Не вдалося завантажити аналітику');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) fetchAnalytics();
    }, [isAdmin, fetchAnalytics]);

    if (profileLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-5rem)]">
                <LoaderOne />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-5rem)]">
                <p className="text-secondary">Недостатньо прав для перегляду аналітики</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-5rem)]">
                <LoaderOne />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-5rem)] gap-4">
                <p className="text-red-400">{error || 'Немає даних'}</p>
                <button
                    onClick={fetchAnalytics}
                    className="flex items-center gap-2 text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-secondary hover:text-white hover:bg-white/10 transition-colors"
                >
                    <RefreshCw size={14} /> Спробувати знову
                </button>
            </div>
        );
    }

    const { overview, tripsByStatus, tripsByCountry, tripsOverTime, userGrowth, recentTrips, topManagers } = data;

    const statusChartData = tripsByStatus.map((s) => ({
        name: TOUR_STATUS_LABELS[s._id as TourStatus] || s._id,
        value: s.count,
        fill: STATUS_COLORS[s._id] || '#6b7280',
    }));

    const countryChartData = tripsByCountry.map((c) => ({
        name: c._id || 'Невідомо',
        count: c.count,
    }));

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <BarChart3 size={24} className="text-accent" />
                    <h1 className="text-xl sm:text-2xl font-light text-white">Аналітика</h1>
                </div>
                <button
                    onClick={fetchAnalytics}
                    disabled={loading}
                    className="flex items-center gap-2 text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-secondary hover:text-white hover:bg-white/10 transition-colors self-start sm:self-auto"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Оновити
                </button>
            </div>

            {/* Overview Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard icon={Plane} label="Всього подорожей" value={overview.totalTrips} />
                <StatCard icon={Users} label="Користувачі" value={overview.totalUsers} />
                <StatCard
                    icon={DollarSign}
                    label="Загальний дохід"
                    value={formatCurrency(overview.totalRevenue)}
                    color="text-green-400"
                />
                <StatCard
                    icon={CreditCard}
                    label="Оплачено"
                    value={formatCurrency(overview.totalPaid)}
                    subValue={overview.outstandingPayments > 0 ? `Заборгованість: ${formatCurrency(overview.outstandingPayments)}` : undefined}
                    color="text-emerald-400"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Середній чек"
                    value={formatCurrency(overview.avgTripValue)}
                    color="text-blue-400"
                />
                <StatCard
                    icon={Award}
                    label="Кешбек видано"
                    value={formatCurrency(overview.totalCashback)}
                    color="text-purple-400"
                />
                <StatCard
                    icon={MessageCircle}
                    label="Запити (всього)"
                    value={overview.totalContactRequests}
                    subValue={`Нових за 7 днів: ${overview.newContactRequests}`}
                    color="text-yellow-400"
                />
                <StatCard
                    icon={Clock}
                    label="Заборгованість"
                    value={formatCurrency(overview.outstandingPayments)}
                    color="text-red-400"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Trips Over Time */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
                    <h2 className="text-sm font-medium text-secondary mb-4">Подорожі за місяцями</h2>
                    {tripsOverTime.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={tripsOverTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#666', fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    name="Подорожей"
                                    stroke="#0fa4e6"
                                    fill="rgba(15, 164, 230, 0.15)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                    )}
                </div>

                {/* Revenue Over Time */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
                    <h2 className="text-sm font-medium text-secondary mb-4">Дохід за місяцями</h2>
                    {tripsOverTime.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={tripsOverTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#666', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 12, color: '#666' }} />
                                <Bar dataKey="revenue" name="Дохід" fill="#0fa4e6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="paid" name="Оплачено" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                    )}
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Trip Status Distribution */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
                    <h2 className="text-sm font-medium text-secondary mb-4">Статуси подорожей</h2>
                    {statusChartData.length > 0 ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(0,0,0,0.9)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap sm:flex-col gap-2 text-xs">
                                {statusChartData.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: s.fill }}
                                        />
                                        <span className="text-secondary whitespace-nowrap">{s.name}</span>
                                        <span className="text-white font-medium">{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                    )}
                </div>

                {/* Top Countries */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
                    <h2 className="text-sm font-medium text-secondary mb-4">Топ напрямки</h2>
                    {countryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={countryChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fill: '#999', fontSize: 11 }}
                                    width={100}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Подорожей" radius={[0, 4, 4, 0]}>
                                    {countryChartData.map((_, index) => (
                                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-secondary text-sm text-center py-8">Немає даних</p>
                    )}
                </div>
            </div>

            {/* User Growth */}
            {userGrowth.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
                    <h2 className="text-sm font-medium text-secondary mb-4">Реєстрації користувачів</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#666', fontSize: 11 }} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                name="Нових користувачів"
                                stroke="#8b5cf6"
                                fill="rgba(139, 92, 246, 0.15)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Trips */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
                    <h2 className="text-sm font-medium text-secondary mb-4 flex items-center gap-2">
                        <Map size={14} className="text-accent" />
                        Останні подорожі
                    </h2>
                    <div className="space-y-3">
                        {recentTrips.length > 0 ? recentTrips.map((trip) => (
                            <div
                                key={trip._id}
                                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                            >
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-white font-medium truncate">
                                            #{trip.number}
                                        </span>
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded-full border shrink-0"
                                            style={{
                                                color: STATUS_COLORS[trip.status] || '#6b7280',
                                                borderColor: `${STATUS_COLORS[trip.status] || '#6b7280'}50`,
                                                backgroundColor: `${STATUS_COLORS[trip.status] || '#6b7280'}15`,
                                            }}
                                        >
                                            {TOUR_STATUS_LABELS[trip.status as TourStatus] || trip.status}
                                        </span>
                                    </div>
                                    <span className="text-xs text-secondary truncate">
                                        {trip.country}{trip.managerName ? ` • ${trip.managerName}` : ''}
                                    </span>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <div className="text-sm text-white">
                                        {formatCurrency(trip.payment.totalAmount)}
                                    </div>
                                    <div className="text-[10px] text-secondary">
                                        {new Date(trip.createdAt).toLocaleDateString('uk-UA')}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-secondary text-sm text-center py-4">Немає подорожей</p>
                        )}
                    </div>
                </div>

                {/* Top Managers */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
                    <h2 className="text-sm font-medium text-secondary mb-4 flex items-center gap-2">
                        <Award size={14} className="text-accent" />
                        Топ менеджери
                    </h2>
                    <div className="space-y-3">
                        {topManagers.length > 0 ? topManagers.map((mgr, index) => (
                            <div
                                key={mgr._id}
                                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-light text-secondary w-6 text-center">
                                        {index + 1}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-white">{mgr._id || 'Без імені'}</span>
                                        <span className="text-xs text-secondary">{mgr.tripCount} подорожей</span>
                                    </div>
                                </div>
                                <span className="text-sm text-green-400">
                                    {formatCurrency(mgr.totalRevenue)}
                                </span>
                            </div>
                        )) : (
                            <p className="text-secondary text-sm text-center py-4">Немає даних</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
