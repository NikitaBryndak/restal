// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within, fireEvent, act } from "@testing-library/react";
import { render, mockClipboard } from "../test-utils";
import ShareTripButton from "@/components/trip/share-trip-button";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

// The panel renders twice (mobile bottom sheet + desktop dropdown) — assert on the desktop one.
const desktopPanel = (container: HTMLElement): HTMLElement =>
  container.querySelector(".sm\\:block") as HTMLElement;

describe("ShareTripButton", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("generates a share link when opened without one", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ token: "tok123" }) });
    const { container } = render(<ShareTripButton tripId="t9" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Поділитися" }));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/trips/share");
    const init = fetchMock.mock.calls[0][1] as { method?: string; body?: string };
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body!)).toEqual({ tripId: "t9" });

    const input = within(desktopPanel(container)).getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe(`${window.location.origin}/shared/trip/tok123`);
  });

  it("shows an existing token immediately without fetching", async () => {
    const { container } = render(<ShareTripButton tripId="t9" existingToken="abc" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Поділитися" }));
    });

    expect(fetchMock).not.toHaveBeenCalled();
    const input = within(desktopPanel(container)).getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe(`${window.location.origin}/shared/trip/abc`);
  });

  it("shows a failure message when generation fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    const { container } = render(<ShareTripButton tripId="t9" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Поділитися" }));
    });

    expect(within(desktopPanel(container)).getByText("Не вдалося створити посилання")).toBeInTheDocument();
  });

  it("copies the link to the clipboard and shows confirmation", async () => {
    mockClipboard();
    const { container } = render(<ShareTripButton tripId="t9" existingToken="abc" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Поділитися" }));
    });

    // copy buttons are icon-only (empty accessible name) — one per panel variant
    const [copyButton] = screen.getAllByRole("button", { name: "" });
    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/shared/trip/abc`
    );
    // copied state swaps the copy icon for a green check in both panels
    expect(container.querySelectorAll("svg.text-green-400").length).toBe(2);
  });

  it("revokes the link and clears the token", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const { container } = render(<ShareTripButton tripId="t9" existingToken="abc" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Поділитися" }));
    });

    const [revoke] = screen.getAllByRole("button", { name: "Деактивувати посилання" });
    await act(async () => {
      fireEvent.click(revoke);
    });

    const init = fetchMock.mock.calls[0][1] as { method?: string; body?: string };
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body!)).toEqual({ tripId: "t9" });
    // token cleared → the no-token branch is shown again
    expect(within(desktopPanel(container)).getByText("Не вдалося створити посилання")).toBeInTheDocument();
  });
});
