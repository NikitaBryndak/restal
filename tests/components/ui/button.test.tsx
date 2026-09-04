// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render, user } from "../test-utils";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders a button with data-slot and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Зберегти</Button>);
    const btn = screen.getByRole("button", { name: "Зберегти" });
    expect(btn).toHaveAttribute("data-slot", "button");
    await user().click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["default", "bg-primary"],
    ["destructive", "bg-destructive"],
    ["outline", "border"],
    ["secondary", "bg-secondary"],
    ["ghost", "hover:bg-accent"],
    ["link", "underline-offset-4"],
  ] as const)("applies %s variant classes (%s)", (variant, cls) => {
    render(<Button variant={variant}>B</Button>);
    expect(screen.getByRole("button")).toHaveClass(cls);
  });

  it.each([
    ["default", "h-9"],
    ["sm", "h-8"],
    ["lg", "h-10"],
    ["icon", "size-9"],
  ] as const)("applies %s size classes (%s)", (size, cls) => {
    render(<Button size={size}>B</Button>);
    expect(screen.getByRole("button")).toHaveClass(cls);
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        B
      </Button>
    );
    await user().click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("asChild renders the child element with button classes instead of a button", () => {
    render(
      <Button asChild variant="outline">
        <a href="/tours">Тури</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: "Тури" });
    expect(link).toHaveAttribute("href", "/tours");
    expect(link).toHaveClass("border");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("merges custom className with variant classes", () => {
    render(<Button className="mt-4">B</Button>);
    expect(screen.getByRole("button")).toHaveClass("mt-4", "bg-primary");
  });
});
