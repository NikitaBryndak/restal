"use client";
import {Input} from "@/components/ui/input";

type SearchTitleProps = {
  search: string;
  setSearch: (name: string) => void;
}

export default function HeaderBlock({ search, setSearch }: SearchTitleProps) {
  return (
    // Title and Search bar on the same line
    <div className="flex items-center justify-between mb-10 border-b pb-4">
      {/* Title centered horizontally */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-3xl font-semibold text-accent text-4xl font-semibold [text-shadow:_1px_1px_2px_black,_-1px_-1px_2px_black,_1px_-1px_2px_black,_-1px_1px_2px_black]">INFOCENTRE</h1>
      </div>

      {/* Search bar aligned to right */}
      <div className="w-72">
        < Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)} // updates search state as user types
          placeholder="What are you looking for?" // “What are you looking for?”

         
        
        />
      </div>
    </div>
  );
}
