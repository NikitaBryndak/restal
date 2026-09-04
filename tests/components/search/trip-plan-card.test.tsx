// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render, user, nextLinkMock } from "../test-utils";

vi.mock("next/link", () => nextLinkMock());

import TripPlanCard, { type TripPlan } from "@/components/search/trip-plan-card";

const fullPlan: TripPlan = {
  destination: "Карпати",
  region: "Україна",
  dates: { from: "2026-10-01", to: "2026-10-08", flexible: true },
  travelers: { adults: 2, children: 1, childrenAges: [7] },
  budget: { amount: "3000", currency: "USD", perPerson: false },
  tripType: "Сімейний відпочинок",
  hotel: { stars: "4", mealPlan: "Пенсіон", preferences: ["Близько до лижної школи"] },
  activities: [{ name: "Рафтинг", description: "На р. Прут", icon: "🚣" }],
  recommendations: [
    { destination: "Буковель", reason: "Сучасний гірськолижний курорт", highlights: ["Канатні доріжки"], estimatedCost: "$150/день" },
  ],
  notes: "Бажано з трансфером",
};

const emptyPlan: TripPlan = {
  destination: null,
  region: null,
  dates: null,
  travelers: null,
  budget: null,
  tripType: null,
  hotel: null,
  activities: null,
  recommendations: null,
  notes: null,
};

describe("TripPlanCard", () => {
  it("renders the destination header with region and a fallback title", () => {
    render(<TripPlanCard plan={fullPlan} onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: "Карпати" })).toBeInTheDocument();
    expect(screen.getByText("Україна")).toBeInTheDocument();

    const { unmount } = render(<TripPlanCard plan={emptyPlan} onClose={() => {}} />);
    expect(screen.getAllByText("Ваша подорож").length).toBeGreaterThan(0);
    unmount();
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(<TripPlanCard plan={fullPlan} onClose={onClose} />);
    await user().click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders every detail section for a fully populated plan", () => {
    render(<TripPlanCard plan={fullPlan} onClose={() => {}} />);

    // trip type badge
    expect(screen.getByText("Сімейний відпочинок")).toBeInTheDocument();
    // dates with flexibility marker
    expect(screen.getByText(/2026-10-01 — 2026-10-08/)).toBeInTheDocument();
    expect(screen.getByText("(гнучкі дати)")).toBeInTheDocument();
    // travelers incl. children ages
    expect(screen.getByText("2 дорослих, 1 дітей (7 р.)")).toBeInTheDocument();
    // budget with total marker
    expect(screen.getByText(/3000 USD/)).toBeInTheDocument();
    expect(screen.getByText("загалом")).toBeInTheDocument();
    // hotel chips and preferences
    expect(screen.getByText("Пенсіон")).toBeInTheDocument();
    expect(screen.getByText("Близько до лижної школи")).toBeInTheDocument();
    // activities
    expect(screen.getByText("Рафтинг")).toBeInTheDocument();
    expect(screen.getByText("На р. Прут")).toBeInTheDocument();
    // recommendations with cost and highlights
    expect(screen.getByText("Буковель")).toBeInTheDocument();
    expect(screen.getByText("Сучасний гірськолижний курорт")).toBeInTheDocument();
    expect(screen.getByText("$150/день")).toBeInTheDocument();
    expect(screen.getByText("Канатні доріжки")).toBeInTheDocument();
    // notes
    expect(screen.getByText(/Бажано з трансфером/)).toBeInTheDocument();
  });

  it("hides all detail sections for an empty plan", () => {
    render(<TripPlanCard plan={emptyPlan} onClose={() => {}} />);
    for (const title of ["Дати", "Туристи", "Бюджет", "Готель", "Активності", "Рекомендовані напрямки"]) {
      expect(screen.queryByText(title)).not.toBeInTheDocument();
    }
  });

  it("links the CTA to a contact URL carrying the encoded plan message", () => {
    render(<TripPlanCard plan={fullPlan} onClose={() => {}} />);
    const cta = screen.getByRole("link", { name: /Забронювати з менеджером/ });
    const href = cta.getAttribute("href")!;

    expect(href.startsWith("/contact?source=ai-trip-plan&message=")).toBe(true);
    const decoded = decodeURIComponent(href.slice("/contact?source=ai-trip-plan&message=".length));
    expect(decoded).toContain("🌍 Напрямок: Карпати (Україна)");
    expect(decoded).toContain("💰 Бюджет: 3000 USD загалом");
    expect(decoded).toContain("1. Буковель ($150/день)");
    expect(decoded).toContain("📝 Додатково: Бажано з трансфером");
    expect(decoded.trimEnd().endsWith("Дякую!")).toBe(true);
  });

  it("builds a minimal message for an empty plan", () => {
    render(<TripPlanCard plan={emptyPlan} onClose={() => {}} />);
    const cta = screen.getByRole("link", { name: /Забронювати з менеджером/ });
    const decoded = decodeURIComponent(cta.getAttribute("href")!);
    expect(decoded).toContain("Запит на подорож");
    expect(decoded).not.toContain("🌍 Напрямок");
  });
});
