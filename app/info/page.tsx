"use client";
import { useState } from "react";
import Selector from "@/components/navigation/selectorNavbar";
import TitleSearch from "@/components/search/titleSearch";
import Article from "@/components/ui/article";
import {articlesData} from "@/app/info/articlesData";

export default function InfoPage() {
  // Array of button names
  const names = ["First", "Second", "Third", "Fourth", "Fifth"];
  // State to track which button is selected
  const [selected, setSelected] = useState("First");
  // State to store search input
  const [search, setSearch] = useState("");

  // Filters articles by tag and search term
  const filteredItems = articlesData.filter(
    (item) =>
      (selected === "First" || item.tag === selected) &&
      item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col pt-20 px-8">
      <Selector names={names} selected={selected} setSelected={setSelected} />
      <TitleSearch search={search} setSearch={setSearch} />
      <Article filteredItems={filteredItems} />
    </div>
  );
}