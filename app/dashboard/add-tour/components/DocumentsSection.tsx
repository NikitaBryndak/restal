import { DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Documents, DEFAULT_DOCUMENTS, DOCUMENT_LABELS, DOCUMENT_KEYS } from '@/types';

type DocumentsSectionProps = {
    documents: Documents;
    pendingFiles: Record<keyof Documents, File | null>;
    onToggleReady: (key: keyof Documents, isReady: boolean) => void;
    onFileSelect: (key: keyof Documents, file: File) => void;
    onFileClear: (key: keyof Documents) => void;
};

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

    return (
        <section className="rounded-3xl border border-border/40 bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 dark:shadow-none sm:p-8">
            <h2 className="text-2xl font-semibold text-foreground">Documents</h2>
            <p className="text-sm text-foreground/60">Toggle availability and stage files for future upload. Selected files stay on this device until the upload flow is implemented.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
                {DOCUMENT_KEYS.map((key) => {
                    const document = documents[key] ?? DEFAULT_DOCUMENTS[key];
                    const pendingFile = pendingFiles[key];
                    return (
                        <div key={key} className="rounded-2xl border border-border/40 bg-white/60 p-4 dark:bg-white/10">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">{DOCUMENT_LABELS[key]}</h3>
                                    <p className="text-xs text-foreground/50">Stage the latest file and mark it ready when it&apos;s approved.</p>
                                </div>
                                <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={document.uploaded}
                                        onChange={(event) => onToggleReady(key, event.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    Ready
                                </label>
                            </div>
                            <div
                                className="mt-3 rounded-xl border border-dashed border-border/60 bg-white/40 p-4 text-center text-sm text-foreground/60 transition-colors hover:border-foreground/40 dark:bg-white/10"
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
                                    className="flex cursor-pointer flex-col items-center gap-2 text-xs font-medium text-foreground"
                                >
                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                                        {pendingFile?.name ?? 'Select or drop a file'}
                                    </span>
                                    <span className="text-foreground/50">
                                        {pendingFile ? 'File staged locally. Upload coming soon.' : 'Drag & drop or click to choose a file.'}
                                    </span>
                                </label>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/60">
                                {pendingFile && (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => onFileClear(key)}>
                                        Clear selection
                                    </Button>
                                )}
                                {document.url && (
                                    <a
                                        href={document.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary underline"
                                    >
                                        View existing link
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
