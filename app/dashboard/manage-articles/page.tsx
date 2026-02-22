
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
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
                    <p className="text-muted-foreground">Manage your articles here.</p>
                </div>
                <Link href="/dashboard/add-article">
                    <Button className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Add Article
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or author..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="flex h-10 w-full sm:w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                >
                    {uniqueTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                    ))}
                </select>
            </div>

            <div className="rounded-md border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Tag</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">Author</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredArticles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No articles found.
                                    </td>
                                </tr>
                            ) : (
                                filteredArticles.map((article) => (
                                    <tr key={article._id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">
                                            <div className="text-base">{article.title}</div>
                                            <div className="text-xs text-muted-foreground md:hidden">{article.tag}</div>
                                        </td>
                                        <td className="p-4 align-middle hidden md:table-cell">
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {article.tag}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle hidden sm:table-cell">{article.creatorPhone}</td>
                                        <td className="p-4 align-middle hidden lg:table-cell">
                                            {new Date(article.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/dashboard/manage-articles/${article._id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive/90"
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
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-destructive/10 rounded-full">
                                <AlertCircle className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Delete Article</h3>
                                <p className="text-sm text-muted-foreground">
                                    Are you sure you want to delete this article? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteId(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
