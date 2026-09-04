// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render, nextNavigationMock, nextLinkMock, nextImageMock } from "../test-utils";

const { pathnameRef } = vi.hoisted(() => ({
  pathnameRef: { current: "/" as string },
}));

vi.mock("next/navigation", () =>
  nextNavigationMock({ usePathname: () => pathnameRef.current })
);
vi.mock("@/hooks/useUserProfile", () => ({
  useUserProfile: () => ({ userProfile: null, loading: false, error: null }),
}));
vi.mock("@/components/navigation/wideNavbar", () => ({
  default: () => <div>wide</div>,
}));
vi.mock("@/components/navigation/smallNavbar", () => ({
  default: () => <div>small</div>,
}));
vi.mock("next/link", () => nextLinkMock());
vi.mock("next/image", () => nextImageMock());

import Navbar from "@/components/navigation/Navbar";

describe("Navbar", () => {
  it("renders the logo and both navbars on regular pages", () => {
    pathnameRef.current = "/tours";
    render(<Navbar />);
    expect(screen.getByText("RestAL")).toBeInTheDocument();
    expect(screen.getByText("wide")).toBeInTheDocument();
    expect(screen.getByText("small")).toBeInTheDocument();
  });

  it.each(["/login", "/register"])("renders nothing on %s", (p) => {
    pathnameRef.current = p;
    const { container } = render(<Navbar />);
    expect(container).toBeEmptyDOMElement();
  });
});
