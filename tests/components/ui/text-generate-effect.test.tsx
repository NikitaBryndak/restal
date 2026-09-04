// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render } from "../test-utils";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

describe("TextGenerateEffect", () => {
  it("renders every word as a span and animates them to visible", async () => {
    const { container } = render(<TextGenerateEffect words="Hello brave new world" />);
    expect(container.querySelectorAll("span")).toHaveLength(4);
    await vi.waitFor(() => {
      for (const s of Array.from(container.querySelectorAll("span"))) {
        expect(s.style.opacity).toBe("1");
      }
    }, { timeout: 5000 });
  });

  it("applies accentClassName to accent words and text-white to the rest", () => {
    const { container } = render(
      <TextGenerateEffect
        words="rest accent word"
        accentWords={["accent"]}
        accentClassName="text-accent"
      />
    );
    const spans = Array.from(container.querySelectorAll("span"));
    expect(spans[1]).toHaveClass("text-accent");
    expect(spans[0]).toHaveClass("text-white");
  });

  it("keeps blur off when filter is disabled", () => {
    const { container } = render(<TextGenerateEffect words="no blur" filter={false} />);
    for (const s of Array.from(container.querySelectorAll("span"))) {
      expect(s.style.filter).toBe("none");
    }
  });

  it("merges className onto the root", () => {
    const { container } = render(<TextGenerateEffect words="x" className="mt-8" />);
    expect(container.firstElementChild).toHaveClass("font-bold", "mt-8");
  });
});
