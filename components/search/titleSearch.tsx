"use client";

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
        <h1 className="text-3xl font-semibold text-[#0099ff] text-4xl font-semibold [text-shadow:_1px_1px_2px_black,_-1px_-1px_2px_black,_1px_-1px_2px_black,_-1px_1px_2px_black]">INFOCENTRE</h1>
      </div>

      {/* Search bar aligned to right */}
      <div className="w-72">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)} // updates search state as user types
          placeholder="What are you looking for?" // “What are you looking for?”
          className="w-full px-4 py-2 rounded-full border border-gray-300 shadow-sm text-[#0099ff] placeholder-[#0099ff]/60 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        />
      </div>
    </div>
  );
}
