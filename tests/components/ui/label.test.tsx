// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { createRef } from "react";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import { Label } from "@/components/ui/label";

describe("Label", () => {
  it("renders a <label> element with its text content", () => {
    const { container } = render(<Label>Ім'я</Label>);
    const label = container.querySelector("label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent("Ім'я");
  });

  it("passes through native props like htmlFor", () => {
    render(<Label htmlFor="name">Ім'я</Label>);
    expect(screen.getByText("Ім'я")).toHaveAttribute("for", "name");
  });

  it("merges custom className with the default classes", () => {
    const { container } = render(<Label className="mt-2">X</Label>);
    const label = container.querySelector("label")!;
    expect(label).toHaveClass("text-sm", "font-medium");
    expect(label).toHaveClass("mt-2");
  });

  it("forwards ref to the underlying label element", () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref}>X</Label>);
    expect(ref.current?.tagName).toBe("LABEL");
  });
});
