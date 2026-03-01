'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, Copy, Check, Home } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        console.error('[App Error]', error);
    }, [error]);

    const handleCopy = () => {
        const text = [
            `Помилка: ${error?.message ?? 'Невідома помилка'}`,
            `Час: ${new Date().toLocaleString('uk-UA')}`,
            `URL: ${typeof window !== 'undefined' ? window.location.href : ''}`,
            `Digest: ${error?.digest ?? 'N/A'}`,
            '',
            'Stack trace:',
            error?.stack ?? 'Не доступний',
        ].join('\n');

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 backdrop-blur-sm space-y-5">
                <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-red-500/15 p-3">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="space-y-1.5">
                        <h2 className="text-lg font-semibold text-red-400">Щось пішло не так</h2>
                        <p className="text-sm text-white/60 leading-relaxed">
                            Виникла непередбачена помилка на сторінці. Спробуйте оновити або скопіюйте деталі помилки та зверніться до адміністратора.
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

                {error?.digest && (
                    <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-white/30 mb-1">Ідентифікатор</p>
                        <p className="text-xs text-white/40 font-mono">
                            {error.digest}
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Спробувати знову
                    </button>
                    <button
                        onClick={handleCopy}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-emerald-400" />
                                Скопійовано
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                Скопіювати помилку
                            </>
                        )}
                    </button>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        На головну
                    </a>
                </div>

                <p className="text-xs text-white/30">
                    Скопіюйте деталі помилки та надішліть адміністратору для швидшого вирішення.
                </p>
            </div>
        </div>
    );
}
