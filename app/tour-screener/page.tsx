"use client";

import { useEffect, useRef, useState } from "react";

export default function TourScreenerPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(800);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "otpusk-resize" && typeof event.data.height === "number") {
        setIframeHeight(event.data.height);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <main className="min-h-screen w-full pt-24 pb-12 px-4 sm:pt-16 max-sm:pt-14 max-sm:px-2 max-sm:pb-4">
      <div className="w-full max-w-6xl mx-auto">
        <iframe
          ref={iframeRef}
          src="/otpusk-widget.html"
          title="Пошук турів"
          style={{
            width: "100%",
            height: `${Math.max(iframeHeight, 600)}px`,
            border: "none",
            display: "block",
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          allow="clipboard-write"
          loading="eager"
        />
      </div>
    </main>
  );
}
