// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { render } from "../test-utils";

const { html2canvasMock } = vi.hoisted(() => ({ html2canvasMock: vi.fn() }));
vi.mock("html2canvas-pro", () => ({ default: (...args: unknown[]) => html2canvasMock(...args) }));

import TripShareCard from "@/components/trip/trip-share-card";

const props = {
  country: "Греція",
  region: "Крит",
  tripStartDate: "01/10/2026",
  tripEndDate: "08/10/2026",
  hotel: { name: "Sunset Resort", nights: 7, food: "All Inclusive" },
  flightInfo: {
    departure: { airportCode: "LWO", date: "01/10/2026", time: "10:30" },
    arrival: { airportCode: "HER", date: "08/10/2026", time: "14:00" },
  },
  touristCount: 2,
  addons: { insurance: true, transfer: false },
  status: "Booked",
  countryImage: "/countryImages/greece.webp",
};

// jsdom has no canvas object URLs — stub them per test.
const stubObjectUrls = () => {
  const createSpy = vi.fn(() => "blob:test-url");
  const revokeSpy = vi.fn();
  (URL as unknown as Record<string, unknown>).createObjectURL = createSpy;
  (URL as unknown as Record<string, unknown>).revokeObjectURL = revokeSpy;
  return { createSpy, revokeSpy };
};

const openModal = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Поділитися" }));
  });
};

describe("TripShareCard", () => {
  beforeEach(() => {
    html2canvasMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("opens a modal with the trip details", async () => {
    render(<TripShareCard {...props} />);
    await openModal();

    expect(screen.getByText("Греція")).toBeInTheDocument();
    expect(screen.getByText("Крит")).toBeInTheDocument();
    expect(screen.getByText("01/10/2026")).toBeInTheDocument();
    expect(screen.getByText("LWO")).toBeInTheDocument();
    expect(screen.getByText("HER")).toBeInTheDocument();
    expect(screen.getByText("Sunset Resort")).toBeInTheDocument();
    expect(screen.getByText("7 ночей · All Inclusive")).toBeInTheDocument();
    expect(screen.getByText("restal.in.ua")).toBeInTheDocument();
  });

  it("closes via the X button and via an overlay click", async () => {
    render(<TripShareCard {...props} />);
    await openModal();
    expect(screen.getByText("Греція")).toBeInTheDocument();

    // close button is icon-only (empty accessible name)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "" }));
    });
    expect(screen.queryByText("Sunset Resort")).not.toBeInTheDocument();

    // re-open and dismiss by clicking the overlay itself
    await openModal();
    const overlay = document.querySelector(".z-100") as HTMLElement;
    await act(async () => {
      fireEvent.click(overlay);
    });
    expect(screen.queryByText("Sunset Resort")).not.toBeInTheDocument();
  });

  it("downloads the card as a PNG named after the country", async () => {
    const { createSpy, revokeSpy } = stubObjectUrls();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click");
    html2canvasMock.mockResolvedValue({ toBlob: (cb: (b: Blob) => void) => cb(new Blob(["png"], { type: "image/png" })) });

    render(<TripShareCard {...props} />);
    await openModal();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Зберегти" }));
    });

    expect(html2canvasMock).toHaveBeenCalledTimes(1);
    const options = html2canvasMock.mock.calls[0][1] as Record<string, unknown>;
    expect(options.width).toBe(440);
    expect(options.height).toBe(780);

    expect(createSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith("blob:test-url");
    const anchor = anchorClick.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.download).toBe("restal-trip-Греція.png");
  });

  it("disables the action buttons while the image is generating", async () => {
    const { promise } = Promise.withResolvers<unknown>(); // never settles
    html2canvasMock.mockReturnValue(promise);
    render(<TripShareCard {...props} />);
    await openModal();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Зберегти" }));
    });
    const busyButtons = screen.getAllByRole("button", { name: /Генеруємо/ });
    expect(busyButtons).toHaveLength(2);
    for (const btn of busyButtons) expect(btn).toBeDisabled();
  });
});
