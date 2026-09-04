// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { screen } from "@testing-library/react";
import { render, user } from "../test-utils";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders an input and accepts typed text with onChange", async () => {
    const onChange = vi.fn();
    render(<Input placeholder="Пошук" onChange={onChange} />);
    const input = screen.getByPlaceholderText("Пошук");
    await user().type(input, "київ");
    expect(input).toHaveValue("київ");
    expect(onChange).toHaveBeenCalled();
  });

  it("passes through the type attribute", () => {
    const { container } = render(<Input type="email" />);
    expect(container.querySelector("input")).toHaveAttribute("type", "email");
  });

  it("merges custom className with the default classes", () => {
    const { container } = render(<Input className="mt-4" />);
    const input = container.querySelector("input")!;
    expect(input).toHaveClass("h-10", "w-full");
    expect(input).toHaveClass("mt-4");
  });

  it("forwards ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current?.tagName).toBe("INPUT");
  });
});
