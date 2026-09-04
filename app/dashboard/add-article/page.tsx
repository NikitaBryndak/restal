"use client";

import ArticleCard from "@/components/article/article-card";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/form-input";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { FormProvider, Controller, useFieldArray } from "react-hook-form";
import { X } from "lucide-react";
import { useAddArticleForm } from "./hooks/useAddArticleForm";
import { usePreviewData } from './hooks/usePreviewData';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardFormSkeleton } from "@/components/ui/skeleton";

export default function AddArticlePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { form, previewState, onSubmit } = useAddArticleForm();
    const previewData = usePreviewData({ ...previewState, creatorPhone: previewState.creatorPhone || "" });
    const { register, control } = form;
    const { fields: imageFields, append: addImage, remove: removeImage } = useFieldArray({ control, name: "images" });

    useEffect(() => {
        if (status === "loading") return;
        const allowed = session?.user?.allowedPages ?? [];
        if (!session || !allowed.includes("add-article")) {
            router.replace("/dashboard");
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <DashboardFormSkeleton />;
    }

    const allowed = session?.user?.allowedPages ?? [];
    if (!session || !allowed.includes("add-article")) {
        return null;
    }

    return (
        <div className="min-h-screen py-10 sm:py-12">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
                <header className="space-y-2 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/30">Статті</p>
                    <h1 className="text-2xl sm:text-3xl font-light text-white">Додати нову <span className="text-accent font-bold">статтю</span></h1>
                    <p className="text-sm text-white/50">Зареєструйте нову статтю.</p>
                </header>

                <aside className="space-y-4">
                    <div className="rounded-2xl border border-white/5 bg-white/3 p-4 backdrop-blur-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/35">
                            Попередній перегляд
                        </p>
                    </div>

                    {previewState.title || previewState.description ? (
                        <ArticleCard data={previewData} />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">
                            Почніть заповнювати форму, щоб побачити попередній перегляд
                        </div>
                    )}
                </aside>

                <div>
                    <FormProvider {...form}>
                        <form
                            onSubmit={onSubmit}
                            className="rounded-2xl sm:rounded-3xl border border-white/5 bg-white/3 p-6 backdrop-blur-sm sm:p-8"
                        >
                            <div className="space-y-10">
                                <section>
                                    <h2 className="text-xl font-semibold text-white mb-6">Деталі статті</h2>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <FormInput
                                            labelText="Назва"
                                            type="text"
                                            placeholder="Введіть назву статті"
                                            required
                                            {...register("title")}
                                        />
                                        <FormInput
                                            labelText="Опис"
                                            type="text"
                                            placeholder="Введіть опис статті"
                                            required
                                            {...register("description")}
                                        />
                                        <div className="space-y-2 md:col-span-2">
                                            <label htmlFor="article-images" className="text-sm font-medium text-white/60">
                                                URL зображень <span className="text-red-400">*</span>
                                            </label>
                                            {imageFields.map((field, index) => (
                                                <div key={field.id} className="flex items-center gap-2">
                                                    <input
                                                        id={index === 0 ? "article-images" : undefined}
                                                        type="text"
                                                        placeholder={index === 0 ? "Головне зображення — введіть URL" : "Додаткове зображення — введіть URL"}
                                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent/50 placeholder:text-white/25"
                                                        {...register(`images.${index}.url`)}
                                                    />
                                                    {imageFields.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="shrink-0 p-2 text-white/40 hover:text-red-400 transition-colors"
                                                            aria-label="Видалити зображення"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addImage({ url: "" })}
                                                className="text-sm text-white/50 hover:text-accent transition-colors"
                                            >
                                                + Додати зображення
                                            </button>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="article-tag" className="text-sm font-medium text-white/60">
                                                Тег статті
                                            </label>
                                            <select
                                                id="article-tag"
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent/50"
                                                {...register("tag")}
                                            >
                                                <option value="Каталог Послуг" className="bg-black">Каталог Послуг</option>
                                                <option value="Корисно знати" className="bg-black">Корисно знати</option>
                                                <option value="Шпаргалки мандрівникам" className="bg-black">Шпаргалки мандрівникам</option>
                                                <option value="Інструкції сайта" className="bg-black">Інструкції сайта</option>
                                                <option value="Умови бронювання" className="bg-black">Умови бронювання</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="article-status" className="text-sm font-medium text-white/60">
                                                Опублікація
                                            </label>
                                            <select
                                                id="article-status"
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent/50"
                                                {...register("status")}
                                            >
                                                <option value="published" className="bg-black">Опублікувати одразу</option>
                                                <option value="draft" className="bg-black">Зберегти як чернетку</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label htmlFor="article-content" className="text-sm font-medium text-white/60">
                                                Контент <span className="text-red-400">*</span>
                                            </label>
                                            <Controller
                                                name="content"
                                                control={form.control}
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                    <RichTextEditor
                                                        id="article-content"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Почніть писати статтю… Використовуйте панель інструментів або вставте простий текст та натисніть Авто-формат."
                                                        minHeight="350px"
                                                    />
                                                )}
                                            />
                                            <p className="text-xs text-white/35">
                                                Використовуйте панель інструментів для форматування тексту.
                                                Ctrl+B жирний · Ctrl+I курсив · Ctrl+U підкреслення · Ctrl+K посилання
                                            </p>
                                        </div>
                                    </div>
                                </section>
                             </div>
                            <div className="mt-10 flex justify-end border-t border-white/5 pt-6">
                                <Button type="submit" size="lg" className="px-8 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all duration-200">
                                    Створити статтю
                                </Button>
                            </div>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </div>
    );
}
