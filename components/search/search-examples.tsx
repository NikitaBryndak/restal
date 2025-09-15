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
                  className="px-3 py-1.5 text-xs sm:text-sm text-white/70 hover:text-white
                    bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
        </div>
    )
}