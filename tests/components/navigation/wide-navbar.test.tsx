// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { render, nextNavigationMock, nextLinkMock } from "../test-utils";

const { sessionRef } = vi.hoisted(() => ({
  sessionRef: { current: null as unknown },
}));

vi.mock("next/navigation", () => nextNavigationMock());
vi.mock("next/link", () => nextLinkMock());
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: sessionRef.current, status: "unauthenticated" }),
}));
vi.mock("@/components/navigation/NotificationBell", () => ({
  default: () => <div>bell</div>,
}));

import WideNavbar from "@/components/navigation/wideNavbar";

const profile = { userName: "Nikita", cashbackAmount: 123.456, privilegeLevel: 1 };

describe("WideNavbar", () => {
  beforeEach(() => {
    sessionRef.current = null;
  });

  it("renders the five main navigation links", () => {
    render(<WideNavbar userProfile={null} />);
    for (const label of ["Підбір туру", "ШІ Пошук", "Інфо центр", "Контакти", "Менеджери"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("shows the login CTA when there is no session", () => {
    render(<WideNavbar userProfile={null} />);
    const link = screen.getByRole("link", { name: "Стати клієнтом" });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("shows the profile CTA when authenticated", () => {
    sessionRef.current = { user: {} };
    render(<WideNavbar userProfile={null} />);
    const link = screen.getByRole("link", { name: "Кабінет" });
    expect(link).toHaveAttribute("href", "/dashboard/profile");
  });

  it("shows the bell and formatted cashback amount only when session AND profile exist", () => {
    sessionRef.current = { user: {} };
    render(<WideNavbar userProfile={profile} />);
    expect(screen.getByText("bell")).toBeInTheDocument();
    const cashback = screen.getByRole("link", { name: "123.46₴" });
    expect(cashback).toHaveAttribute("href", "/cashback");
  });

  it("hides the bell and cashback when the profile is missing even with a session", () => {
    sessionRef.current = { user: {} };
    render(<WideNavbar userProfile={null} />);
    expect(screen.queryByText("bell")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /₴/ })).not.toBeInTheDocument();
  });
});
