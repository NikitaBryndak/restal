// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { render } from "../test-utils";

const { sessionRef } = vi.hoisted(() => ({
  sessionRef: { current: null as unknown },
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: sessionRef.current, status: "authenticated" }),
}));

import NotificationBell from "@/components/navigation/NotificationBell";

const fetchMock = vi.fn();

const okResponse = (payload: unknown) => ({
  ok: true,
  status: 200,
  json: async () => payload,
});

describe("NotificationBell", () => {
  beforeEach(() => {
    sessionRef.current = { user: {} };
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("renders nothing when unauthenticated and does not fetch", async () => {
    sessionRef.current = null;
    const { container } = render(<NotificationBell />);
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches on mount and shows the unread badge", async () => {
    fetchMock.mockResolvedValue(okResponse({ notifications: [], unreadCount: 3 }));
    render(<NotificationBell />);
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Сповіщення" })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/notifications");
  });

  it("caps the badge at 9+ for more than nine unread", async () => {
    fetchMock.mockResolvedValue(okResponse({ notifications: [], unreadCount: 12 }));
    render(<NotificationBell />);
    await act(async () => {});
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("polls every 60 seconds while authenticated", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(okResponse({ notifications: [], unreadCount: 0 }));
    render(<NotificationBell />);
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops polling after a 401 response", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    render(<NotificationBell />);
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    await act(async () => {});
    // polling stopped — no second request
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("opens the dropdown listing notifications with relative dates", async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    fetchMock.mockResolvedValue(
      okResponse({
        notifications: [
          { _id: "1", tripNumber: "T-1", type: "document_upload", message: "Документ завантажено", read: false, createdAt: fiveMinutesAgo },
        ],
        unreadCount: 0,
      })
    );
    render(<NotificationBell />);
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: "Сповіщення" }));
    expect(screen.getByText("Документ завантажено")).toBeInTheDocument();
    expect(screen.getByText("5 хв тому")).toBeInTheDocument();
  });

  it("marks all as read when opened with unread items", async () => {
    fetchMock.mockResolvedValue(
      okResponse({
        notifications: [
          { _id: "1", tripNumber: "T-1", type: "status_change", message: "Статус змінено", read: false, createdAt: new Date().toISOString() },
        ],
        unreadCount: 2,
      })
    );
    render(<NotificationBell />);
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: "Сповіщення" }));
    // PUT mark-all-read is issued automatically on open
    await vi.waitFor(() => {
      expect(
        fetchMock.mock.calls.some((c) => c[1]?.method === "PUT")
      ).toBe(true);
    });
    const putCall = fetchMock.mock.calls.find((c) => c[1]?.method === "PUT")!;
    expect(JSON.parse(putCall[1].body as string)).toEqual({ markAllRead: true });

    // badge and the "mark all" button disappear once read state lands
    await vi.waitFor(() => {
      expect(screen.queryByText("2")).not.toBeInTheDocument();
      expect(screen.queryByText("Прочитати всі")).not.toBeInTheDocument();
    });
  });

  it("shows an empty state when there are no notifications", async () => {
    fetchMock.mockResolvedValue(okResponse({ notifications: [], unreadCount: 0 }));
    render(<NotificationBell />);
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: "Сповіщення" }));
    expect(screen.getByText("Немає сповіщень")).toBeInTheDocument();
  });

  it("closes the dropdown on outside click", async () => {
    fetchMock.mockResolvedValue(
      okResponse({
        notifications: [
          { _id: "1", tripNumber: "T-1", type: "status_change", message: "Статус змінено", read: true, createdAt: new Date().toISOString() },
        ],
        unreadCount: 0,
      })
    );
    render(<NotificationBell />);
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: "Сповіщення" }));
    expect(screen.getByText("Статус змінено")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Статус змінено")).not.toBeInTheDocument();
  });
});
