'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Dashboard Error]', error);
    }, [error]);

    return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 backdrop-blur-sm space-y-5">
                <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-red-500/15 p-3">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="space-y-1.5">
                        <h2 className="text-lg font-semibold text-red-400">Щось пішло не так</h2>
                        <p className="text-sm text-white/60 leading-relaxed">
                            Виникла непередбачена помилка. Спробуйте оновити сторінку.
                        </p>
                    </div>
                </div>

                {error?.message && (
                    <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-white/30 mb-2">Деталі помилки</p>
                        <p className="text-sm text-red-300/80 font-mono break-all leading-relaxed">
                            {error.message}
                        </p>
                    </div>
                )}

                <button
                    onClick={reset}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
                >
                    <RotateCcw className="h-4 w-4" />
                    Спробувати знову
                </button>
            </div>
        </div>
    );
}
