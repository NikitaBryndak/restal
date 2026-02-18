"use client";

import { useEffect } from "react";

export default function TourScreenerPage() {
  useEffect(() => {
    // Set config variables before scripts load
    (window as any).osGeo = "";
    (window as any).osDefaultDeparture = 2025;
    (window as any).osDefaultDuration = "";
    (window as any).osDateFrom = "";
    (window as any).osDateTo = "";
    (window as any).osHotelCategory = "";
    (window as any).osFood = "";
    (window as any).osTransport = "";
    (window as any).osTarget = "";
    (window as any).osContainer = null;
    (window as any).osTourContainer = null;
    (window as any).osLang = "ua";
    (window as any).osTourTargetBlank = false;
    (window as any).osOrderUrl = null;
    (window as any).osCurrency = "converted";
    (window as any).osAutoStart = false;

    // Inject stylesheets
    const cssUrls = [
      "https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700&subset=cyrillic",
      "https://export.otpusk.com/os/onsite/form.css",
      "https://export.otpusk.com/os/onsite/result.css",
      "https://export.otpusk.com/os/onsite/tour.css",
    ];

    const links = cssUrls.map((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      return link;
    });

    // Load scripts sequentially — order matters
    const scriptUrls = [
      "https://api.otpusk.com/api/2.4/session?access_token=3f80a-01423-b3ca6-0bbab-1a284",
      "https://export.otpusk.com/js/onsite/",
      "https://export.otpusk.com/js/order",
    ];

    const scripts: HTMLScriptElement[] = [];

    const loadNext = (index: number) => {
      if (index >= scriptUrls.length) return;
      const script = document.createElement("script");
      script.src = scriptUrls[index];
      script.onload = () => loadNext(index + 1);
      document.head.appendChild(script);
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
      <div className="w-full max-w-6xl mx-auto" />
    </main>
  );
}
