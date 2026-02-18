"use client";

import { useEffect, useRef, useState } from "react";

const WIDGET_HTML = `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script>
    var osGeo = '';
    var osDefaultDeparture = 2025;
    var osDefaultDuration = '';
    var osDateFrom = '';
    var osDateTo = '';
    var osHotelCategory = '';
    var osFood = '';
    var osTransport = '';
    var osTarget = '';
    var osContainer = null;
    var osTourContainer = null;
    var osLang = 'ua';
    var osTourTargetBlank = false;
    var osOrderUrl = null;
    var osCurrency = 'converted';
    var osAutoStart = false;
  </script>
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700&subset=cyrillic" rel="stylesheet" />
  <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/form.css" />
  <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/result.css" />
  <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/tour.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      font-family: 'Open Sans', sans-serif;
      background: transparent;
      overflow-x: hidden;
    }
    body { padding: 0; }
    .os-form, .os-results, .os-tour {
      max-width: 100% !important;
      width: 100% !important;
    }
    @media (max-width: 640px) {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <script src="https://api.otpusk.com/api/2.4/session?access_token=3f80a-01423-b3ca6-0bbab-1a284"></script>
  <script src="https://export.otpusk.com/js/onsite/"></script>
  <script src="https://export.otpusk.com/js/order"></script>
  <script>
    (function () {
      var lastHeight = 0;
      function postHeight() {
        var height = document.documentElement.scrollHeight;
        if (height !== lastHeight) {
          lastHeight = height;
          window.parent.postMessage({ type: 'otpusk-resize', height: height }, '*');
        }
      }
      setInterval(postHeight, 300);
      window.addEventListener('load', postHeight);
      window.addEventListener('resize', postHeight);
      if (window.MutationObserver) {
        new MutationObserver(postHeight).observe(document.body, {
          childList: true, subtree: true, attributes: true, characterData: true
        });
      }
    })();
  </script>
</body>
</html>`;

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
    <main className="min-h-screen w-full flex flex-col items-center pt-24 pb-12 px-4 sm:pt-16 max-sm:pt-14 max-sm:px-2 max-sm:pb-4">
      <div className="w-full max-w-6xl mx-auto">
        <iframe
          ref={iframeRef}
          srcDoc={WIDGET_HTML}
          title="Пошук турів"
          style={{
            width: "100%",
            height: `${iframeHeight}px`,
            border: "none",
            overflow: "hidden",
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
