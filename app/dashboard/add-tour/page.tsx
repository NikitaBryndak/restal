'use client';

import { FormProvider } from 'react-hook-form';
import TripCard from '@/components/trip/trip-card';
import { Button } from '@/components/ui/button';
import { usePreviewData } from './hooks/usePreviewData';
import { useAddTourForm } from './hooks/useAddTourForm';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { DashboardFormSkeleton } from "@/components/ui/skeleton";

import { BasicDetailsSection, FlightsSection, TravellerSection, PhoneSection, StaySection, ExtrasSection, PaymentSection, DocumentsSection } from './components';

export default function AddTourPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;
        if (!session || (session.user?.privilegeLevel ?? 1) < 2) {
            router.replace("/dashboard");
        }
    }, [session, status, router]);

    const {
        form,
        previewState,
        onSubmit,
        documents,
        pendingFiles,
        isUploading,
        handleFileSelect,
        handleFileClear,
        handleToggleReady
    } = useAddTourForm();
    const previewData = usePreviewData(previewState);

    if (status === "loading") {
        return <DashboardFormSkeleton />;
    }

    if (!session || (session.user?.privilegeLevel ?? 1) < 2) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
                <header className="space-y-2 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/40">Тури</p>
                    <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">Додати новий тур</h1>
                    <p className="text-sm text-foreground/60">Зареєструйте новий тур для клієнта.</p>
                </header>

                <aside className="space-y-4">
                    <div className="rounded-3xl border border-border/40 bg-white/70 p-4 backdrop-blur-xl dark:bg-white/10">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                            Попередній перегляд
                        </p>
                    </div>
                    {previewState.country ? (
                        <TripCard data={previewData} />
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border/50 p-6 text-center text-sm text-foreground/50">
                            Додайте напрямок, щоб побачити попередній перегляд.
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
                                <BasicDetailsSection />
                                <FlightsSection />
                                <TravellerSection variant="create" />
                                <PhoneSection />
                                <StaySection />
                                <DocumentsSection
                                    documents={documents}
                                    pendingFiles={pendingFiles}
                                    onFileSelect={handleFileSelect}
                                    onFileClear={handleFileClear}
                                    onToggleReady={handleToggleReady}
                                />
                                <ExtrasSection />
                                <PaymentSection />
                            </div>

                            <div className="mt-10 flex flex-col gap-4 border-t border-border/40 pt-6">
                                {Object.keys(form.formState.errors).length > 0 && (
                                    <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                                Форма містить помилки
                                            </p>
                                            <p className="text-xs text-red-500/80">
                                                Будь ласка, перевірте всі поля, виділені червоним, і виправте помилки перед створенням туру.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <Button type="submit" size="lg" className="px-8" disabled={isUploading}>
                                        {isUploading ? 'Завантаження та створення...' : 'Створити тур'}
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
