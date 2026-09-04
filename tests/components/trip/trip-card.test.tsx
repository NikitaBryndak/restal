// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { render, nextImageMock } from "../test-utils";

vi.mock("next/image", () => nextImageMock());

import TripCard from "@/components/trip/trip-card";
import { DEFAULT_DOCUMENTS, type Trip } from "@/types";

const baseTrip = (overrides: Partial<Trip> = {}): Trip => ({
  number: "42",
  bookingDate: "01/09/2026",
  tripStartDate: "01/10/2026",
  tripEndDate: "08/10/2026",
  country: "Греція",
  status: "Booked",
  flightInfo: {
    departure: { airportCode: "LWO", country: "Україна", flightNumber: "F9 1234", date: "01/10/2026", time: "10:30" },
    arrival: { airportCode: "JMK", country: "Греція", flightNumber: "F9 5678", date: "08/10/2026", time: "14:00" },
  },
  hotel: { name: "Sunset Resort", checkIn: "01/10/2026", checkOut: "08/10/2026", food: "All Inclusive", nights: 7, roomType: "Double" },
  tourists: [],
  addons: { insurance: true, transfer: false },
  documents: {
    ...DEFAULT_DOCUMENTS,
    contract: { uploaded: true, url: "" },
    invoice: { uploaded: true, url: "" },
    departureTicket1: { uploaded: true, url: "", fileName: "t.pdf" },
  },
  payment: { totalAmount: 3500, paidAmount: 1000, deadline: "25/09/2026" },
  ownerPhone: "+380501234567",
  ...overrides,
});

// Fixed "today" so the outdated-trip check is deterministic.
const setToday = () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 1, 12, 0, 0)); // 01/09/2026
};

describe("TripCard", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders status, country, flights, hotel and payment details", () => {
    setToday();
    render(<TripCard data={baseTrip()} />);

    expect(screen.getByText("Заброньовано")).toBeInTheDocument(); // status badge
    expect(screen.getByRole("heading", { name: "Греція" })).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();

    expect(screen.getByText(/LWO.*F9 1234/)).toBeInTheDocument();
    expect(screen.getByText(/JMK.*F9 5678/)).toBeInTheDocument();

    expect(screen.getByText("Sunset Resort")).toBeInTheDocument();
    expect(screen.getByText("All Inclusive")).toBeInTheDocument();

    // de-DE number formatting: 3500 → "3.500,00"
    expect(screen.getByText(/3\.500,00/)).toBeInTheDocument();
    // no explicit cashbackAmount → total * CASHBACK_RATE (2%) = 70
    expect(screen.getByText(/70,00.*cashback/)).toBeInTheDocument();

    // document progress: 2 of 7 main docs, 1 of 8 tickets uploaded
    expect(screen.getByText("2/7")).toBeInTheDocument();
    expect(screen.getByText("1/8")).toBeInTheDocument();
  });

  it("uses the explicit cashback amount when present", () => {
    setToday();
    render(<TripCard data={baseTrip({ cashbackAmount: 55.5 })} />);
    expect(screen.getByText(/55,50.*cashback/)).toBeInTheDocument();
  });

  it("greys out trips whose end date is in the past", () => {
    setToday();
    const { container } = render(<TripCard data={baseTrip({ tripEndDate: "01/08/2026" })} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("grayscale");
    expect(root.className).toContain("cursor-not-allowed");

    // a future trip keeps the interactive styling instead
    const { container: activeContainer } = render(<TripCard data={baseTrip()} />);
    const activeRoots = Array.from(activeContainer.querySelectorAll("div")).filter((el) => el.className.includes("hover:scale-[1.02]"));
    expect(activeRoots.length).toBe(1);
  });
});
