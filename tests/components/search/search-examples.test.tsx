// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render, user } from "../test-utils";

vi.mock("@/data", () => ({
  searchSuggestions: ["Тури до Карпат", "Екскурсії по Києву"],
}));

import SearchExamples from "@/components/search/search-examples";

describe("SearchExamples", () => {
  it("renders a button per suggestion", () => {
    render(<SearchExamples handleSearch={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Тури до Карпат" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Екскурсії по Києву" })).toBeInTheDocument();
  });

  it("calls handleSearch with the clicked suggestion text", async () => {
    const handleSearch = vi.fn();
    render(<SearchExamples handleSearch={handleSearch} />);
    await user().click(screen.getByRole("button", { name: "Тури до Карпат" }));
    expect(handleSearch).toHaveBeenCalledWith("Тури до Карпат");
  });
});
