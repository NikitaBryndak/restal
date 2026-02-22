"use client";

import { useState, useCallback, useEffect } from "react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { titleTextFadeDuration } from "@/config";
import SearchSection from "@/components/search/search-section";

export default function SearchPage() {
  const [chatActive, setChatActive] = useState(false);

  const handleChatToggle = useCallback((open: boolean) => {
    setChatActive(open);
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-chat-active", chatActive ? "true" : "false");
    return () => document.body.removeAttribute("data-chat-active");
  }, [chatActive]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 max-sm:px-3 overflow-x-hidden">
      <div className="relative z-10 w-full max-w-3xl mx-auto text-center flex flex-col gap-12 max-sm:gap-8 items-center">

        {/* Title */}
        <div
          className={`transition-all duration-700 ease-out ${
            chatActive
              ? "opacity-0 -translate-y-12 max-h-0 overflow-hidden pointer-events-none"
              : "opacity-100 translate-y-0 max-h-40"
          }`}
        >
          <TextGenerateEffect
            className="text-4xl sm:text-5xl md:text-6xl tracking-tight font-light text-white text-balance leading-tight"
            words="Знайдіть свою ідеальну подорож"
            duration={titleTextFadeDuration}
            accentClassName="text-accent font-bold"
            accentWords={["ідеальну"]}
          />
        </div>

        {/* Search Section */}
        <SearchSection onChatToggle={handleChatToggle} />
      </div>
    </main>
  );
}
