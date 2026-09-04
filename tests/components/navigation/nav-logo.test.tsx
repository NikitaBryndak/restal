// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render, nextLinkMock, nextImageMock } from "../test-utils";

vi.mock("next/link", () => nextLinkMock());
vi.mock("next/image", () => nextImageMock());

import NavLogo from "@/components/navigation/NavLogo";

describe("NavLogo", () => {
  it("renders a link to home with the logo image and brand name", () => {
    render(<NavLogo />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
    expect(screen.getByText("RestAL")).toBeInTheDocument();
    expect(screen.getByAltText("RestAL Logo")).toBeInTheDocument();
  });

  it("merges custom className with the default layout classes", () => {
    const { container } = render(<NavLogo className="shrink-0" />);
    expect(container.querySelector("a")).toHaveClass(
      "flex",
      "items-center",
      "shrink-0"
    );
  });
});
