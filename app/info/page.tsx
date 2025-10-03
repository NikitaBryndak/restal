"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function InfoPage() {
  const names = ["First", "Second", "Third", "Fourth", "Fifth"];
  const [selected, setSelected] = useState("First");

  return (
    <div className="h-screen flex flex-col pt-20"> {/* wraps all page content in one div element */}
      <div className="flex gap-4 p-4 border-b"> {/* wraps all buttons in one div element */}
        {names.map((name) => ( 
          /* maps every name from array to button */
          <button
            key={name} // sets unique key for each button
            onClick={() => setSelected(name)}
            className={`
              px-8 py-3 text-lg font-semibold transition
              rounded-full        /* fully rounded cloud shape */
              shadow-lg           /* soft shadow for floating effect */
              bg-white            /* cloud color */
              text-blue-900       /* dark blue text */
              hover:bg-blue-100
              hover:shadow-xl
              border border-gray-200
              ${
                selected === name
                  ? "bg-blue-200 shadow-2xl"
                  : ""
              }
            `}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center text-2xl">
        {selected} content goes here
      </div>
    </div>
  );
}
