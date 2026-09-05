"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Copy, Send, X } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { TELEGRAM_BOT_USERNAME } from "@/config/constants";

const DISMISS_KEY = "tg-bind-prompt-dismissed";
const BOT_URL = `https://t.me/${TELEGRAM_BOT_USERNAME}`;
/** After this long the card collapses into a slim pill so it stops covering page content. */
const COLLAPSE_MS = 8000;
/** How long the "copied" feedback stays visible. */
const COPIED_FLASH_MS = 2000;

/** Copy text to clipboard with a fallback for non-secure contexts / blocked permissions. */
async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand("copy");
            ta.remove();
            return ok;
        } catch {
            return false;
        }
    }
}

/**
 * Global floating prompt for users who opted in to Telegram notifications but
 * have not linked their chat yet. Rendered on every page (root layout) until
 * the user sends the one-time bind code to the Telegram bot (see TELEGRAM_BOT_USERNAME) or opts out.
 *
 * Behavior: expanded card for COLLAPSE_MS, then auto-collapses into a slim pill
 * at the bottom edge so it never covers page content; tapping the pill expands
 * again (stays expanded until dismissed). The primary action copies the bind
 * code to the clipboard before opening the bot — the user just pastes in chat.
 */
export function TelegramBindPrompt() {
    const { status } = useSession();
    const { userProfile, loading, refetch } = useUserProfile();
    const [dismissed, setDismissed] = useState(false);
    const [optingOut, setOptingOut] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [copied, setCopied] = useState<"none" | "chip" | "send">("none");

    useEffect(() => {
        if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    }, []);

    const show =
        status === "authenticated" &&
        !loading &&
        userProfile?.notifyTelegram === true &&
        !userProfile.telegramChatId &&
        !!userProfile.telegramBindCode &&
        !dismissed;

    // Auto-collapse once the card has been visible long enough to be read.
    useEffect(() => {
        if (!show || collapsed) return;
        const t = setTimeout(() => setCollapsed(true), COLLAPSE_MS);
        return () => clearTimeout(t);
    }, [show, collapsed]);

    if (!show) return null;

    const code = userProfile.telegramBindCode as string;

    const flashCopied = (which: "chip" | "send") => {
        setCopied(which);
        window.setTimeout(() => setCopied((c) => (c === which ? "none" : c)), COPIED_FLASH_MS);
    };

    const handleCopyChip = async () => {
        if (await copyToClipboard(code)) flashCopied("chip");
    };

    // Anchor keeps native navigation (no popup-blocker race); the click only copies.
    const handleOpenBotClick = () => {
        void copyToClipboard(code).then((ok) => ok && flashCopied("send"));
    };

    const handleDismiss = () => {
        // Hidden for this browser session only — reappears in a new one until bound.
        sessionStorage.setItem(DISMISS_KEY, "1");
        setDismissed(true);
    };

    const handleOptOut = async () => {
        if (optingOut) return;
        setOptingOut(true);
        try {
            await fetch("/api/auth/preferences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notifyTelegram: false }),
            });
            await refetch(); // profile update hides the prompt (notifyTelegram=false)
        } finally {
            setOptingOut(false);
        }
    };

    if (collapsed) {
        return (
            <button
                type="button"
                onClick={() => setCollapsed(false)}
                aria-label="Розгорнути Telegram-сповіщення"
                className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center justify-between gap-3 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/15 pl-3 pr-2 py-2 shadow-lg animate-in fade-in duration-300 cursor-pointer"
            >
                <span className="flex items-center gap-2 min-w-0">
                    <Send className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="text-xs text-white/70 truncate">Надішліть код боту</span>
                </span>
                <span className="font-mono font-bold text-sm text-sky-300 bg-white/10 rounded-full px-2.5 py-1 shrink-0">
                    {code}
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="backdrop-blur-xl bg-slate-900/70 border border-white/10 ring-1 ring-sky-500/20 rounded-2xl shadow-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-linear-to-br from-sky-500 to-cyan-400 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
                        <Send className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white text-sm">Увімкнути Telegram-сповіщення?</p>
                        <p className="text-xs text-white/70 mt-1 leading-relaxed">
                            Надішліть код{" "}
                            <button
                                type="button"
                                onClick={handleCopyChip}
                                aria-label={`Скопіювати код ${code}`}
                                className="inline-flex items-center gap-1 font-mono font-bold text-sky-300 bg-white/10 hover:bg-white/20 rounded-lg px-1.5 py-0.5 transition-colors cursor-pointer"
                            >
                                {copied === "chip" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {code}
                            </button>{" "}
                            боту @{TELEGRAM_BOT_USERNAME} — і оновлення про ваші тури надходитимуть у Telegram.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="text-white/40 hover:text-white shrink-0 cursor-pointer"
                        aria-label="Сховати"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={BOT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleOpenBotClick}
                        className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors"
                    >
                        {copied === "send" ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        {copied === "send" ? "Скопійовано" : "Відкрити бота"}
                    </a>
                    <button
                        type="button"
                        onClick={handleOptOut}
                        disabled={optingOut}
                        className="h-9 px-3 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 text-sm transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {optingOut ? "..." : "Не потрібні"}
                    </button>
                </div>
            </div>
        </div>
    );
}
