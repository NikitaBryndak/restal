"use client";

import ArticleCard from "@/components/article/article-card";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/form-input";
import { FormProvider } from "react-hook-form";
import { useAddArticleForm } from "./hooks/useAddArticleForm";
import { usePreviewData } from './hooks/usePreviewData';

export default function AddArticlePage() {
    const { form, previewState, onSubmit } = useAddArticleForm();
    const previewData = usePreviewData({ ...previewState, creatorEmail: previewState.creatorEmail || "" });
    const { register } = form;

    return (
        <div className="min-h-screen bg-background py-20">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
                <header className="space-y-2 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/40">Articles</p>
                    <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">Add a new article</h1>
                    <p className="text-sm text-foreground/60">Register a new article for a client.</p>
                </header>

                <div className="grid gap-6">
                    <aside className="sticky top-24 h-fit space-y-4 z-10">
                        <div className="rounded-3xl border border-border/40 bg-white/70 p-4 backdrop-blur-xl dark:bg-white/10">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                                Live preview
                            </p>
                        </div>

                        {previewState.title || previewState.description ? (
                        <ArticleCard data={previewData} />
                        ) : (
                        <div className="text-sm text-muted">
                            Start filling the form to see preview
                        </div>
                        )}

                        
                    </aside>
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
                                        <FormInput
                                            labelText="Content"
                                            type="text"
                                            placeholder="Enter article content"
                                            required
                                            {...register("content")}
                                        />
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-foreground/80">
                                                Article Tag
                                            </label>
                                            <select
                                                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                {...register("tag")}
                                            >
                                                <option value="All">All</option>
                                                <option value="First">First</option>
                                                <option value="Second">Second</option>
                                                <option value="Third">Third</option>
                                                <option value="Fourth">Fourth</option>
                                                <option value="Fifth">Fifth</option>
                                            </select>
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
