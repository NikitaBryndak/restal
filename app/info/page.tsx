"use client";
import { useState } from "react";
import Selector from "@/components/navigation/selectorNavbar";
import TitleSearch from "@/components/search/titleSearch";
import Articles from "@/components/ui/articles";

export default function InfoPage() {
  // Array of button names
  const names = ["First", "Second", "Third", "Fourth", "Fifth"];
  // State to track which button is selected
  const [selected, setSelected] = useState("First");
  // State to store search input
  const [search, setSearch] = useState("");

  // Array of article boxes (photo, description, link, and tag)
  const contentItems = [
    { title: "Exploring Japan", description: "Discover the hidden gems of Japan, from Tokyo’s lights to Kyoto’s temples.", image: "/images/japan.jpg", link: "/articles/japan", tag: "First" },
    { title: "Adventures in Iceland", description: "Experience waterfalls, glaciers, and the magical Northern Lights.", image: "/images/iceland.webp", link: "/articles/iceland", tag: "First" },
    { title: "Wonders of Morocco", description: "A guide through Morocco’s deserts, markets, and rich culture.", image: "/images/morocco.jpg", link: "/articles/morocco", tag: "Second" },
    { title: "The Beauty of Italy", description: "From Venice canals to Roman ruins — Italy is a feast for the senses.", image: "/images/italy.jpg", link: "/articles/italy", tag: "Third" },
    { title: "Colors of India", description: "Dive into India’s festivals, food, and breathtaking landscapes.", image: "/images/india.jpg", link: "/articles/india", tag: "Fourth" },
    { title: "Hidden Trails of Peru", description: "Explore Machu Picchu and beyond — discover Peru’s ancient wonders.", image: "/images/peru.jpg", link: "/articles/peru", tag: "Fifth" },
  ];

  // Filters articles by tag and search term
  const filteredItems = contentItems.filter(
    (item) =>
      (selected === "First" || item.tag === selected) &&
      item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col pt-20 px-8">
      <Selector names={names} selected={selected} setSelected={setSelected} />
      <TitleSearch search={search} setSearch={setSearch} />
      <Articles filteredItems={filteredItems} />
    </div>
  );
}