
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search, Trash2, Edit, AlertCircle } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Article {
    _id: string;
    articleID: number;
    title: string;
    description: string;
    tag: string;
    creatorPhone: string;
    createdAt: string;
    status?: string; // If status exists in future schema
}

export default function ManageArticlesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTag, setFilterTag] = useState('All');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch articles
    const fetchArticles = async () => {
        try {
            const response = await fetch('/api/articles');
            if (response.ok) {
                const data = await response.json();
                setArticles(data.articles);
            }
        } catch (error) {
            console.error('Failed to fetch articles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            if ((session?.user?.privilegeLevel ?? 1) < 2) {
                router.replace('/dashboard');
            } else {
                fetchArticles();
            }
        } else if (status === 'unauthenticated') {
            router.replace('/login');
        }
    }, [status, session, router]);

    // Handle Delete
    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/articles/${deleteId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setArticles(prev => prev.filter(article => article._id !== deleteId));
                setDeleteId(null);
            } else {
                alert('Failed to delete article');
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('Error deleting article');
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter and Search
    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  article.creatorPhone.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = filterTag === 'All' || article.tag === filterTag;
            return matchesSearch && matchesTag;
        });
    }, [articles, searchQuery, filterTag]);

    const uniqueTags = useMemo(() => {
        const predefinedTags = ["Популярні країни", "Корисно знати", "Шпаргалки мандрівникам", "Інструкції сайта", "Послуги", "Умови бронювання"];
        const loadedTags = Array.from(new Set(articles.map(a => a.tag)));
        // Combine and dedup
        const allTags = Array.from(new Set([...predefinedTags, ...loadedTags]));
        return ['All', ...allTags];
    }, [articles]);

    if (loading || status === 'loading') {
        return <TableSkeleton rows={5} />;
    }

    if (!session || (session.user?.privilegeLevel ?? 1) < 2) {
        return null; // Redirect handled in useEffect
    }

    return (
        <div className="max-w-5xl mx-auto px-4 max-sm:px-2 py-8 sm:py-10 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-light text-white">Керування статтями</h1>
                    <p className="text-sm text-white/40 mt-1">Редагуйте та видаляйте статті</p>
                </div>
                <Link href="/dashboard/add-article">
                    <Button className="bg-accent hover:bg-accent/90 text-white rounded-xl h-10 px-5 font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all duration-200">
                        <Plus className="mr-2 h-4 w-4" /> Додати статтю
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <Input
                        placeholder="Пошук за назвою або автором..."
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-10 focus:border-accent/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="h-10 w-full sm:w-[200px] rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 outline-none transition focus:border-accent/50"
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                >
                    {uniqueTags.map(tag => (
                        <option key={tag} value={tag} className="bg-black text-white">{tag}</option>
                    ))}
                </select>
            </div>

            <div className="rounded-2xl border border-white/5 overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="h-11 px-4 text-left text-xs font-semibold text-white/35 uppercase tracking-wider">Назва</th>
                                <th className="h-11 px-4 text-left text-xs font-semibold text-white/35 uppercase tracking-wider hidden md:table-cell">Тег</th>
                                <th className="h-11 px-4 text-left text-xs font-semibold text-white/35 uppercase tracking-wider hidden sm:table-cell">Автор</th>
                                <th className="h-11 px-4 text-left text-xs font-semibold text-white/35 uppercase tracking-wider hidden lg:table-cell">Дата</th>
                                <th className="h-11 px-4 text-right text-xs font-semibold text-white/35 uppercase tracking-wider">Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredArticles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="h-24 text-center text-white/40">
                                        Статей не знайдено.
                                    </td>
                                </tr>
                            ) : (
                                filteredArticles.map((article) => (
                                    <tr key={article._id} className="border-b border-white/3 last:border-b-0 hover:bg-white/3 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-white/90">{article.title}</div>
                                            <div className="text-xs text-white/35 md:hidden mt-0.5">{article.tag}</div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <span className="inline-flex items-center rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">
                                                {article.tag}
                                            </span>
                                        </td>
                                        <td className="p-4 hidden sm:table-cell text-white/55">{article.creatorPhone}</td>
                                        <td className="p-4 hidden lg:table-cell text-white/55">
                                            {new Date(article.createdAt).toLocaleDateString('uk-UA', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <Link href={`/dashboard/manage-articles/${article._id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-accent hover:bg-accent/10 rounded-lg">
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                                    onClick={() => setDeleteId(article._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-black/90 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-red-500/15 border border-red-500/25 rounded-xl">
                                <AlertCircle className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Видалити статтю</h3>
                                <p className="text-sm text-white/50">
                                    Ви впевнені, що хочете видалити цю статтю? Цю дію неможливо скасувати.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteId(null)}
                                disabled={isDeleting}
                                className="border-white/10 text-white/70 hover:bg-white/5 rounded-xl"
                            >
                                Скасувати
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Видалення...
                                    </>
                                ) : (
                                    'Видалити'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
