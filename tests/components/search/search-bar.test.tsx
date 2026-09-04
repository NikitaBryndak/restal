// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, act } from "@testing-library/react";
import { render } from "../test-utils";

vi.mock("@/data", () => ({ searchTexts: ["АБВ"] }));

import SearchBar from "@/components/search/search-bar";

describe("SearchBar", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders an accessible search input with the sr-only label", () => {
    render(<SearchBar />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-label", "Пошук турів");
    expect(input).toHaveAttribute("name", "search-query");
  });

  it("types out the phrase character by character into the placeholder", async () => {
    vi.useFakeTimers();
    render(<SearchBar />);
    const input = screen.getByRole("textbox");

    // each keystroke is scheduled with a random delay of at most ~120ms;
    // advance in 200ms steps until the full phrase appears
    for (let i = 0; i < 50 && input.getAttribute("placeholder") !== "АБВ"; i++) {
      act(() => {
        vi.advanceTimersByTime(200);
      });
    }
    expect(input).toHaveAttribute("placeholder", "АБВ");
  });

  it("deletes the phrase and cycles back to empty after the pause", async () => {
    vi.useFakeTimers();
    render(<SearchBar />);
    const input = screen.getByRole("textbox");
    // type out, hold for the 1s pause, then delete back down to "".
    // Steps stay under the minimum re-type delay (~50ms) so the empty
    // state is observable before typing resumes.
    for (let i = 0; i < 400 && input.getAttribute("placeholder") !== ""; i++) {
      act(() => {
        vi.advanceTimersByTime(40);
      });
    }
    expect(input).toHaveAttribute("placeholder", "");
  });

  it("merges a custom className with the defaults", () => {
    render(<SearchBar className="mt-2" />);
    expect(screen.getByRole("textbox")).toHaveClass("w-full", "mt-2");
  });
});
