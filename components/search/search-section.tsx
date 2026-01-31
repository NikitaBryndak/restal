"use client";

import { Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "./search-bar";
import SearchExamples from "./search-examples";
import Link from "next/link";

export default function SearchSection() {
  const handleSearch = (_suggestion: string) => {
    // Search functionality - coming soon
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchValue = formData.get('search-query') as string;
    handleSearch(searchValue);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex justify-center">
        <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20 animate-pulse">
          ✨ AI Search Coming Soon
        </span>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center">
        <form onSubmit={handleFormSubmit} className="flex justify-center items-center w-full gap-2 p-2.5 rounded-lg bg-input-bg backdrop-blur-sm">
          <SearchBar disabled={true} className="disabled:opacity-70 disabled:cursor-not-allowed" />
          <Button
            type="submit"
            variant="outline"
            size="icon"
            className="size-10 text-foreground/50 hover:text-foreground hover:border-accent transition-colors"
            disabled={true}
          >
            <Search className="w-4 h-4" />
          </Button>

          <Link
            href="/contact"
            className="hover:bg-accent hover:text-white hover:border-accent hidden p-2 bg-white/90 text-black rounded-md transition-colors sm:flex items-center justify-center gap-2 text-sm"
          >
            Contact
            <Send className="w-4 h-4 flex-shrink-0" />
          </Link>
        </form>
      </div>

      {/* Search Suggestions */}
      <div className="space-y-2 opacity-50 pointer-events-none select-none">
        <p className="text-sm text-white/50">
          For example:
        </p>
        <SearchExamples handleSearch={handleSearch} />
      </div>
    </div>
  );
}