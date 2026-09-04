"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Loader2, Search } from "lucide-react";

interface UserRow {
    _id: string;
    name: string;
    phoneNumber: string;
    privilegeLevel?: number;
    createdAt?: string;
}

const ROLE_LABELS: Record<number, string> = {
    1: "Клієнт",
    2: "Редактор",
    3: "Менеджер",
    4: "Адмін",
};

export default function UsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingPhone, setSavingPhone] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (status === "loading") return;
        const level = session?.user?.privilegeLevel ?? 1;
        if (!session || level < ADMIN_PRIVILEGE_LEVEL) {
            router.replace("/dashboard");
        }
    }, [session, status, router]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users/roles');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchUsers();
        }
    }, [session]);

    const handleRoleChange = async (phone: string, newLevel: number) => {
        setSavingPhone(phone);
        try {
            const response = await fetch('/api/users/roles', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, privilegeLevel: newLevel }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert(data.message || 'Не вдалося змінити роль');
            } else {
                setUsers(prev => prev.map(u => u.phoneNumber === phone ? { ...u, privilegeLevel: newLevel } : u));
            }
        } catch {
            alert('Помилка мережі — спробуйте ще раз');
        } finally {
            setSavingPhone(null);
        }
    };

    if (loading || status === 'loading') {
        return <TableSkeleton rows={6} />;
    }

    const userLevel = session?.user?.privilegeLevel ?? 1;
    if (!session || userLevel < ADMIN_PRIVILEGE_LEVEL) {
        return null; // Redirect handled in useEffect
    }

    const myPhone = session.user.phoneNumber;
    const query = search.trim().toLowerCase();
    const filteredUsers = query
        ? users.filter((u) => (u.name || "").toLowerCase().includes(query) || u.phoneNumber.toLowerCase().includes(query))
        : users;

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
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="h-24 text-center text-white/40">
                                        {search.trim() ? 'Нічого не знайдено за вашим запитом.' : 'Користувачів не знайдено.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
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
                                                        value={user.privilegeLevel ?? 1}
                                                        onChange={(e) => handleRoleChange(user.phoneNumber, Number(e.target.value))}
                                                        className="h-9 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm text-white outline-none transition focus:border-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        {[1, 2, 3, 4].map((level) => (
                                                            <option key={level} value={level} className="bg-black">
                                                                {ROLE_LABELS[level]}
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

            <p className="text-xs text-white/30">
                Ви не можете змінити власну роль — це захищає від випадкового блокування адміністративного доступу.
            </p>
        </div>
    );
}
