// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render, nextLinkMock, nextImageMock } from "./test-utils";

vi.mock("next/link", () => nextLinkMock());
vi.mock("next/image", () => nextImageMock());

import HomeContent from "@/components/home-content";

const DESTINATIONS = ["Туреччина", "Єгипет", "Греція", "Мальдіви", "Іспанія", "Таїланд", "ОАЕ", "Хорватія"];
const FEATURES = ["Гарантія безпеки", "Підтримка 24/7", "Перевірені напрямки", "ШІ помічник"];
const STEPS = ["Розкажіть про мрію", "Ми підберемо найкраще", "Вирушайте у подорож"];
const REVIEWERS = ["Олена К.", "Андрій М.", "Марія С."];

describe("HomeContent", () => {
  it("renders all eight destinations in the popular grid", () => {
    render(<HomeContent tripCount={10} />);
    for (const name of DESTINATIONS) {
      // some names also appear elsewhere on the page — at least one occurrence required
      expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("renders the features, steps and reviews sections", () => {
    render(<HomeContent tripCount={0} />);
    for (const title of FEATURES) expect(screen.getByText(title)).toBeInTheDocument();
    for (const step of STEPS) expect(screen.getByText(step)).toBeInTheDocument();
    for (const name of REVIEWERS) expect(screen.getByText(name)).toBeInTheDocument();
  });

  it("links to contact, the tour screener and the phone number", () => {
    render(<HomeContent tripCount={0} />);
    const hrefs = Array.from(document.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/contact");
    expect(hrefs.filter((h) => h === "/tour-screener#tour-widget").length).toBeGreaterThanOrEqual(2);
    expect(hrefs).toContain("tel:+380687772550");
  });

  it("shows the static stats and the trips counter label", () => {
    render(<HomeContent tripCount={14} />);
    // animated counters stay at their initial value in jsdom (no IntersectionObserver),
    // so assert on the static parts of the stats row instead
    expect(screen.getByText("ПОДОРОЖЕЙ ОРГАНІЗОВАНО")).toBeInTheDocument();
    expect(screen.getByText("КРАЇНИ")).toBeInTheDocument();
    expect(screen.getByText("РЕЙТИНГ")).toBeInTheDocument();
    expect(screen.getByText("4.9")).toBeInTheDocument();
    expect(screen.getByText("ПІДТРИМКА")).toBeInTheDocument();
  });
});
