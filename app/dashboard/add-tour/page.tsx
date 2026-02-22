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
        <div className="min-h-screen py-10 sm:py-12">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
                <header className="space-y-2 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/30">Тури</p>
                    <h1 className="text-2xl sm:text-3xl font-light text-white">Додати новий <span className="text-accent font-bold">тур</span></h1>
                    <p className="text-sm text-white/50">Зареєструйте новий тур для клієнта.</p>
                </header>

                <aside className="space-y-4">
                    <div className="rounded-2xl border border-white/5 bg-white/3 p-4 backdrop-blur-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/35">
                            Попередній перегляд
                        </p>
                    </div>
                    {previewState.country ? (
                        <TripCard data={previewData} />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">
                            Додайте напрямок, щоб побачити попередній перегляд.
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

                            <div className="mt-10 flex flex-col gap-4 border-t border-white/5 pt-6">
                                {Object.keys(form.formState.errors).length > 0 && (
                                    <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4">
                                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-red-400">
                                                Форма містить помилки
                                            </p>
                                            <p className="text-xs text-red-400/70">
                                                Будь ласка, перевірте всі поля, виділені червоним, і виправте помилки перед створенням туру.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <Button type="submit" size="lg" className="px-8 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all duration-200" disabled={isUploading}>
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
