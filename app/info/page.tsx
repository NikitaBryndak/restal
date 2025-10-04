"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InfoPage() {
  // Array of button names
  const names = ["First", "Second", "Third", "Fourth", "Fifth"];
  // State to track which button is selected
  const [selected, setSelected] = useState("First");
  // State to store search input
  const [search, setSearch] = useState("");

  // Array of article boxes (photo, description, and link)
  const contentItems = [
    {
      title: "Exploring Japan",
      description: "Discover the hidden gems of Japan, from Tokyo’s lights to Kyoto’s temples.",
      image: "/images/japan.jpg",
      link: "/articles/japan",
    },
    {
      title: "Adventures in Iceland",
      description: "Experience waterfalls, glaciers, and the magical Northern Lights.",
      image: "/images/iceland.webp",
      link: "/articles/iceland",
    },
    {
      title: "Wonders of Morocco",
      description: "A guide through Morocco’s deserts, markets, and rich culture.",
      image: "/images/morocco.jpg",
      link: "/articles/morocco",
    },
  ];

  // Filters the articles based on search input
  const filteredItems = contentItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="flex-1 flex flex-col items-center justify-start pt-10 gap-6 overflow-y-auto">
        {/* Search bar */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)} // updates search state as user types
          placeholder={`Search in ${selected}`}
          className="w-1/2 px-4 py-3 rounded-full border-2 border-gray-300 shadow-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        />

        {/* Display content boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full px-10 mt-6">
          {filteredItems.map((item) => (
            <div
              key={item.title} // unique key for each box
              className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition flex flex-col"
            >
              {/* Article image */}
              <img
                src={item.image}
                alt={item.title}
                className="h-48 w-full object-cover"
              />

              {/* Article text content */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-700 flex-1">{item.description}</p>

                {/* "Read more" link */}
                <Link
                  href={item.link}
                  className="mt-3 text-[#0099ff] font-semibold hover:underline"
                >
                  Read more →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Display selected content name */}
        <div className="mt-6 text-2xl">
          {selected} content goes here
        </div>
      </div>
    </div>
  );
}