// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import { ToursSoldCounter } from "@/components/ui/tours-sold-counter";
import { TRIP_COUNT_OFFSET } from "@/config/constants";

const formatted = (n: number) => n.toLocaleString();

describe("ToursSoldCounter", () => {
  it("animates up to count + historical offset and shows the plus suffix", async () => {
    render(<ToursSoldCounter count={123} />);
    const target = formatted(123 + TRIP_COUNT_OFFSET);
    await vi.waitFor(() => expect(screen.getByText(target)).toBeInTheDocument(), {
      timeout: 5000,
    });
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("Подорожей організовано")).toBeInTheDocument();
  });

  it("shows only the historical offset when count is omitted", async () => {
    render(<ToursSoldCounter />);
    await vi.waitFor(
      () => expect(screen.getByText(formatted(TRIP_COUNT_OFFSET))).toBeInTheDocument(),
      { timeout: 5000 }
    );
  });

  it("renders zero formatted when count is explicitly 0 and offset settles", async () => {
    render(<ToursSoldCounter count={0} />);
    await vi.waitFor(
      () => expect(screen.getByText(formatted(TRIP_COUNT_OFFSET))).toBeInTheDocument(),
      { timeout: 5000 }
    );
  });
});
