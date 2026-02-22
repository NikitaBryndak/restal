"use client"

import { searchSuggestions } from "@/data";

type SearchExamplesProps = {
    handleSearch: (suggestion: string) => void;
}

export default function SearchExamples({ handleSearch }: SearchExamplesProps) {
    return (
        <div className="flex flex-wrap justify-center gap-2 px-4">
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    handleSearch(suggestion);
                  }}
                  className="px-4 py-2 text-xs sm:text-sm text-white/60 hover:text-white
                    bg-white/4 hover:bg-accent/10 border border-white/6 hover:border-accent/30 rounded-full transition-all duration-300"
                >
                  {suggestion}
                </button>
              ))}
        </div>
    )
}