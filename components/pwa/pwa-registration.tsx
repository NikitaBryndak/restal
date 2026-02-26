"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on client mount.
 * Placed in the root layout so it runs on every page.
 */
export function PWARegistration() {
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator)) return;

        const registerSW = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                    updateViaCache: "none",
                });

                // Check for updates every 60 minutes
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);

                // Listen for service worker updates
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            // New version available — auto-activate without disrupting UX
                            newWorker.postMessage({ type: "SKIP_WAITING" });
                        }
                    });
                });
            } catch (error) {
                console.error("SW registration failed:", error);
            }
        };

        // Delay registration slightly to not block initial paint
        if (document.readyState === "complete") {
            registerSW();
        } else {
            window.addEventListener("load", registerSW, { once: true });
        }
    }, []);

    return null;
}
