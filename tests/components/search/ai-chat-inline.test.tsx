// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { render, nextLinkMock } from "../test-utils";

vi.mock("next/link", () => nextLinkMock());

import AiChatInline from "@/components/search/ai-chat-inline";

const fetchMock = vi.fn();

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const okJson = (payload: unknown) => ({ ok: true, status: 200, json: async () => payload });
type ChatFetchInit = { method?: string; headers?: Record<string, string>; body?: string };
/** Body of the Nth fetch call as parsed JSON (we control every fetch arg in these tests). */
const sentBody = (callIndex = 0): Record<string, unknown> => {
  const init = fetchMock.mock.calls[callIndex][1] as ChatFetchInit;
  return JSON.parse(init.body!) as Record<string, unknown>;
};

describe("AiChatInline", () => {
  it("shows the intro with quick questions when there is no history", () => {
    render(<AiChatInline onClose={() => {}} />);
    expect(screen.getByText("Персональний Тур-AI")).toBeInTheDocument();
    for (const q of ["Спланувати подорож", "Куди поїхати на пляж?", "Гарячі тури"]) {
      expect(screen.getByRole("button", { name: new RegExp(q) })).toBeInTheDocument();
    }
    // no clear-chat button while empty
    expect(screen.queryByTitle("Очистити чат")).not.toBeInTheDocument();
  });

  it("restores chat history from session storage on mount", () => {
    sessionStorage.setItem(
      "ai_chat_history",
      JSON.stringify([{ role: "user", content: "Привіт" }, { role: "assistant", content: "Вітаю!" }])
    );
    render(<AiChatInline onClose={() => {}} />);
    expect(screen.getByText("Привіт")).toBeInTheDocument();
    expect(screen.getByText(/Вітаю/)).toBeInTheDocument();
  });

  it("sends a message and appends the assistant reply", async () => {
    fetchMock.mockResolvedValue(okJson({ message: "Вітаю! Чим допомогти?" }));
    render(<AiChatInline onClose={() => {}} />);

    const input = screen.getByPlaceholderText(/Напишіть повідомлення/);
    fireEvent.change(input, { target: { value: "Привіт" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    const body = sentBody();
    expect(body.messages).toEqual([{ role: "user", content: "Привіт" }]);
    expect(typeof body.visitorId).toBe("string");

    await screen.findByText(/Вітаю! Чим допомогти/);
  });

  it("persists the visitor id in local storage and reuses it", async () => {
    fetchMock.mockResolvedValue(okJson({ message: "ok" }));
    render(<AiChatInline onClose={() => {}} />);
    await act(async () => {});
    const stored = localStorage.getItem("ai_visitor_id");
    expect(stored).toBeTruthy();

    // a second mount reuses the same id
    fetchMock.mockClear();
    const input = screen.getByPlaceholderText(/Напишіть повідомлення/);
    fireEvent.change(input, { target: { value: "ще раз" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
    expect(sentBody().visitorId).toBe(stored);
  });

  it("shows an assistant error message when the chat API fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    render(<AiChatInline onClose={() => {}} />);

    const input = screen.getByPlaceholderText(/Напишіть повідомлення/);
    fireEvent.change(input, { target: { value: "тест" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(await screen.findByText(/Вибачте, сталася помилка/)).toBeInTheDocument();
  });

  it("sends the initial query exactly once on mount", async () => {
    fetchMock.mockResolvedValue(okJson({ message: "ok" }));
    render(<AiChatInline onClose={() => {}} initialQuery="Тури до Карпат" />);
    await act(async () => {});

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentBody().messages).toEqual([{ role: "user", content: "Тури до Карпат" }]);
  });

  it("closes on Escape and via the header button", () => {
    const onClose = vi.fn();
    render(<AiChatInline onClose={onClose} />);
    fireEvent.keyDown(screen.getByPlaceholderText(/Напишіть повідомлення/), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    // header back button (first button in the document)
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("clears messages and storage when the clear-chat button is used", () => {
    sessionStorage.setItem("ai_chat_history", JSON.stringify([{ role: "user", content: "Привіт" }]));
    render(<AiChatInline onClose={() => {}} />);
    expect(screen.getByText("Привіт")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Очистити чат"));
    expect(screen.queryByText("Привіт")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("ai_chat_history")).toBeNull();
  });

  it("offers plan generation after four messages and renders the returned plan", async () => {
    const history = [
      { role: "user", content: "Куди поїхати?" },
      { role: "assistant", content: "Розкажіть більше" },
      { role: "user", content: "В Карпати, жовтень" },
      { role: "assistant", content: "Чудово!" },
    ];
    sessionStorage.setItem("ai_chat_history", JSON.stringify(history));
    fetchMock.mockResolvedValue(
      okJson({ plan: { destination: "Карпати", region: null, dates: null, travelers: null, budget: null, tripType: null, hotel: null, activities: null, recommendations: null, notes: null } })
    );

    render(<AiChatInline onClose={() => {}} />);
    const planButton = screen.getByRole("button", { name: /Сформувати план подорожі/ });
    await act(async () => {
      fireEvent.click(planButton);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/chat/trip-plan");
    expect(sentBody().messages).toEqual(history);

    await screen.findByRole("heading", { name: "Карпати" });
  });

  it("shows a specific error when the plan API reports not enough info", async () => {
    sessionStorage.setItem(
      "ai_chat_history",
      JSON.stringify([
        { role: "user", content: "а" },
        { role: "assistant", content: "б" },
        { role: "user", content: "в" },
        { role: "assistant", content: "г" },
      ])
    );
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "not_enough_info" }) });

    render(<AiChatInline onClose={() => {}} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Сформувати план подорожі/ }));
    });

    expect(await screen.findByText(/Поки недостатньо деталей/)).toBeInTheDocument();
  });
});
