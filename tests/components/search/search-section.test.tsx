// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { render, user, nextLinkMock } from "../test-utils";

vi.mock("@/data", () => ({
  searchSuggestions: ["Тури до Карпат"],
  searchTexts: [],
}));
vi.mock("@/components/search/search-bar", () => ({
  default: () => <input name="search-query" />,
}));
vi.mock("@/components/search/ai-chat-inline", () => ({
  default: ({ onClose, initialQuery }: { onClose: () => void; initialQuery: string }) => (
    <div>
      chat:{initialQuery}
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

import SearchSection from "@/components/search/search-section";

describe("SearchSection", () => {
  let onChatToggle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChatToggle = vi.fn();
  });

  it("renders landing mode with form, suggestions and contact link", () => {
    render(<SearchSection onChatToggle={onChatToggle} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByText("Спробуйте запитати")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Тури до Карпат" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Контакти/ })).toHaveAttribute("href", "/contact");
    expect(onChatToggle).toHaveBeenCalledWith(false);
  });

  it("opens the chat with a submitted query and resets the input", async () => {
    const { container } = render(<SearchSection onChatToggle={onChatToggle} />);
    await user().type(screen.getByRole("textbox"), "Карпати");
    fireEvent.click(container.querySelector('button[type="submit"]')!);

    expect(screen.getByText("chat:Карпати")).toBeInTheDocument();
    expect(onChatToggle).toHaveBeenCalledWith(true);
  });

  it("stays in landing mode when the submitted query is blank", async () => {
    const { container } = render(<SearchSection onChatToggle={onChatToggle} />);
    await user().type(screen.getByRole("textbox"), "   ");
    fireEvent.click(container.querySelector('button[type="submit"]')!);

    expect(screen.queryByText(/chat:/)).not.toBeInTheDocument();
    expect(onChatToggle).not.toHaveBeenCalledWith(true);
  });

  it("opens the chat when a suggestion is clicked", async () => {
    const { container } = render(<SearchSection onChatToggle={onChatToggle} />);
    await user().click(screen.getByRole("button", { name: "Тури до Карпат" }));
    expect(container.textContent).toContain("chat:Тури до Карпат");
  });

  it("closes the chat after the exit transition and clears the query", async () => {
    vi.useFakeTimers();
    const { container } = render(<SearchSection onChatToggle={onChatToggle} />);
    act(() => {}); // flush mount effect
    fireEvent.click(screen.getByRole("button", { name: "Тури до Карпат" }));
    expect(container.textContent).toContain("chat:Тури до Карпат");

    fireEvent.click(screen.getByRole("button", { name: "close" }));
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(container.textContent).not.toContain("chat:");
    expect(onChatToggle).toHaveBeenLastCalledWith(false);
    vi.useRealTimers();
  });
});
