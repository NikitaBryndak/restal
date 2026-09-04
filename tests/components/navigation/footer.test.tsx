// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render, nextNavigationMock, nextLinkMock } from "../test-utils";

const { pathnameRef } = vi.hoisted(() => ({
  pathnameRef: { current: "/" as string },
}));

vi.mock("next/navigation", () =>
  nextNavigationMock({ usePathname: () => pathnameRef.current })
);
vi.mock("next/link", () => nextLinkMock());

import Footer from "@/components/navigation/Footer";

describe("Footer", () => {
  it("renders nav links, socials and the copyright line on regular pages", () => {
    pathnameRef.current = "/tours";
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Контакти" })).toHaveAttribute(
      "href",
      "/contact"
    );
    expect(screen.getByRole("link", { name: "Допомога" })).toHaveAttribute(
      "href",
      "/info"
    );
    for (const label of ["Instagram", "Facebook", "TikTok", "Threads", "Telegram"]) {
      const social = screen.getByRole("link", { name: label });
      expect(social).toHaveAttribute("target", "_blank");
      expect(social).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(
      screen.getByText(`© ${new Date().getFullYear()} Restal. Усі права захищені.`)
    ).toBeInTheDocument();
  });

  it.each(["/login", "/register"])("renders nothing on %s", (p) => {
    pathnameRef.current = p;
    const { container } = render(<Footer />);
    expect(container).toBeEmptyDOMElement();
  });
});
