"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Shows a styled install prompt banner for PWA installation.
 * Only appears on supported browsers after the beforeinstallprompt event fires.
 * Dismissed for 7 days if the user closes it.
 */
export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed recently
        const dismissedAt = localStorage.getItem("pwa-install-dismissed");
        if (dismissedAt) {
            const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show after a short delay so user gets oriented first
            setTimeout(() => setShowBanner(true), 3000);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Detect when app gets installed
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowBanner(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === "accepted") {
            setIsInstalled(true);
        }
        setShowBanner(false);
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    };

    if (!showBanner || isInstalled) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl shadow-black/40">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center shrink-0">
                        <Download className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">Встановити RestAL</p>
                        <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                            Додайте на головний екран для швидкого доступу та офлайн-перегляду подорожей
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-white/40 hover:text-white/70 transition-colors p-0.5"
                        aria-label="Закрити"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={handleInstall}
                        className="flex-1 bg-accent hover:bg-accent/90 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
                    >
                        Встановити
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-white/60 hover:text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
                    >
                        Не зараз
                    </button>
                </div>
            </div>
        </div>
    );
}
