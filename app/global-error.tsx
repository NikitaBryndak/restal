'use client';

import { useEffect, useState } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        console.error('[GlobalError]', error);
    }, [error]);

    const errorDetails = [
        `Помилка: ${error?.message ?? 'Невідома помилка'}`,
        `Час: ${new Date().toLocaleString('uk-UA')}`,
        `URL: ${typeof window !== 'undefined' ? window.location.href : ''}`,
        `Digest: ${error?.digest ?? 'N/A'}`,
        '',
        'Stack trace:',
        error?.stack ?? 'Не доступний',
    ].join('\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(errorDetails).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <html lang="uk">
            <body style={{ margin: 0, backgroundColor: '#000', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ width: '100%', maxWidth: '32rem', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '2rem', backdropFilter: 'blur(8px)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                    <path d="M12 9v4" />
                                    <path d="M12 17h.01" />
                                </svg>
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f87171', margin: '0 0 0.375rem 0' }}>
                                    Критична помилка
                                </h2>
                                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>
                                    Виникла серйозна помилка на сторінці. Спробуйте оновити сторінку або скопіюйте деталі помилки та зверніться до адміністратора.
                                </p>
                            </div>
                        </div>

                        {error?.message && (
                            <div style={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.3)', padding: '1rem', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', margin: '0 0 0.5rem 0' }}>
                                    Деталі помилки
                                </p>
                                <p style={{ fontSize: '0.875rem', color: 'rgba(252, 165, 165, 0.8)', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', wordBreak: 'break-all', lineHeight: 1.6, margin: 0 }}>
                                    {error.message}
                                </p>
                            </div>
                        )}

                        {error?.digest && (
                            <div style={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', margin: '0 0 0.25rem 0' }}>
                                    Ідентифікатор
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', margin: 0 }}>
                                    {error.digest}
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <button
                                onClick={reset}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', backgroundColor: '#0fa4e6', border: 'none', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'opacity 0.2s' }}
                                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                    <path d="M21 3v5h-5" />
                                </svg>
                                Спробувати знову
                            </button>
                            <button
                                onClick={handleCopy}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                            >
                                {copied ? (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                        Скопійовано
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                        </svg>
                                        Скопіювати помилку
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => { window.location.href = '/'; }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                На головну
                            </button>
                        </div>

                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                            Скопіюйте деталі помилки та надішліть адміністратору для швидшого вирішення.
                        </p>
                    </div>
                </div>
            </body>
        </html>
    );
}
