// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render, user, nextNavigationMock, nextLinkMock } from "../test-utils";

const { pathnameRef } = vi.hoisted(() => ({
  pathnameRef: { current: "/" as string },
}));

vi.mock("next/navigation", () =>
  nextNavigationMock({ usePathname: () => pathnameRef.current })
);
vi.mock("next/link", () => nextLinkMock());

import { NavLink } from "@/components/navigation/nav-link";

describe("NavLink", () => {
  it("renders an anchor with href and children", () => {
    render(<NavLink href="/tours">Тури</NavLink>);
    const link = screen.getByRole("link", { name: "Тури" });
    expect(link).toHaveAttribute("href", "/tours");
  });

  it("applies the active class when pathname matches href", () => {
    pathnameRef.current = "/tours";
    render(<NavLink href="/tours">Тури</NavLink>);
    expect(screen.getByRole("link")).toHaveClass("text-foreground");
  });

  it("does not apply the active class for a different pathname", () => {
    pathnameRef.current = "/about";
    render(<NavLink href="/tours">Тури</NavLink>);
    expect(screen.getByRole("link")).not.toHaveClass("text-foreground");
  });

  it("renders the button variant with border styling", () => {
    render(
      <NavLink href="/login" variant="button">
        Вхід
      </NavLink>
    );
    const link = screen.getByRole("link", { name: "Вхід" });
    expect(link).toHaveClass("border");
  });

  it("calls onClick when clicked", async () => {
    pathnameRef.current = "/";
    const onClick = vi.fn();
    render(
      <NavLink href="/tours" onClick={onClick}>
        Тури
      </NavLink>
    );
    await user().click(screen.getByRole("link"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
