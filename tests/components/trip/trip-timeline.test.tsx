// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";

import TripTimeline from "@/components/trip/trip-timeline";

const STAGE_LABELS = ["Бронювання", "Заброньовано", "Оплачено", "У подорожі", "Завершено", "Архів"];

describe("TripTimeline", () => {
  it("renders the header and all six stage labels", () => {
    render(<TripTimeline status="Booked" />);
    expect(screen.getByText("Прогрес подорожі")).toBeInTheDocument();
    for (const label of STAGE_LABELS) {
      // labels are always in the DOM (hidden via opacity until hover/current)
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("shows the Ukrainian name of the current status", () => {
    render(<TripTimeline status="Paid" />);
    // "Оплачено" appears as a stage label and in the always-visible status line
    expect(screen.getAllByText("Оплачено").length).toBe(2);
  });

  it("falls back to the raw value for an unknown status", () => {
    render(<TripTimeline status="Weird Status" />);
    expect(screen.getByText("Weird Status")).toBeInTheDocument();
  });

  it("marks past stages with check icons and only the current one as active", () => {
    // "In Progress" is index 3: three past checks, one spinning loader
    const { container } = render(<TripTimeline status="In Progress" />);
    expect(container.querySelectorAll("svg.text-green-400").length).toBe(3);
    expect(container.querySelectorAll("svg.animate-spin").length).toBe(1);
  });

  it("marks every stage as done for the final (Archived) status", () => {
    const { container } = render(<TripTimeline status="Archived" />);
    expect(container.querySelectorAll("svg.text-green-400").length).toBe(6);
    expect(container.querySelectorAll("svg.animate-spin").length).toBe(0);
  });

  it("treats Archived as a future stage beyond Completed", () => {
    const { container } = render(<TripTimeline status="Completed" />);
    // five stages done, the final "Архів" node stays an empty circle
    expect(container.querySelectorAll("svg.text-green-400").length).toBe(5);
    expect(container.querySelectorAll("svg.animate-spin").length).toBe(0);
  });
});
