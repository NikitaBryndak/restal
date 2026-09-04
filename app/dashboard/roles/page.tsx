"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ACCESS_GROUPS } from "@/config/access";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

interface RoleRow {
    slug: string;
    name: string;
    description?: string;
    isSystem: boolean;
    groups: string[];
    pageOverrides: Record<string, boolean>;
    userCount: number;
}

type OverrideValue = "default" | true | false;

export default function RolesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [roles, setRoles] = useState<RoleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state: null = closed; "new" = create form; slug = edit that role.
    const [editing, setEditing] = useState<string | "new" | null>(null);

    const loadRoles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/roles");
            if (response.status === 401 || response.status === 403) {
                router.replace("/dashboard");
                return;
            }
            if (!response.ok) throw new Error(String(response.status));
            const data = await response.json();
            setRoles(data.roles || []);
        } catch (err) {
            console.error("Failed to fetch roles:", err);
            setError("Не вдалося завантажити ролі");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (!session) return;
        loadRoles();
    }, [session, status, loadRoles]);

    const close = () => setEditing(null);

    if ((loading && roles.length === 0) || status === "loading") {
        return <TableSkeleton rows={5} />;
    }
    if (!session) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 max-sm:px-2 py-8 sm:py-10 space-y-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-light text-white">Ролі та доступ</h1>
                    <p className="text-sm text-white/40 mt-1">
                        Створіть власні ролі та налаштовуйте, які розділи бачить кожна роль.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setEditing("new")}
                    className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-accent text-black text-sm font-medium transition hover:opacity-90 shrink-0"
                >
                    <Plus className="h-4 w-4" />
                    Додати роль
                </button>
            </div>

            {error && (
                <p className="text-sm text-red-400">{error}</p>
            )}

            <div className="rounded-2xl border border-white/5 overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="h-11 px-4 text-left text-xs font-semibold text-white/35 uppercase tracking-wider">Роль</th>
                                <th className="h-11 px-4 text-left text-xs font-semibold text-white/35 uppercase tracking-wider hidden sm:table-cell">Опис</th>
                                <th className="h-11 px-4 text-right text-xs font-semibold text-white/35 uppercase tracking-wider">Користувачі</th>
                                <th className="h-11 px-4 text-right text-xs font-semibold text-white/35 uppercase tracking-wider">Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="h-24 text-center text-white/40">
                                        Ролей не знайдено.
                                    </td>
                                </tr>
                            ) : (
                                roles.map((role) => (
                                    <tr key={role.slug} className="border-b border-white/3 last:border-b-0 hover:bg-white/3 transition-colors">
                                        <td className="p-4 font-medium text-white/90">
                                            {role.name}
                                            {role.isSystem && (
                                                <span className="ml-2 text-[10px] uppercase tracking-wide text-white/30 border border-white/10 rounded px-1.5 py-0.5 align-middle">
                                                    системна
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 hidden sm:table-cell text-white/55 max-w-xs truncate">{role.description || "—"}</td>
                                        <td className="p-4 text-right tabular-nums text-white/70">{role.userCount}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditing(role.slug)}
                                                    title="Редагувати"
                                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                {!role.isSystem && (
                                                    <DeleteRoleButton role={role} onDeleted={() => loadRoles()} />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editing === "new" && (
                <CreateRoleModal onClose={close} onCreated={() => { close(); loadRoles(); }} />
            )}
            {typeof editing === "string" && (
                <EditRoleModal role={roles.find((r) => r.slug === editing)!} onClose={close} onSaved={() => { close(); loadRoles(); }} />
            )}
        </div>
    );
}

function DeleteRoleButton({ role, onDeleted }: { role: RoleRow; onDeleted: () => void }) {
    const [busy, setBusy] = useState(false);
    const handleDelete = async () => {
        if (!confirm(`Видалити роль «${role.name}»?`)) return;
        setBusy(true);
        try {
            const response = await fetch(`/api/roles/${encodeURIComponent(role.slug)}`, { method: "DELETE" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                alert(data.message || "Не вдалося видалити роль");
            } else {
                onDeleted();
            }
        } catch {
            alert("Помилка мережі — спробуйте ще раз");
        } finally {
            setBusy(false);
        }
    };
    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            title="Видалити"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-red-400/70 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
        >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
    );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-medium text-white">{title}</h2>
                    <button type="button" onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function CreateRoleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setBusy(true);
        setError(null);
        try {
            const response = await fetch("/api/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.message || "Не вдалося створити роль");
            } else {
                onCreated();
            }
        } catch {
            setError("Помилка мережі — спробуйте ще раз");
        } finally {
            setBusy(false);
        }
    };

    return (
        <ModalShell title="Нова роль" onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Назва ролі</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Наприклад: Бухгалтер"
                        maxLength={60}
                        autoFocus
                        className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50"
                    />
                </div>
                <p className="text-xs text-white/30">
                    Спочатку роль отримає доступ лише до кабінету — права можна буде налаштувати після створення.
                </p>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border border-white/10 text-sm text-white/70 transition hover:bg-white/5">
                        Скасувати
                    </button>
                    <button type="submit" disabled={busy || !name.trim()} className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-accent text-black text-sm font-medium transition hover:opacity-90 disabled:opacity-40">
                        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Створити
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function EditRoleModal({ role, onClose, onSaved }: { role: RoleRow; onClose: () => void; onSaved: () => void }) {
    const [name, setName] = useState(role.name);
    const [description, setDescription] = useState(role.description ?? "");
    const [groups, setGroups] = useState<Set<string>>(new Set(role.groups));
    const [overrides, setOverrides] = useState<Record<string, OverrideValue>>(() => {
        const init: Record<string, OverrideValue> = {};
        for (const [page, value] of Object.entries(role.pageOverrides ?? {})) init[page] = value;
        return init;
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSystem = role.isSystem;
    const isAdminLocked = role.slug === "admin";
    const permissionsLocked = isAdminLocked;

    const toggleGroup = (slug: string) => {
        setGroups((prev) => {
            const next = new Set(prev);
            if (next.has(slug)) next.delete(slug);
            else next.add(slug);
            return next;
        });
    };

    const setOverride = (page: string, value: OverrideValue) => {
        setOverrides((prev) => {
            const next = { ...prev };
            if (value === "default") delete next[page];
            else next[page] = value;
            return next;
        });
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const pageOverrides: Record<string, boolean> = {};
            for (const [page, value] of Object.entries(overrides)) {
                if (value !== "default") pageOverrides[page] = value;
            }
            const response = await fetch(`/api/roles/${encodeURIComponent(role.slug)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    ...(permissionsLocked ? {} : { groups: [...groups], pageOverrides }),
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.message || "Не вдалося зберегти роль");
            } else {
                onSaved();
            }
        } catch {
            setError("Помилка мережі — спробуйте ще раз");
        } finally {
            setBusy(false);
        }
    };

    return (
        <ModalShell title={`Роль: ${role.name}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-white/50 mb-1.5">Назва</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSystem || busy}
                            maxLength={60}
                            className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-accent/50 disabled:opacity-40"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-white/50 mb-1.5">Опис</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={busy}
                            maxLength={200}
                            placeholder="Короткий опис призначення ролі"
                            className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent/50 disabled:opacity-40"
                        />
                    </div>
                </div>

                <fieldset disabled={permissionsLocked || busy} className="space-y-3">
                    <legend className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Доступ до розділів</legend>
                    {ACCESS_GROUPS.map((group) => (
                        <div key={group.slug} className="rounded-xl border border-white/5 p-3 space-y-2.5">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={groups.has(group.slug)}
                                    onChange={() => toggleGroup(group.slug)}
                                    className="h-4 w-4 rounded accent-[#e8c392]"
                                />
                                <span className="text-sm text-white/85">{group.label}</span>
                            </label>
                            {groups.has(group.slug) && (
                                <div className="pl-6 space-y-1.5">
                                    {group.pages.map((page) => {
                                        const value = overrides[page.slug] ?? "default";
                                        return (
                                            <div key={page.slug} className="flex items-center justify-between gap-2">
                                                <span className="text-xs text-white/50">{page.label}</span>
                                                <select
                                                    value={value === "default" ? "" : value ? "allow" : "deny"}
                                                    onChange={(e) => setOverride(page.slug, e.target.value === "" ? "default" : e.target.value === "allow")}
                                                    className="h-7 rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-white/70 outline-none focus:border-accent/50"
                                                >
                                                    <option value="">за замовчуванням</option>
                                                    <option value="allow">дозволити</option>
                                                    <option value="deny">заборонити</option>
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </fieldset>

                {isAdminLocked && (
                    <p className="text-xs text-amber-400/80">Права адмін-ролі не можна змінювати — вона має доступ до всього.</p>
                )}
                {isSystem && !isAdminLocked && (
                    <p className="text-xs text-white/30">Назву системної ролі не можна змінити, але права можна налаштувати.</p>
                )}

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border border-white/10 text-sm text-white/70 transition hover:bg-white/5">
                        Скасувати
                    </button>
                    <button type="submit" disabled={busy || !name.trim()} className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-accent text-black text-sm font-medium transition hover:opacity-90 disabled:opacity-40">
                        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Зберегти
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
