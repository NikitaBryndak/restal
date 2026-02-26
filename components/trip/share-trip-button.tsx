"use client";

import { useState } from "react";
import { Share2, Copy, Check, Link2Off } from "lucide-react";

type ShareTripButtonProps = {
    tripId: string;
    existingToken?: string;
};

export default function ShareTripButton({ tripId, existingToken }: ShareTripButtonProps) {
    const [token, setToken] = useState(existingToken || "");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showPanel, setShowPanel] = useState(false);

    const shareUrl = token && typeof window !== "undefined" ? `${window.location.origin}/shared/trip/${token}` : "";

    const generateLink = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/trips/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripId }),
            });
            const data = await res.json();
            if (data.token) {
                setToken(data.token);
            }
        } catch (err) {
            console.error("Failed to generate share link:", err);
        } finally {
            setLoading(false);
        }
    };

    const revokeLink = async () => {
        setLoading(true);
        try {
            await fetch("/api/trips/share", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripId }),
            });
            setToken("");
        } catch (err) {
            console.error("Failed to revoke share link:", err);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const input = document.createElement("input");
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setShowPanel(!showPanel);
                    if (!token && !showPanel) generateLink();
                }}
                className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 border border-white/30 hover:bg-white/30 transition-colors flex items-center gap-2 cursor-pointer"
            >
                <Share2 className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">Поділитися</span>
            </button>

            {showPanel && (
                <>
                    {/* Mobile: fixed bottom sheet overlay */}
                    <div className="sm:hidden fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
                    <div className="sm:hidden fixed left-4 right-4 bottom-6 z-[91] bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 p-4 shadow-2xl">
                        <p className="text-sm font-semibold text-white mb-3">Публічне посилання</p>
                        {loading ? (
                            <div className="flex items-center gap-2 text-white/50 text-sm py-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-accent rounded-full animate-spin" />
                                Генеруємо...
                            </div>
                        ) : token ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input readOnly value={shareUrl} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 truncate" />
                                    <button onClick={copyLink} className="shrink-0 p-2 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors cursor-pointer">
                                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-accent" />}
                                    </button>
                                </div>
                                <p className="text-xs text-white/40">Будь-хто з цим посиланням зможе бачити основну інформацію про подорож (без особистих даних та документів).</p>
                                <button onClick={revokeLink} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer">
                                    <Link2Off className="w-3 h-3" />
                                    Деактивувати посилання
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-white/50">Не вдалося створити посилання</p>
                        )}
                    </div>

                    {/* Desktop: dropdown above button */}
                    <div className="hidden sm:block absolute right-0 bottom-full mb-2 w-80 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 p-4 shadow-2xl z-50">
                        <p className="text-sm font-semibold text-white mb-3">Публічне посилання</p>
                        {loading ? (
                            <div className="flex items-center gap-2 text-white/50 text-sm py-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-accent rounded-full animate-spin" />
                                Генеруємо...
                            </div>
                        ) : token ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input readOnly value={shareUrl} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 truncate" />
                                    <button onClick={copyLink} className="shrink-0 p-2 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors cursor-pointer">
                                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-accent" />}
                                    </button>
                                </div>
                                <p className="text-xs text-white/40">Будь-хто з цим посиланням зможе бачити основну інформацію про подорож (без особистих даних та документів).</p>
                                <button onClick={revokeLink} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer">
                                    <Link2Off className="w-3 h-3" />
                                    Деактивувати посилання
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-white/50">Не вдалося створити посилання</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
