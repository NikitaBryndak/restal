// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";

import TripCountdown from "@/components/trip/trip-countdown";

// All scenarios are evaluated against a fixed "today": 05/10/2026, noon.
const setToday = () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 5, 12, 0, 0));
};

describe("TripCountdown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down days for an upcoming trip with hours and minutes", () => {
    setToday();
    render(<TripCountdown tripStartDate="08/10/2026" tripEndDate="15/10/2026" status="Booked" />);

    expect(screen.getByText("До подорожі")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // 3 days away
    expect(screen.getByText("дні")).toBeInTheDocument();
    expect(screen.getByText(/год.*хв/)).toBeInTheDocument();
    // within a week — packing reminder shows
    expect(screen.getByText(/Не забудьте зібрати валізу/)).toBeInTheDocument();
  });

  it("uses the singular day word for tomorrow and no reminder far away", () => {
    setToday();
    const { unmount } = render(
      <TripCountdown tripStartDate="06/10/2026" tripEndDate="10/10/2026" status="Booked" />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("день")).toBeInTheDocument();
    unmount();

    render(<TripCountdown tripStartDate="04/11/2026" tripEndDate="10/11/2026" status="Booked" />);
    // same formula as the component — DST shifts can change the exact count by one day
    const daysUntil = Math.ceil((new Date(2026, 10, 4).getTime() - new Date(2026, 9, 5).getTime()) / 86_400_000);
    expect(screen.getByText(String(daysUntil))).toBeInTheDocument();
    expect(screen.getByText("днів")).toBeInTheDocument();
    expect(screen.queryByText(/Не забудьте зібрати валізу/)).not.toBeInTheDocument();
  });

  it("shows the on-trip state with days of rest remaining", () => {
    setToday();
    render(<TripCountdown tripStartDate="01/10/2026" tripEndDate="07/10/2026" status="In Progress" />);

    expect(screen.getByText(/Ви зараз у подорожі/)).toBeInTheDocument();
    expect(screen.getByText("Залишилось 2 дні відпочинку")).toBeInTheDocument();
  });

  it("marks the last day of an ongoing trip", () => {
    setToday();
    render(<TripCountdown tripStartDate="01/10/2026" tripEndDate="05/10/2026" status="In Progress" />);

    expect(screen.getByText(/Ви зараз у подорожі/)).toBeInTheDocument();
    expect(screen.getByText("Останній день подорожі")).toBeInTheDocument();
  });

  it("shows the finished state for completed or archived trips", () => {
    setToday();
    const { unmount } = render(
      <TripCountdown tripStartDate="01/10/2026" tripEndDate="07/10/2026" status="Completed" />
    );
    expect(screen.getByText("Подорож завершена")).toBeInTheDocument();
    unmount();

    render(<TripCountdown tripStartDate="01/10/2026" tripEndDate="07/10/2026" status="Archived" />);
    expect(screen.getByText("Подорож завершена")).toBeInTheDocument();
  });

  it("renders nothing when the trip already ended but the status was not updated", () => {
    setToday();
    const { container } = render(
      <TripCountdown tripStartDate="01/10/2026" tripEndDate="03/10/2026" status="In Progress" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for unparseable dates", () => {
    setToday();
    const { container } = render(
      <TripCountdown tripStartDate="not-a-date" tripEndDate="15/10/2026" status="Booked" />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
