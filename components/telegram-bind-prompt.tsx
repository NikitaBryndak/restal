"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Send, X } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

const DISMISS_KEY = "tg-bind-prompt-dismissed";

/**
 * Global floating prompt for users who opted in to Telegram notifications but
 * have not linked their chat yet. Rendered on every page (root layout) until
 * the user sends the one-time bind code to @restal_info_bot or opts out.
 */
export function TelegramBindPrompt() {
    const { status } = useSession();
    const { userProfile, loading, refetch } = useUserProfile();
    const [dismissed, setDismissed] = useState(false);
    const [optingOut, setOptingOut] = useState(false);

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

    if (!show) return null;

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

    return (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl shadow-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-sky-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <Send className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white text-sm">Увімкнути Telegram-сповіщення?</p>
                        <p className="text-xs text-white/70 mt-1 leading-relaxed">
                            Надішліть код{" "}
                            <span className="font-mono font-bold text-sky-300 select-all">{userProfile.telegramBindCode}</span>{" "}
                            боту @restal_info_bot — і оновлення про ваші тури надходитимуть у Telegram.
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
                        href="https://t.me/restal_info_bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        Відкрити бота
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
