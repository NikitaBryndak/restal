// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "../test-utils";
import { Spotlight } from "@/components/ui/spotlight-new";

const gradientDivs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("div")).filter(
    (d) => d.style.background.includes("gradient")
  );

describe("Spotlight", () => {
  it("renders a pointer-events-none absolute overlay with six gradient layers", () => {
    const { container } = render(<Spotlight />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("pointer-events-none", "absolute", "inset-0");
    // two animated sides x three gradients each
    expect(gradientDivs(container)).toHaveLength(6);
  });

  it("applies custom gradient and size props to the layers", () => {
    const custom = "linear-gradient(red, blue)";
    const { container } = render(
      <Spotlight gradientFirst={custom} width={600} height={900} smallWidth={120} />
    );
    const divs = gradientDivs(container);
    // gradientFirst is used on both sides; the other two keep radial defaults
    expect(divs.filter((d) => d.style.background.includes("linear-gradient"))).toHaveLength(2);
    const wide = container.querySelector('div[style*="width: 600px"]');
    expect(wide).not.toBeNull();
    const narrow = container.querySelector('div[style*="width: 120px"]');
    expect(narrow).not.toBeNull();
  });

  it("uses the default radial gradients when none are provided", () => {
    const { container } = render(<Spotlight />);
    for (const d of gradientDivs(container)) {
      expect(d.style.background.startsWith("radial-gradient")).toBe(true);
    }
  });
});
