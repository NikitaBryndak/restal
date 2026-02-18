"use client";

import ArticleCard from "@/components/article/article-card";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/form-input";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { FormProvider, Controller } from "react-hook-form";
import { useAddArticleForm } from "./hooks/useAddArticleForm";
import { usePreviewData } from './hooks/usePreviewData';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AddArticlePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { form, previewState, onSubmit } = useAddArticleForm();
    const previewData = usePreviewData({ ...previewState, creatorPhone: previewState.creatorPhone || "" });
    const { register } = form;

    useEffect(() => {
        if (status === "loading") return;
        if (!session || (session.user?.privilegeLevel ?? 1) < 2) {
            router.replace("/dashboard");
        }
    }, [session, status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-background py-20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session || (session.user?.privilegeLevel ?? 1) < 2) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background py-20">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
                <header className="space-y-2 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/40">Articles</p>
                    <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">Add a new article</h1>
                    <p className="text-sm text-foreground/60">Register a new article for a client.</p>
                </header>

                <aside className="space-y-4">
                    <div className="rounded-3xl border border-border/40 bg-white/70 p-4 backdrop-blur-xl dark:bg-white/10">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                            Live preview
                        </p>
                    </div>

                    {previewState.title || previewState.description ? (
                        <ArticleCard data={previewData} />
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border/50 p-6 text-center text-sm text-foreground/50">
                            Start filling the form to see preview
                        </div>
                    )}
                </aside>

                <div>
                    <FormProvider {...form}>
                        <form
                            onSubmit={onSubmit}
                            className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8"
                        >
                            <div className="space-y-10">
                                <section>
                                    <h2 className="text-2xl font-semibold text-foreground mb-6">Article Details</h2>
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
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-foreground/80">
                                                Article Tag
                                            </label>
                                            <select
                                                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                                            <label className="text-sm font-medium text-foreground/80">
                                                Content <span className="text-red-500">*</span>
                                            </label>
                                            <Controller
                                                name="content"
                                                control={form.control}
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                    <RichTextEditor
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Start writing your article… Use the toolbar above or paste plain text and click Auto-format."
                                                        minHeight="350px"
                                                    />
                                                )}
                                            />
                                            <p className="text-xs text-foreground/50">
                                                Use the toolbar to format text, or write plain text and click &quot;Auto-format&quot; to convert it to HTML.
                                                Keyboard shortcuts: Ctrl+B bold · Ctrl+I italic · Ctrl+U underline · Ctrl+K link
                                            </p>
                                        </div>
                                    </div>
                                </section>
                             </div>
                            <div className="mt-10 flex justify-end border-t border-border/40 pt-6">
                                <Button type="submit" size="lg" className="px-8">
                                    Create Article
                                </Button>
                            </div>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </div>
    );
}
