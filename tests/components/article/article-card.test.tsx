// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "../test-utils";

const { pushSpy } = vi.hoisted(() => ({ pushSpy: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushSpy }) }));

import ArticleCard from "@/components/article/article-card";

type CardData = Parameters<typeof ArticleCard>[0]["data"];

const baseData = (overrides: Partial<CardData> = {}): CardData => ({
  title: "Carpathian Tours",
  description: "Best tours of the year",
  images: "/images/cover.jpg",
  tag: "Тури",
  _id: "abc123",
  createdAt: null,
  ...overrides,
});

const setToday = () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 10, 12, 0, 0)); // 10/10/2026 noon
};

describe("ArticleCard", () => {
  afterEach(() => {
    pushSpy.mockClear();
    vi.useRealTimers();
  });

  it("navigates to /info/{id} on click and on Enter key", () => {
    render(<ArticleCard data={baseData()} />);
    const card = screen.getByRole("link");

    fireEvent.click(card);
    expect(pushSpy).toHaveBeenCalledWith("/info/abc123");

    pushSpy.mockClear();
    fireEvent.keyDown(card, { key: "Enter" });
    expect(pushSpy).toHaveBeenCalledWith("/info/abc123");

    // Space is handled too (and must not scroll the page)
    pushSpy.mockClear();
    fireEvent.keyDown(card, { key: " " });
    expect(pushSpy).toHaveBeenCalledWith("/info/abc123");
  });

  it("slugifies the title when there is no _id", () => {
    render(<ArticleCard data={baseData({ _id: undefined, title: "Carpathian Tours 2026" })} />);
    fireEvent.click(screen.getByRole("link"));
    expect(pushSpy).toHaveBeenCalledWith("/info/carpathian-tours-2026");
  });

  it.each([
    ["today", new Date(2026, 9, 10, 8, 0), "Сьогодні"],
    ["yesterday", new Date(2026, 9, 9, 8, 0), "Вчора"],
    ["a few days ago", new Date(2026, 9, 7, 8, 0), "3 дн. тому"],
  ])("shows the relative date label for %s", (_label, createdAt, expected) => {
    setToday();
    render(<ArticleCard data={baseData({ createdAt: createdAt.toISOString() })} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("falls back to 'Нещодавно' when the date is missing or invalid", () => {
    setToday();
    const { unmount } = render(<ArticleCard data={baseData({ createdAt: null })} />);
    expect(screen.getByText("Нещодавно")).toBeInTheDocument();
    unmount();

    render(<ArticleCard data={baseData({ createdAt: "not-a-date" })} />);
    expect(screen.getByText("Нещодавно")).toBeInTheDocument();
  });

  it("shows a placeholder when there is no cover image and renders the tag chip", () => {
    setToday();
    render(<ArticleCard data={baseData({ images: "" })} />);
    expect(screen.getByText("Немає зображення")).toBeInTheDocument();
    expect(screen.getByText("Тури")).toBeInTheDocument();
  });
});
