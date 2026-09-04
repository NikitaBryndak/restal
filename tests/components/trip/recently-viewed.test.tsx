// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render, nextLinkMock } from "../test-utils";

const { tripsRef } = vi.hoisted(() => ({ tripsRef: { current: [] as unknown[] } }));

vi.mock("next/link", () => nextLinkMock());
vi.mock("@/hooks/useRecentlyViewed", () => ({
  useRecentlyViewed: () => ({ recentTrips: tripsRef.current, addTrip: vi.fn() }),
}));

import RecentlyViewed from "@/components/trip/recently-viewed";

describe("RecentlyViewed", () => {
  it("renders nothing when there are no recent trips", () => {
    tripsRef.current = [];
    const { container } = render(<RecentlyViewed />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links each trip to its dashboard page with status label, country and number", () => {
    tripsRef.current = [
      { id: "t1", country: "Греція", number: "42", status: "In Booking" },
      { id: "t2", country: "Туреччина", number: "77", status: "UnknownStatus" },
    ];
    render(<RecentlyViewed />);

    expect(screen.getByText("Нещодавно переглянуті")).toBeInTheDocument();

    const greece = screen.getByRole("link", { name: /Греція/ });
    expect(greece).toHaveAttribute("href", "/dashboard/trips/t1");
    // known status renders the Ukrainian label
    expect(screen.getByText("В процесі бронювання")).toBeInTheDocument();
    expect(screen.getByText("#42")).toBeInTheDocument();

    const turkey = screen.getByRole("link", { name: /Туреччина/ });
    expect(turkey).toHaveAttribute("href", "/dashboard/trips/t2");
    // unknown status falls back to the raw value
    expect(screen.getByText("UnknownStatus")).toBeInTheDocument();
  });
});
