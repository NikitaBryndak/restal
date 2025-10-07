"use client";
export default function HeaderBlock({ search, setSearch }) {
  return (
    // Title and Search bar on the same line
    <div className="flex items-center justify-between mb-10 border-b pb-4">
      {/* Title centered horizontally */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-3xl font-semibold text-blue-900">ІНФОЦЕНТР</h1>
      </div>

      {/* Search bar aligned to right */}
      <div className="w-72">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)} // updates search state as user types
          placeholder="Що ви шукаєте?" // “What are you looking for?”
          className="w-full px-4 py-2 rounded-full border border-gray-300 shadow-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        />
      </div>
    </div>
  );
}
