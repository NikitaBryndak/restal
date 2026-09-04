// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { render, user, nextNavigationMock, nextLinkMock } from "../test-utils";

const { profileRef, loadingRef, signOutSpy } = vi.hoisted(() => ({
  profileRef: { current: null as unknown },
  loadingRef: { current: false },
  signOutSpy: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/navigation", () => nextNavigationMock());
vi.mock("next/link", () => nextLinkMock());
vi.mock("@/hooks/useUserProfile", () => ({
  useUserProfile: () => ({ userProfile: profileRef.current, loading: loadingRef.current }),
}));
vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOutSpy(...args),
}));

import SubDashboardNavbar from "@/components/navigation/SubDashboardNavbar";

// Page slugs per the access catalog (config/access.ts).
const CLIENT_PAGES = ["profile", "my-trips", "bonuses", "settings"];
const ARTICLE_PAGES = ["manage-articles", "add-article"];
const TOUR_PAGES = ["manage-tour", "add-tour", "promo-codes", "contact-requests"];
const ADMIN_PAGES = ["analytics", "audit-log", "managers", "users", "roles"];

// Group labels rendered by the catalog.
const GROUP_LABELS = { client: "Кабінет", articles: "Статті", tours: "Тури та маркетинг", admin: "Адміністрування" };

const profile = (allowedPages: string[]) => ({ userName: "Nikita", allowedPages });

describe("SubDashboardNavbar", () => {
  beforeEach(() => {
    profileRef.current = null;
    loadingRef.current = false;
    signOutSpy.mockClear();
  });

  it("shows only the client section for a client user", () => {
    profileRef.current = profile(CLIENT_PAGES);
    render(<SubDashboardNavbar />);
    expect(screen.getByText(GROUP_LABELS.client)).toBeInTheDocument();
    for (const label of ["Профіль", "Мої подорожі", "Бонуси", "Налаштування"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByText(GROUP_LABELS.articles)).not.toBeInTheDocument();
    expect(screen.queryByText(GROUP_LABELS.tours)).not.toBeInTheDocument();
    expect(screen.queryByText(GROUP_LABELS.admin)).not.toBeInTheDocument();
  });

  it("shows client and articles sections for an editor", () => {
    profileRef.current = profile([...CLIENT_PAGES, ...ARTICLE_PAGES]);
    render(<SubDashboardNavbar />);
    expect(screen.getByText(GROUP_LABELS.client)).toBeInTheDocument();
    expect(screen.getByText(GROUP_LABELS.articles)).toBeInTheDocument();
    expect(screen.queryByText(GROUP_LABELS.tours)).not.toBeInTheDocument();
    expect(screen.queryByText(GROUP_LABELS.admin)).not.toBeInTheDocument();
  });

  it("shows client and tours sections for a manager", () => {
    profileRef.current = profile([...CLIENT_PAGES, ...TOUR_PAGES]);
    render(<SubDashboardNavbar />);
    expect(screen.getByText(GROUP_LABELS.client)).toBeInTheDocument();
    expect(screen.getByText(GROUP_LABELS.tours)).toBeInTheDocument();
    expect(screen.queryByText(GROUP_LABELS.articles)).not.toBeInTheDocument();
    expect(screen.queryByText(GROUP_LABELS.admin)).not.toBeInTheDocument();
  });

  it("shows every section for an admin", () => {
    profileRef.current = profile([...CLIENT_PAGES, ...ARTICLE_PAGES, ...TOUR_PAGES, ...ADMIN_PAGES]);
    render(<SubDashboardNavbar />);
    expect(screen.getByText(GROUP_LABELS.client)).toBeInTheDocument();
    expect(screen.getByText(GROUP_LABELS.articles)).toBeInTheDocument();
    expect(screen.getByText(GROUP_LABELS.tours)).toBeInTheDocument();
    expect(screen.getByText(GROUP_LABELS.admin)).toBeInTheDocument();
  });

  it("shows only the client section while the profile is loading", () => {
    profileRef.current = null;
    loadingRef.current = true;
    render(<SubDashboardNavbar />);
    for (const label of ["Профіль", "Мої подорожі", "Бонуси", "Налаштування"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByText(GROUP_LABELS.articles)).not.toBeInTheDocument();
    expect(screen.queryByText(GROUP_LABELS.tours)).not.toBeInTheDocument();
    expect(screen.queryByText(GROUP_LABELS.admin)).not.toBeInTheDocument();
  });

  it("logout button calls signOut with the home callback", async () => {
    profileRef.current = profile(CLIENT_PAGES);
    render(<SubDashboardNavbar />);
    await user().click(screen.getByRole("button", { name: "Вийти" }));
    expect(signOutSpy).toHaveBeenCalledWith({ callbackUrl: "/" });
  });
});
