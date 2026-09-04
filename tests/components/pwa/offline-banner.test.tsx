// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { render } from "../test-utils";

import { OfflineBanner } from "@/components/pwa/offline-banner";

const setOnLine = (value: boolean) => {
  Object.defineProperty(navigator, "onLine", { value, configurable: true });
};

describe("OfflineBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setOnLine(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (navigator as unknown as Record<string, unknown>).onLine;
  });

  it("renders nothing while online and appears on the offline event", () => {
    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();

    act(() => {
      fireEvent(window, new Event("offline"));
    });
    expect(screen.getByText(/Немає підключення до інтернету/)).toBeInTheDocument();
  });

  it("shows a brief 'connection restored' message after coming back online", () => {
    render(<OfflineBanner />);

    act(() => {
      fireEvent(window, new Event("offline"));
      fireEvent(window, new Event("online"));
    });
    expect(screen.getByText(/З'єднання відновлено/)).toBeInTheDocument();

    // the restored message disappears after 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByText(/З'єднання відновлено/)).not.toBeInTheDocument();
  });

  it("starts in the offline state when the page loads without a connection", () => {
    setOnLine(false);
    render(<OfflineBanner />);
    expect(screen.getByText(/Немає підключення до інтернету/)).toBeInTheDocument();
  });
});
