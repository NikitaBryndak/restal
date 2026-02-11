"use client";

import { useEffect, useRef } from "react";

export default function TourScreenerPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "resize" && typeof e.data.height === "number") {
        if (iframeRef.current) {
          iframeRef.current.style.height = `${e.data.height}px`;
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <main className="min-h-screen w-full flex flex-col items-center pt-24 pb-12 px-4 sm:pt-16 max-sm:pt-14 max-sm:px-1 max-sm:pb-4">
      <div className="w-full max-w-6xl mx-auto">
        <iframe
          ref={iframeRef}
          src="/tour-screener.html"
          className="w-full border-0 rounded-2xl max-sm:rounded-xl"
          style={{ minHeight: "80vh", background: "transparent" }}
          title="Пошук турів"
          loading="lazy"
        />
      </div>
    </main>
  );
}