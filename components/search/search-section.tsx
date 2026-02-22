"use client";

import { useState, useEffect } from "react";
import { Search, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "./search-bar";
import SearchExamples from "./search-examples";
import AiChatInline from "./ai-chat-inline";
import Link from "next/link";

type SearchSectionProps = {
  onChatToggle?: (open: boolean) => void;
};

export default function SearchSection({ onChatToggle }: SearchSectionProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");
  const [exitingChat, setExitingChat] = useState(false);

  useEffect(() => {
    onChatToggle?.(chatOpen);
  }, [chatOpen, onChatToggle]);

  const handleSearch = (suggestion: string) => {
    setInitialQuery(suggestion);
    setChatOpen(true);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchValue = formData.get("search-query") as string;
    if (searchValue.trim()) {
      handleSearch(searchValue.trim());
      (event.target as HTMLFormElement).reset();
    }
  };

  const handleCloseChat = () => {
    setExitingChat(true);
    setTimeout(() => {
      setChatOpen(false);
      setExitingChat(false);
      setInitialQuery("");
    }, 400);
  };

  // Chat mode — takes over the full space
  if (chatOpen) {
    return (
      <div className={`w-full transition-opacity duration-400 ${exitingChat ? "opacity-0" : "opacity-100"}`}>
        <AiChatInline onClose={handleCloseChat} initialQuery={initialQuery} />
      </div>
    );
  }

  // Normal landing mode
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="flex justify-center">
        <form onSubmit={handleFormSubmit} className="flex justify-center items-center w-full gap-2 p-3 rounded-2xl bg-white/4 border border-white/8 backdrop-blur-sm hover:border-white/12 focus-within:border-accent/30 focus-within:bg-white/6 transition-all duration-300 focus-within:shadow-[0_0_40px_rgba(15,164,230,0.06)]">
          <SearchBar />
          <Button
            type="submit"
            variant="outline"
            size="icon"
            className="size-10 rounded-xl text-foreground/50 hover:text-foreground hover:border-accent transition-colors"
          >
            <Search className="w-4 h-4" />
          </Button>

          <Link
            href="/contact"
            className="hover:bg-accent hover:text-white hover:border-accent hidden p-2 bg-white/90 text-black rounded-xl transition-colors sm:flex items-center justify-center gap-2 text-sm"
          >
            Контакти
            <Send className="w-4 h-4 shrink-0" />
          </Link>
        </form>
      </div>

      {/* Search Suggestions */}
      <div className="space-y-3">
        <p className="text-xs text-white/40 uppercase tracking-widest font-medium text-center">
          Спробуйте запитати
        </p>
        <SearchExamples handleSearch={handleSearch} />
      </div>
    </div>
  );
}