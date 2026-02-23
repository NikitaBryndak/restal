
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, FormProvider, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/form-input";
import RichTextEditor from "@/components/ui/rich-text-editor";
import ArticleCard from "@/components/article/article-card";
import Link from 'next/link';
import { MANAGER_PRIVILEGE_LEVEL } from "@/config/constants";

// Schema Definition (duplicated from add-article/schema.ts for safety)
const articleSchema = z.object({
    tag: z.enum(["Популярні країни", "Корисно знати", "Шпаргалки мандрівникам", "Інструкції сайта", "Послуги", "Умови бронювання"]),
    images: z.string().min(1, "Image URL is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    content: z.string().min(1, "Content is required"),
    creatorPhone: z.string().optional(), // Make optional here as we might not edit it
});

type ArticleFormValues = z.infer<typeof articleSchema>;

export default function EditArticlePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const [params, setParams] = useState<{ id: string } | null>(null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Resolve params
    useEffect(() => {
        paramsPromise.then(setParams);
    }, [paramsPromise]);

    const form = useForm<ArticleFormValues>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: "",
            description: "",
            content: "",
            images: "",
            tag: "Популярні країни",
            creatorPhone: "",
        },
        mode: 'onChange',
    });

    const { register, control, reset, setValue } = form;
    const formValues = useWatch({ control });

    // Fetch Article Data
    useEffect(() => {
        if (!params?.id) return;

        const fetchArticle = async () => {
            try {
                const response = await fetch(`/api/articles/${params.id}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.article) {
                        reset({
                            title: data.article.title,
                            description: data.article.description,
                            content: data.article.content,
                            images: data.article.images,
                            tag: data.article.tag,
                            creatorPhone: data.article.creatorPhone,
                        });
                    }
                } else {
                    console.error("Failed to fetch article");
                    // router.push('/dashboard/manage-articles');
                }
            } catch (error) {
                console.error("Error fetching article:", error);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchArticle();
        }
    }, [params?.id, reset, session, router]);


    // Auth Check
    useEffect(() => {
        if (status === "loading") return;
        if (!session || (session.user?.privilegeLevel ?? 1) < MANAGER_PRIVILEGE_LEVEL) {
            router.replace("/dashboard");
        }
    }, [session, status, router]);

    // Preview Logic
    const previewData = useMemo(() => {
        return {
            title: formValues.title || "Untitled article",
            description: formValues.description || "No description provided",
            content: formValues.content || "Start writing your article...",
            images: formValues.images || "",
            tag: (formValues.tag as any) || "Популярні країни",
            creatorPhone: formValues.creatorPhone || session?.user?.phoneNumber || "",
            _id: params?.id || "preview-id",
            articleID: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }, [formValues, session, params?.id]);


    const onSubmit = async (data: ArticleFormValues) => {
        if (!params?.id) return;
        setSubmitting(true);
        try {
            const response = await fetch(`/api/articles/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                router.push('/dashboard/manage-articles');
                router.refresh();
            } else {
                alert('Failed to update article');
            }
        } catch (error) {
            console.error('Error updating article:', error);
            alert('Error updating article');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || status === "loading") {
        return (
            <div className="py-10 sm:py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!session || (session.user?.privilegeLevel ?? 1) < MANAGER_PRIVILEGE_LEVEL) {
        return null;
    }

    return (
        <div className="py-10 sm:py-12">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
                <header className="space-y-4">
                    <Link href="/dashboard/manage-articles" className="inline-flex items-center text-sm text-white/40 hover:text-white">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Articles
                    </Link>
                    <div className="space-y-2 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/30">Articles</p>
                        <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">Edit Article</h1>
                        <p className="text-sm text-white/50">Update article details and content.</p>
                    </div>
                </header>

                <aside className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                            Live preview
                        </p>
                    </div>

                    {previewData.title || previewData.description ? (
                        <ArticleCard data={previewData} />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">
                            Start filling the form to see preview
                        </div>
                    )}
                </aside>

                <div>
                    <FormProvider {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8"
                        >
                            <div className="space-y-10">
                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-6">Article Details</h2>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <FormInput
                                            labelText="Title"
                                            type="text"
                                            placeholder="Enter article title"
                                            required
                                            {...register("title")}
                                        />
                                        <FormInput
                                            labelText="Description"
                                            type="text"
                                            placeholder="Enter article description"
                                            required
                                            {...register("description")}
                                        />
                                        <FormInput
                                            labelText="Image URL"
                                            type="text"
                                            placeholder="Enter image URL"
                                            required
                                            {...register("images")}
                                        />
                                         <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-sm font-medium text-white/60">Tag</label>
                                            <select
                                                className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                                                {...register("tag")}
                                            >
                                                <option value="Популярні країни">Популярні країни</option>
                                                <option value="Корисно знати">Корисно знати</option>
                                                <option value="Шпаргалки мандрівникам">Шпаргалки мандрівникам</option>
                                                <option value="Інструкції сайта">Інструкції сайта</option>
                                                <option value="Послуги">Послуги</option>
                                                <option value="Умови бронювання">Умови бронювання</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-sm font-medium text-white/60">
                                                Content <span className="text-red-500">*</span>
                                            </label>
                                            <div className="min-h-[400px] overflow-hidden rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-accent/30">
                                                <Controller
                                                    name="content"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <RichTextEditor
                                                            value={field.value || ""}
                                                            onChange={field.onChange}
                                                            placeholder="Start writing..."
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-end gap-4 pt-4 border-t">
                                    <Link href="/dashboard/manage-articles">
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </div>
    );
}
