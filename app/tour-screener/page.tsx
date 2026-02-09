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
    <main className="min-h-screen w-full flex flex-col items-center pt-24 pb-12 px-4">
      <div className="w-full max-w-6xl mx-auto">
        <iframe
          ref={iframeRef}
          src="/tour-screener.html"
          className="w-full border-0 rounded-2xl overflow-hidden"
          style={{ minHeight: "80vh", background: "white" }}
          title="Пошук турів"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </main>
  );
}