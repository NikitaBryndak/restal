// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { render, user, nextNavigationMock, nextLinkMock } from "../test-utils";

const { sessionRef, signOutSpy } = vi.hoisted(() => ({
  sessionRef: { current: null as unknown },
  signOutSpy: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/navigation", () => nextNavigationMock());
vi.mock("next/link", () => nextLinkMock());
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: sessionRef.current, status: "unauthenticated" }),
  signOut: (...args: unknown[]) => signOutSpy(...args),
}));
vi.mock("@/components/navigation/NotificationBell", () => ({
  default: () => <div>bell</div>,
}));

import SmallNavbar from "@/components/navigation/smallNavbar";

const CLIENT_PAGES = ["profile", "my-trips", "bonuses", "settings"];
const ARTICLE_PAGES = ["manage-articles", "add-article"];
const TOUR_PAGES = ["manage-tour", "add-tour", "promo-codes", "contact-requests"];
const ADMIN_PAGES = ["analytics", "audit-log", "managers", "users", "roles"];

const profile = (allowedPages: string[]) => ({ userName: "Nikita", cashbackAmount: 50, allowedPages });

describe("SmallNavbar", () => {
  beforeEach(() => {
    sessionRef.current = null;
    signOutSpy.mockClear();
  });

  it("starts closed with a menu toggle button", () => {
    render(<SmallNavbar userProfile={null} />);
    const toggle = screen.getByRole("button", { name: "Відкрити меню" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Контакти" })).not.toBeInTheDocument();
  });

  it("opens the overlay menu on toggle and flips the button state", async () => {
    render(<SmallNavbar userProfile={null} />);
    await user().click(screen.getByRole("button", { name: "Відкрити меню" }));
    expect(screen.getByRole("link", { name: "Контакти" })).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Закрити меню" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the menu when a navigation link is clicked", async () => {
    render(<SmallNavbar userProfile={null} />);
    await user().click(screen.getByRole("button", { name: "Відкрити меню" }));
    await user().click(screen.getByRole("link", { name: "Контакти" }));
    expect(screen.queryByRole("link", { name: "Контакти" })).not.toBeInTheDocument();
  });

  it("shows the login CTA and no bell when unauthenticated", async () => {
    render(<SmallNavbar userProfile={null} />);
    await user().click(screen.getByRole("button", { name: "Відкрити меню" }));
    expect(screen.getByRole("link", { name: "Стати клієнтом" })).toBeInTheDocument();
    expect(screen.queryByText("bell")).not.toBeInTheDocument();
  });

  it("shows dashboard links, cashback and logout for an authenticated client", async () => {
    sessionRef.current = { user: {} };
    render(<SmallNavbar userProfile={profile(CLIENT_PAGES)} />);
    await user().click(screen.getByRole("button", { name: "Відкрити меню" }));

    expect(screen.getByText("bell")).toBeInTheDocument();
    for (const label of ["Профіль", "Мої подорожі", "Бонуси", "Налаштування"]) {
      expect(screen.getAllByRole("link", { name: label })).not.toHaveLength(0);
    }
    // client role has no privilege sections
    expect(screen.queryByText("Статті")).not.toBeInTheDocument();
    expect(screen.queryByText("Тури та маркетинг")).not.toBeInTheDocument();
    expect(screen.queryByText("Адміністрування")).not.toBeInTheDocument();

    await user().click(screen.getByRole("button", { name: "Вийти" }));
    expect(signOutSpy).toHaveBeenCalledWith({ callbackUrl: "/" });
    // menu closed after logout click
    expect(screen.queryByRole("link", { name: "Профіль" })).not.toBeInTheDocument();
  });

  it("shows the tours section for a manager and hides articles/admin sections", async () => {
    sessionRef.current = { user: {} };
    render(<SmallNavbar userProfile={profile([...CLIENT_PAGES, ...TOUR_PAGES])} />);
    await user().click(screen.getByRole("button", { name: "Відкрити меню" }));
    expect(screen.getByText("Тури та маркетинг")).toBeInTheDocument();
    expect(screen.queryByText("Статті")).not.toBeInTheDocument();
    expect(screen.queryByText("Адміністрування")).not.toBeInTheDocument();
  });

  it("shows every section for an admin", async () => {
    sessionRef.current = { user: {} };
    render(<SmallNavbar userProfile={profile([...CLIENT_PAGES, ...ARTICLE_PAGES, ...TOUR_PAGES, ...ADMIN_PAGES])} />);
    await user().click(screen.getByRole("button", { name: "Відкрити меню" }));
    expect(screen.getByText("Кабінет")).toBeInTheDocument();
    expect(screen.getByText("Статті")).toBeInTheDocument();
    expect(screen.getByText("Тури та маркетинг")).toBeInTheDocument();
    expect(screen.getByText("Адміністрування")).toBeInTheDocument();
  });
});
