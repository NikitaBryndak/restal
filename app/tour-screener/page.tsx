"use client";

import { useEffect, useRef } from "react";

const SCRIPT_URLS = [
  "https://api.otpusk.com/api/2.4/session?access_token=3f80a-01423-b3ca6-0bbab-1a284",
  "https://export.otpusk.com/js/onsite/",
  "https://export.otpusk.com/js/order",
];

const CSS_URLS = [
  "https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700&subset=cyrillic",
  "https://export.otpusk.com/os/onsite/form.css",
  "https://export.otpusk.com/os/onsite/result.css",
  "https://export.otpusk.com/os/onsite/tour.css",
];

export default function TourScreenerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Guard against React Strict Mode double-invocation
    if (initialized.current) return;
    initialized.current = true;

    const container = containerRef.current;
    if (!container) return;

    // Set config variables — must happen before scripts execute
    (window as any).osGeo = "";
    (window as any).osDefaultDeparture = 2025;
    (window as any).osDefaultDuration = "";
    (window as any).osDateFrom = "";
    (window as any).osDateTo = "";
    (window as any).osHotelCategory = "";
    (window as any).osFood = "";
    (window as any).osTransport = "";
    (window as any).osTarget = "";
    (window as any).osContainer = container;
    (window as any).osTourContainer = container;
    (window as any).osLang = "ua";
    (window as any).osTourTargetBlank = false;
    (window as any).osOrderUrl = null;
    (window as any).osCurrency = "converted";
    (window as any).osAutoStart = false;

    // Inject stylesheets
    const links = CSS_URLS.map((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      return link;
    });

    // Load scripts sequentially INSIDE the container div
    // Many widget scripts render relative to the script tag location
    const scripts: HTMLScriptElement[] = [];

    const loadNext = (index: number) => {
      if (index >= SCRIPT_URLS.length) {
        // After all scripts loaded, grab any stray otpusk elements from body
        setTimeout(() => {
          document.querySelectorAll("body > [class*='os-'], body > [id*='os-'], body > [class*='otpusk'], body > [id*='otpusk']").forEach((el) => {
            container.appendChild(el);
          });
        }, 500);
        return;
      }
      const script = document.createElement("script");
      script.src = SCRIPT_URLS[index];
      script.async = false;
      script.onload = () => loadNext(index + 1);
      container.appendChild(script);
      scripts.push(script);
    };

    loadNext(0);

    return () => {
      links.forEach((l) => l.remove());
      scripts.forEach((s) => s.remove());
    };
  }, []);

  return (
    <main className="min-h-screen w-full pt-24 pb-12 px-4 sm:pt-16 max-sm:pt-14 max-sm:px-2 max-sm:pb-4">
      <div className="w-full max-w-6xl mx-auto">
        <div ref={containerRef} />
      </div>
    </main>
  );
}
