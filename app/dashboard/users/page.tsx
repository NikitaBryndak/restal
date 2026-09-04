"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Loader2, Search } from "lucide-react";

interface UserRow {
    _id: string;
    name: string;
    phoneNumber: string;
    role?: string;
    roleName?: string;
    createdAt?: string;
}

interface RoleOption {
    slug: string;
    name: string;
    isSystem: boolean;
    userCount: number;
}

const PAGE_SIZE = 50; // must match /api/users/roles

export default function UsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [total, setTotal] = useState(0);
    const [query, setQuery] = useState({ page: 1, search: "" });
    const [searchInput, setSearchInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingPhone, setSavingPhone] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleOption[]>([]);

    // Load the role list for the assignment dropdown.
    useEffect(() => {
        if (!session) return;
        let cancelled = false;
        fetch("/api/roles")
            .then(async (res) => {
                const data = await res.json().catch(() => null);
                if (!cancelled && data?.roles) setRoles(data.roles);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [session, status]);

    // Debounce the search input; a new query always starts from page 1.
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery((q) => (q.search === searchInput.trim() ? q : { page: 1, search: searchInput.trim() }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        if (!session) return;
        let cancelled = false;
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ page: String(query.page), search: query.search });
                const response = await fetch(`/api/users/roles?${params}`);
                if (response.status === 401 || response.status === 403) {
                    router.replace("/dashboard");
                    return;
                }
                if (response.ok) {
                    const data = await response.json();
                    if (!cancelled) {
                        setUsers(data.users || []);
                        setTotal(data.total ?? 0);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchUsers();
        return () => { cancelled = true; };
    }, [session, query]);

    const handleRoleChange = async (phone: string, newSlug: string) => {
        setSavingPhone(phone);
        try {
            const response = await fetch('/api/users/roles', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, role: newSlug }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert(data.message || 'Не вдалося змінити роль');
            } else {
                const roleName = roles.find((r) => r.slug === newSlug)?.name ?? newSlug;
                setUsers(prev => prev.map(u => u.phoneNumber === phone ? { ...u, role: newSlug, roleName } : u));
            }
        } catch {
            alert('Помилка мережі — спробуйте ще раз');
        } finally {
            setSavingPhone(null);
        }
    };

    if ((loading && users.length === 0) || status === 'loading') {
        return <TableSkeleton rows={6} />;
    }

    if (!session) {
        return null; // Session still loading
    }

    const myPhone = session.user.phoneNumber;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const rangeFrom = total === 0 ? 0 : (query.page - 1) * PAGE_SIZE + 1;
    const rangeTo = Math.min(total, query.page * PAGE_SIZE);

    return (
        <div className="max-w-5xl mx-auto px-4 max-sm:px-2 py-8 sm:py-10 space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-light text-white">Користувачі</h1>
                <p className="text-sm text-white/40 mt-1">Керування ролями користувачів. Зміни застосовуються одразу.</p>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Пошук за ім'ям або номером телефону..."
                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
                />
            </div>

            <div className="rounded-2xl border border-white/5 overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="h-11 px-4 text-left text-xs font-semibold text-white/35 uppercase tracking-wider">Ім&apos;я</th>
                                <th className="h-11 px-4 text-left text-xs font-semibold text-white/35 uppercase tracking-wider hidden sm:table-cell">Телефон</th>
                                <th className="h-11 px-4 text-left text-xs font-semibold text-white/35 uppercase tracking-wider hidden lg:table-cell">Зареєстровано</th>
                                <th className="h-11 px-4 text-right text-xs font-semibold text-white/35 uppercase tracking-wider">Роль</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="h-24 text-center text-white/40">
                                        {query.search ? 'Нічого не знайдено за вашим запитом.' : 'Користувачів не знайдено.'}
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const isSelf = user.phoneNumber === myPhone;
                                    return (
                                        <tr key={user._id} className="border-b border-white/3 last:border-b-0 hover:bg-white/3 transition-colors">
                                            <td className="p-4 font-medium text-white/90">
                                                {user.name || '—'}
                                                {isSelf && <span className="ml-2 text-xs text-accent">(ви)</span>}
                                            </td>
                                            <td className="p-4 hidden sm:table-cell text-white/55">{user.phoneNumber}</td>
                                            <td className="p-4 hidden lg:table-cell text-white/55">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('uk-UA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    {savingPhone === user.phoneNumber && (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                                                    )}
                                                    <select
                                                        disabled={isSelf || savingPhone !== null}
                                                        value={user.role ?? "client"}
                                                        onChange={(e) => handleRoleChange(user.phoneNumber, e.target.value)}
                                                        className="h-9 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm text-white outline-none transition focus:border-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        {roles.map((r) => (
                                                            <option key={r.slug} value={r.slug} className="bg-black">
                                                                {r.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {total > 0 && (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-white/40 tabular-nums">Показано {rangeFrom}–{rangeTo} з {total}</p>
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />}
                        <button
                            type="button"
                            onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
                            disabled={query.page <= 1 || loading}
                            className="h-9 px-3.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Назад
                        </button>
                        <span className="text-xs text-white/50 tabular-nums">{query.page} / {totalPages}</span>
                        <button
                            type="button"
                            onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
                            disabled={query.page >= totalPages || loading}
                            className="h-9 px-3.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Далі
                        </button>
                    </div>
                </div>
            )}

            <p className="text-xs text-white/30">
                Ви не можете змінити власну роль — це захищає від випадкового блокування адміністративного доступу.
            </p>
        </div>
    );
}
