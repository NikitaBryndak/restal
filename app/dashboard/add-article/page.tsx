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
import { DashboardFormSkeleton } from "@/components/ui/skeleton";

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
        return <DashboardFormSkeleton />;
    }

    if (!session || (session.user?.privilegeLevel ?? 1) < 2) {
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
                                        <FormInput
                                            labelText="URL зображення"
                                            type="text"
                                            placeholder="Введіть URL зображення"
                                            required
                                            {...register("images")}
                                        />
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-white/60">
                                                Тег статті
                                            </label>
                                            <select
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent/50"
                                                {...register("tag")}
                                            >
                                                <option value="Популярні країни" className="bg-black">Популярні країни</option>
                                                <option value="Корисно знати" className="bg-black">Корисно знати</option>
                                                <option value="Шпаргалки мандрівникам" className="bg-black">Шпаргалки мандрівникам</option>
                                                <option value="Інструкції сайта" className="bg-black">Інструкції сайта</option>
                                                <option value="Послуги" className="bg-black">Послуги</option>
                                                <option value="Умови бронювання" className="bg-black">Умови бронювання</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-sm font-medium text-white/60">
                                                Контент <span className="text-red-400">*</span>
                                            </label>
                                            <Controller
                                                name="content"
                                                control={form.control}
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                    <RichTextEditor
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
