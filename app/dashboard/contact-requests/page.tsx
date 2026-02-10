'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { LoaderOne } from '@/components/ui/loader';
import {
    MessageCircle,
    Phone as PhoneIcon,
    User,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Inbox,
    Filter,
} from 'lucide-react';

interface ContactRequestItem {
    _id: string;
    source: 'contact' | 'manager';
    firstName: string;
    lastName: string;
    phone: string;
    message: string;
    managerName: string;
    status: 'new' | 'in_progress' | 'completed' | 'dismissed';
    adminNote: string;
    createdAt: string;
    updatedAt: string;
}

interface StatusCounts {
    new: number;
    in_progress: number;
    completed: number;
    dismissed: number;
}

const STATUS_LABELS: Record<string, string> = {
    new: 'Нові',
    in_progress: 'В роботі',
    completed: 'Завершені',
    dismissed: 'Відхилені',
    all: 'Всі',
};

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    dismissed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_DOT_COLORS: Record<string, string> = {
    new: 'bg-blue-400',
    in_progress: 'bg-yellow-400',
    completed: 'bg-green-400',
    dismissed: 'bg-red-400',
};

const SOURCE_LABELS: Record<string, string> = {
    contact: 'Контактна форма',
    manager: 'Запит до менеджера',
};

export default function ContactRequestsPage() {
    const { userProfile, loading: profileLoading } = useUserProfile();
    const [requests, setRequests] = useState<ContactRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [counts, setCounts] = useState<StatusCounts>({ new: 0, in_progress: 0, completed: 0, dismissed: 0 });
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const isManager = userProfile && userProfile.privilegeLevel >= 2;

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '15' });
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`/api/contact-requests?${params}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setRequests(data.requests);
            setTotalPages(data.totalPages);
            setCounts(data.counts);
        } catch {
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        if (isManager) fetchRequests();
    }, [isManager, fetchRequests]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch('/api/contact-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (res.ok) {
                await fetchRequests();
            }
        } catch {
            // silently fail
        } finally {
            setUpdatingId(null);
        }
    };

    const handleFilterChange = (newFilter: string) => {
        setStatusFilter(newFilter);
        setPage(1);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (profileLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoaderOne />
            </div>
        );
    }

    if (!isManager) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-secondary">Недостатньо прав для перегляду цієї сторінки.</p>
            </div>
        );
    }

    const totalNew = counts.new;

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-light text-white">
                        Запити на зв'язок
                    </h1>
                    <p className="text-secondary text-sm mt-1">
                        {totalNew > 0
                            ? `${totalNew} нових запитів потребують уваги`
                            : 'Немає нових запитів'}
                    </p>
                </div>
            </div>

            {/* Status filter tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter className="w-4 h-4 text-secondary shrink-0" />
                {['all', 'new', 'in_progress', 'completed', 'dismissed'].map((status) => {
                    const count = status === 'all'
                        ? counts.new + counts.in_progress + counts.completed + counts.dismissed
                        : counts[status as keyof StatusCounts];
                    return (
                        <button
                            key={status}
                            onClick={() => handleFilterChange(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                statusFilter === status
                                    ? 'bg-accent text-white'
                                    : 'bg-white/5 text-secondary hover:bg-white/10'
                            }`}
                        >
                            {STATUS_LABELS[status]}
                            <span className="ml-1.5 text-xs opacity-70">({count})</span>
                        </button>
                    );
                })}
            </div>

            {/* Request list */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <LoaderOne />
                </div>
            ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-secondary space-y-3">
                    <Inbox className="w-12 h-12 opacity-40" />
                    <p>Запитів не знайдено</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((req) => (
                        <div
                            key={req._id}
                            className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                {/* Icon */}
                                <div className="p-3 rounded-xl bg-accent/10 text-accent shrink-0 self-start">
                                    {req.source === 'manager' ? (
                                        <MessageCircle className="w-5 h-5" />
                                    ) : (
                                        <User className="w-5 h-5" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_COLORS[req.status]}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[req.status]}`} />
                                                {STATUS_LABELS[req.status]}
                                            </span>
                                            <span className="text-xs text-secondary bg-white/5 px-2 py-0.5 rounded-md">
                                                {SOURCE_LABELS[req.source]}
                                            </span>
                                        </div>
                                        <span className="text-xs text-secondary flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(req.createdAt)}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-1">
                                        {(req.firstName || req.lastName) && (
                                            <p className="text-white text-sm">
                                                <span className="text-secondary">Ім'я: </span>
                                                {[req.firstName, req.lastName].filter(Boolean).join(' ')}
                                            </p>
                                        )}
                                        <p className="text-white text-sm flex items-center gap-1.5">
                                            <PhoneIcon className="w-3.5 h-3.5 text-accent" />
                                            <a href={`tel:${req.phone}`} className="hover:text-accent transition-colors">
                                                {req.phone}
                                            </a>
                                        </p>
                                        {req.managerName && (
                                            <p className="text-white text-sm">
                                                <span className="text-secondary">Менеджер: </span>
                                                {req.managerName}
                                            </p>
                                        )}
                                        {req.message && (
                                            <p className="text-secondary text-sm mt-1 bg-white/5 rounded-lg p-3">
                                                {req.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                                        {req.status !== 'in_progress' && req.status !== 'completed' && (
                                            <button
                                                onClick={() => handleStatusChange(req._id, 'in_progress')}
                                                disabled={updatingId === req._id}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                                            >
                                                В роботу
                                            </button>
                                        )}
                                        {req.status !== 'completed' && (
                                            <button
                                                onClick={() => handleStatusChange(req._id, 'completed')}
                                                disabled={updatingId === req._id}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                Завершити
                                            </button>
                                        )}
                                        {req.status !== 'dismissed' && req.status !== 'completed' && (
                                            <button
                                                onClick={() => handleStatusChange(req._id, 'dismissed')}
                                                disabled={updatingId === req._id}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <XCircle className="w-3 h-3" />
                                                Відхилити
                                            </button>
                                        )}
                                        {req.status === 'completed' && (
                                            <button
                                                onClick={() => handleStatusChange(req._id, 'new')}
                                                disabled={updatingId === req._id}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                            >
                                                Повернути
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-2 rounded-lg bg-white/5 text-secondary hover:bg-white/10 transition-colors disabled:opacity-30"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-secondary">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-2 rounded-lg bg-white/5 text-secondary hover:bg-white/10 transition-colors disabled:opacity-30"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
