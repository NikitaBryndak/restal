// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render } from "../test-utils";

const { addTripSpy } = vi.hoisted(() => ({ addTripSpy: vi.fn() }));

vi.mock("@/hooks/useRecentlyViewed", () => ({
  useRecentlyViewed: () => ({ recentTrips: [], addTrip: addTripSpy }),
}));

import TrackTripView from "@/components/trip/track-trip-view";

describe("TrackTripView", () => {
  it("records the trip in recently-viewed on mount and renders nothing", () => {
    const { container } = render(
      <TrackTripView tripId="t1" country="Греція" number="42" status="Booked" />
    );
    expect(container).toBeEmptyDOMElement();
    expect(addTripSpy).toHaveBeenCalledWith({ id: "t1", country: "Греція", number: "42", status: "Booked" });
  });

  it("re-records when the tracked props change", () => {
    const { rerender } = render(
      <TrackTripView tripId="t1" country="Греція" number="42" status="Booked" />
    );
    addTripSpy.mockClear();

    rerender(<TrackTripView tripId="t1" country="Греція" number="43" status="Paid" />);
    expect(addTripSpy).toHaveBeenCalledWith({ id: "t1", country: "Греція", number: "43", status: "Paid" });

    // unchanged props do not re-record
    addTripSpy.mockClear();
    rerender(<TrackTripView tripId="t1" country="Греція" number="43" status="Paid" />);
    expect(addTripSpy).not.toHaveBeenCalled();
  });
});
