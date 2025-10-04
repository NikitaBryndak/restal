"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function InfoPage() {
  // Array of button names
  const names = ["First", "Second", "Third", "Fourth", "Fifth"];
  // State to track which button is selected
  const [selected, setSelected] = useState("First");
  // State to store search input
  const [search, setSearch] = useState("");

  return (
    // wraps all page content in one div element
    <div className="h-screen flex flex-col pt-20">

      {/* wraps all buttons in one div element */}
      <div className="flex gap-4 p-4 border-b">
        {names.map((name) => {
          const isActive = selected === name; // checks if current button is active

          return (
            // maps every name from array to button
            <button
              key={name} // sets unique key for each button
              onClick={() => setSelected(name)} // sets selected button on click
              className={`
                px-6 py-3 font-semibold rounded-md border border-black transition
                ${
                  isActive
                    ? "bg-[#0099ff] text-white"
                    : "bg-white text-black hover:bg-[#0099ff] hover:text-white"
                }
              `}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start pt-10 gap-6">
        {/* Search bar */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)} // updates search state as user types
          placeholder={`Search in ${selected}`}
          className="w-1/2 px-4 py-3 rounded-full border-2 border-gray-300 shadow-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        />

        {/* Display selected content */}
        <div className="mt-6 text-2xl">
          {selected} content goes here
        </div>
      </div>
    </div>
  );
}