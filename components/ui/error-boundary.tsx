'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Copy, Check } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallbackTitle?: string;
    fallbackDescription?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, copied: false };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    };

    handleCopy = () => {
        const { error, errorInfo } = this.state;
        const text = [
            `Помилка: ${error?.message ?? 'Невідома помилка'}`,
            `Час: ${new Date().toLocaleString('uk-UA')}`,
            `URL: ${typeof window !== 'undefined' ? window.location.href : ''}`,
            '',
            'Stack trace:',
            error?.stack ?? 'Не доступний',
            '',
            'Component stack:',
            errorInfo?.componentStack ?? 'Не доступний',
        ].join('\n');

        navigator.clipboard.writeText(text).then(() => {
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2000);
        });
    };

    render() {
        if (this.state.hasError) {
            const { error, copied } = this.state;
            const {
                fallbackTitle = 'Щось пішло не так',
                fallbackDescription = 'Виникла непередбачена помилка. Спробуйте оновити сторінку або скопіюйте деталі помилки та надішліть адміністратору.',
            } = this.props;

            return (
                <div className="min-h-[50vh] flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 backdrop-blur-sm space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl bg-red-500/15 p-3">
                                <AlertTriangle className="h-6 w-6 text-red-400" />
                            </div>
                            <div className="space-y-1.5">
                                <h2 className="text-lg font-semibold text-red-400">{fallbackTitle}</h2>
                                <p className="text-sm text-white/60 leading-relaxed">{fallbackDescription}</p>
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

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Спробувати знову
                            </button>
                            <button
                                onClick={this.handleCopy}
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
                        </div>

                        <p className="text-xs text-white/30">
                            Надішліть скопійовану помилку адміністратору для швидшого вирішення.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
