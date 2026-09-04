// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import type * as MotionReact from "motion/react";
const { inViewRef } = vi.hoisted(() => ({ inViewRef: { current: false } }));

// Keep the real motion components; only control useInView (jsdom has no IntersectionObserver).
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof MotionReact>();
  return { ...actual, useInView: () => inViewRef.current };
});

import FadeIn from "@/components/ui/fade-in";

describe("FadeIn", () => {
  it("renders children inside a wrapper div", () => {
    render(<FadeIn>Зміст</FadeIn>);
    expect(screen.getByText("Зміст")).toBeInTheDocument();
  });

  it("stays hidden (opacity 0) while out of view", () => {
    inViewRef.current = false;
    render(<FadeIn>Сховано</FadeIn>);
    const wrapper = screen.getByText("Сховано").closest("div") as HTMLElement;
    expect(wrapper.style.opacity).toBe("0");
  });

  it("becomes visible when scrolled into view", async () => {
    inViewRef.current = true;
    render(<FadeIn>Видно</FadeIn>);
    const wrapper = screen.getByText("Видно").closest("div") as HTMLElement;
    await vi.waitFor(
      () => expect(wrapper.style.opacity).toBe("1"),
      { timeout: 3000 }
    );
  });
});
