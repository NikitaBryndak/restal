"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { titleTextFadeDuration } from "@/config";
import SearchSection from "@/components/search/search-section";
import { ToursSoldCounter } from "@/components/ui/tours-sold-counter";

type HomeContentProps = {
  tripCount: number;
};

export default function HomeContent({ tripCount }: HomeContentProps) {
  const [chatActive, setChatActive] = useState(false);

  const handleChatToggle = useCallback((open: boolean) => {
    setChatActive(open);
  }, []);

  // Set data attribute on body so Navbar/Footer can hide via CSS
  useEffect(() => {
    document.body.setAttribute("data-chat-active", chatActive ? "true" : "false");
    return () => document.body.removeAttribute("data-chat-active");
  }, [chatActive]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 max-sm:px-3 overflow-x-hidden">
      <div className="relative z-10 w-full max-w-3xl mx-auto text-center flex flex-col gap-12 max-sm:gap-8 items-center">

        {/* Title — slides out when chat is active */}
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

        {/* Search Section — stays, but transforms */}
        <SearchSection onChatToggle={handleChatToggle} />

        {/* Stats Counter — fades out */}
        <div
          className={`pt-8 transition-all duration-500 ease-out ${
            chatActive
              ? "opacity-0 translate-y-8 max-h-0 overflow-hidden pointer-events-none"
              : "opacity-100 translate-y-0 max-h-40"
          }`}
        >
          <ToursSoldCounter count={tripCount} />
        </div>

        {/* Contact button — fades out */}
        <div
          className={`flex justify-center transition-all duration-500 ease-out ${
            chatActive
              ? "opacity-0 translate-y-8 max-h-0 overflow-hidden pointer-events-none"
              : "opacity-100 translate-y-0 max-h-20"
          }`}
        >
          <Link
            href="/contact"
            className="hover:bg-accent hover:text-white hover:border-accent sm:hidden w-32 p-2 bg-white/90 text-black rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
          >
            Контакти
            <Send className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
