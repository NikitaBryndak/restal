import { DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Documents, DEFAULT_DOCUMENTS, DOCUMENT_LABELS, DOCUMENT_KEYS } from '@/types';
import { FileText, Plane, PlaneTakeoff, PlaneLanding } from 'lucide-react';

type DocumentsSectionProps = {
    documents: Documents;
    pendingFiles: Record<keyof Documents, File | null>;
    onToggleReady: (key: keyof Documents, isReady: boolean) => void;
    onFileSelect: (key: keyof Documents, file: File) => void;
    onFileClear: (key: keyof Documents) => void;
};

// Group document keys into categories
const mainDocuments: (keyof Documents)[] = ['contract', 'invoice', 'confirmation', 'voucher', 'insurancePolicy', 'tourProgram', 'memo'];
const departureTickets: (keyof Documents)[] = ['departureTicket1', 'departureTicket2', 'departureTicket3', 'departureTicket4'];
const arrivalTickets: (keyof Documents)[] = ['arrivalTicket1', 'arrivalTicket2', 'arrivalTicket3', 'arrivalTicket4'];

export const DocumentsSection = ({
    documents,
    pendingFiles,
    onToggleReady,
    onFileSelect,
    onFileClear,
}: DocumentsSectionProps) => {
    const handleDocumentDrop = (event: DragEvent<HTMLDivElement>, key: keyof Documents) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            onFileSelect(key, file);
        }
    };

    const renderDocumentCard = (key: keyof Documents, compact: boolean = false) => {
        const document = documents[key] ?? DEFAULT_DOCUMENTS[key];
        const pendingFile = pendingFiles[key];

        if (compact) {
            // Compact version for tickets
            return (
                <div key={key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-sm font-medium text-white truncate">{DOCUMENT_LABELS[key]}</h3>
                        <label className="flex items-center gap-1 text-xs text-white/60 shrink-0">
                            <input
                                type="checkbox"
                                checked={document.uploaded}
                                onChange={(event) => onToggleReady(key, event.target.checked)}
                                className="h-3 w-3"
                            />
                            ✓
                        </label>
                    </div>
                    <div
                        className="rounded-lg border border-dashed border-white/10 bg-white/5 p-2 text-center text-xs text-white/40 transition-colors hover:border-white/30"
                        onDragOver={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                        }}
                        onDrop={(event) => handleDocumentDrop(event, key)}
                    >
                        <input
                            id={`document-file-${key}`}
                            type="file"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                    onFileSelect(key, file);
                                }
                                event.target.value = '';
                            }}
                        />
                        <label
                            htmlFor={`document-file-${key}`}
                            className="flex cursor-pointer items-center justify-center gap-1 text-xs text-white"
                        >
                            {pendingFile ? (
                                <span className="text-primary truncate max-w-[100px]">{pendingFile.name}</span>
                            ) : document.url ? (
                                <span className="text-emerald-600">Завантажено</span>
                            ) : (
                                <span className="text-white/40">+ Додати</span>
                            )}
                        </label>
                    </div>
                    {(pendingFile || document.url) && (
                        <div className="mt-1 flex items-center justify-between gap-1 text-[10px]">
                            {pendingFile && (
                                <button type="button" onClick={() => onFileClear(key)} className="text-red-500 hover:underline">
                                    ✗
                                </button>
                            )}
                            {document.url && (
                                <a href={document.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    ↗
                                </a>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Full version for main documents
        return (
            <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-semibold text-white">{DOCUMENT_LABELS[key]}</h3>
                        <p className="text-xs text-white/40">Додайте файл та позначте готовим.</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-medium text-white/60">
                        <input
                            type="checkbox"
                            checked={document.uploaded}
                            onChange={(event) => onToggleReady(key, event.target.checked)}
                            className="h-4 w-4"
                        />
                        Готово
                    </label>
                </div>
                <div
                    className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-center text-sm text-white/40 transition-colors hover:border-white/30"
                    onDragOver={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                    onDrop={(event) => handleDocumentDrop(event, key)}
                >
                    <input
                        id={`document-file-${key}`}
                        type="file"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                                onFileSelect(key, file);
                            }
                            event.target.value = '';
                        }}
                    />
                    <label
                        htmlFor={`document-file-${key}`}
                        className="flex cursor-pointer flex-col items-center gap-2 text-xs font-medium text-white"
                    >
                        <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">
                            {pendingFile?.name ?? 'Виберіть або перетягніть файл'}
                        </span>
                        <span className="text-white/40">
                            {pendingFile ? 'Буде завантажено при збереженні.' : 'Перетягніть або натисніть.'}
                        </span>
                    </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
                    {pendingFile && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => onFileClear(key)}>
                            Очистити вибір
                        </Button>
                    )}
                    {document.url && (
                        <a href={document.url} target="_blank" rel="noreferrer" className="text-primary underline">
                            Переглянути
                        </a>
                    )}
                </div>
            </div>
        );
    };

    return (
        <section className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-linear-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10 border border-indigo-500/20">
                <div className="p-2 rounded-lg bg-indigo-500/20">
                    <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white">Документи</h2>
                    <p className="text-sm text-white/50">Завантажте документи туру. Файли зберігаються при збереженні туру.</p>
                </div>
            </div>

            {/* Main Documents */}
            <div className="grid gap-4 md:grid-cols-2">
                {mainDocuments.map((key) => renderDocumentCard(key, false))}
            </div>

            {/* Tickets Section */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Plane className="w-5 h-5 text-sky-500" />
                    <h3 className="text-lg font-semibold text-white">Авіаквитки</h3>
                </div>

                {/* Departure Tickets */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <PlaneTakeoff className="w-4 h-4 text-sky-400" />
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">Квитки на виліт (до 4)</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {departureTickets.map((key) => renderDocumentCard(key, true))}
                    </div>
                </div>

                {/* Arrival Tickets */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <PlaneLanding className="w-4 h-4 text-indigo-400" />
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">Квитки на повернення (до 4)</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {arrivalTickets.map((key) => renderDocumentCard(key, true))}
                    </div>
                </div>
            </div>
        </section>
    );
};
