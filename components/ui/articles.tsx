"use client";
import Link from "next/link";

export default function ContentBlock({ filteredItems }) {
  return (
    // Display content boxes
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
      {filteredItems.map((item) => (
        <div
          key={item.title}
          className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition flex flex-col"
        >
          {/* Article text content */}
          <div className="p-5 flex flex-col flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-1">{item.title}</h3>
            <p className="text-gray-600 text-sm mb-3">Published recently</p>
            <p className="text-gray-700 flex-1 text-[15px] leading-snug">
              {item.description}
            </p>

            {/* "Read more" link */}
            <Link
              href={item.link}
              className="mt-3 text-[#0099ff] font-semibold hover:underline"
            >
              Read more →
            </Link>
          </div>

          {/* Article image at the bottom */}
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-48 object-cover"
          />
        </div>
      ))}
    </div>
  );
}