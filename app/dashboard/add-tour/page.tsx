'use client';

import { FormProvider } from 'react-hook-form';
import TripCard from '@/components/trip/trip-card';
import { Button } from '@/components/ui/button';
import { usePreviewData } from './hooks/usePreviewData';
import { useAddTourForm } from './hooks/useAddTourForm';

import { BasicDetailsSection, FlightsSection, TravellerSection, PhoneSection, StaySection, ExtrasSection, PaymentSection, DocumentsSection } from './components';

export default function AddTourPage() {
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

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
                <header className="space-y-2 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/40">Tours</p>
                    <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">Add a new tour</h1>
                    <p className="text-sm text-foreground/60">Register a new tour for a client.</p>
                </header>

                <div className="grid gap-6">
                    <aside className="sticky top-24 h-fit space-y-4 z-10">
                        <div className="rounded-3xl border border-border/40 bg-white/70 p-4 backdrop-blur-xl dark:bg-white/10">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                                Live preview
                            </p>
                        </div>
                        {previewState.country ? (
                            <TripCard data={previewData} />
                        ) : (
                            <div className="rounded-3xl border border-dashed border-border/50 p-6 text-center text-sm text-foreground/50">
                                Add a destination above to see the live preview.
                            </div>
                        )}
                    </aside>

                    <FormProvider {...form}>
                        <form
                            onSubmit={onSubmit}
                            className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8"
                        >
                            <div className="space-y-10">
                                <BasicDetailsSection />
                                <FlightsSection />
                                <TravellerSection />
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

                            <div className="mt-10 flex justify-end border-t border-border/40 pt-6">
                                <Button type="submit" size="lg" className="px-8" disabled={isUploading}>
                                    {isUploading ? 'Uploading & Creating...' : 'Create tour'}
                                </Button>
                            </div>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </div>
    );
}
