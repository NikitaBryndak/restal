"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

/**
 * Shows a subtle banner at the top of the viewport when the user goes offline.
 * Auto-hides and shows a "Back online" message when connection is restored.
 */
export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    const [showRestored, setShowRestored] = useState(false);

    useEffect(() => {
        const goOffline = () => setIsOffline(true);
        const goOnline = () => {
            setIsOffline(false);
            // Briefly show "restored" message
            setShowRestored(true);
            setTimeout(() => setShowRestored(false), 3000);
            // Trigger background sync if supported
            if ("serviceWorker" in navigator && "SyncManager" in window) {
                navigator.serviceWorker.ready.then((reg) => {
                    (reg as any).sync?.register("sync-notifications").catch(() => {});
                });
            }
        };

        // Check initial state
        if (!navigator.onLine) setIsOffline(true);

        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);

        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, []);

    if (!isOffline && !showRestored) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[9999] text-center text-sm font-medium py-2 px-4 transition-all duration-300 ${
                isOffline
                    ? "bg-amber-600/90 text-white backdrop-blur-sm"
                    : "bg-emerald-600/90 text-white backdrop-blur-sm"
            }`}
        >
            {isOffline ? (
                <span className="inline-flex items-center gap-2">
                    <WifiOff className="w-4 h-4" />
                    Немає підключення до інтернету — деякі функції можуть бути недоступні
                </span>
            ) : (
                <span>✓ З&apos;єднання відновлено</span>
            )}
        </div>
    );
}
