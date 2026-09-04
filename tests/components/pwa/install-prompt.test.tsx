// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { render, mockMatchMedia } from "../test-utils";

import { InstallPrompt } from "@/components/pwa/install-prompt";

const fireInstallPrompt = (extra: Record<string, unknown> = {}) => {
  const evt = new Event("beforeinstallprompt");
  Object.assign(evt, extra);
  window.dispatchEvent(evt);
};

describe("InstallPrompt", () => {
  beforeEach(() => {
    mockMatchMedia(false); // not in standalone mode
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the banner only after beforeinstallprompt and a short delay", () => {
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();

    act(() => {
      fireInstallPrompt();
    });
    // not yet — the banner waits 3 seconds so the user gets oriented first
    expect(screen.queryByText("Встановити RestAL")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("Встановити RestAL")).toBeInTheDocument();
  });

  it("calls the deferred prompt on install and hides when accepted", async () => {
    const promptSpy = vi.fn().mockResolvedValue(undefined);
    render(<InstallPrompt />);

    act(() => {
      fireInstallPrompt({ prompt: promptSpy, userChoice: Promise.resolve({ outcome: "accepted" }) });
      vi.advanceTimersByTime(3000);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Встановити" }));
    });

    expect(promptSpy).toHaveBeenCalledTimes(1);
    // accepted → treated as installed, banner gone
    expect(screen.queryByText("Встановити RestAL")).not.toBeInTheDocument();
  });

  it("stores a dismissal timestamp for 7 days when closed", () => {
    render(<InstallPrompt />);
    act(() => {
      fireInstallPrompt();
      vi.advanceTimersByTime(3000);
    });

    fireEvent.click(screen.getByRole("button", { name: "Не зараз" }));
    expect(screen.queryByText("Встановити RestAL")).not.toBeInTheDocument();

    const stored = Number.parseInt(localStorage.getItem("pwa-install-dismissed")!, 10);
    expect(Math.abs(Date.now() - stored)).toBeLessThan(5000);
  });

  it("does not listen when the prompt was dismissed recently", () => {
    localStorage.setItem("pwa-install-dismissed", (Date.now() - 24 * 60 * 60 * 1000).toString()); // yesterday
    const { container } = render(<InstallPrompt />);

    act(() => {
      fireInstallPrompt();
      vi.advanceTimersByTime(3000);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing in standalone (installed) mode", () => {
    mockMatchMedia(true);
    const { container } = render(<InstallPrompt />);

    act(() => {
      fireInstallPrompt();
      vi.advanceTimersByTime(3000);
    });
    expect(container).toBeEmptyDOMElement();
  });
});
