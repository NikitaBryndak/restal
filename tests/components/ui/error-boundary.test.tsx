// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MockInstance } from "vitest";
import { screen } from "@testing-library/react";
import { render, user, mockClipboard } from "../test-utils";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const { shouldThrowRef } = vi.hoisted(() => ({
  shouldThrowRef: { current: true },
}));

function Thrower() {
  if (shouldThrowRef.current) throw new Error("boom");
  return <div>Діти живі</div>;
}

describe("ErrorBoundary", () => {
  let consoleSpy: MockInstance<typeof console.error>;
  beforeEach(() => {
    shouldThrowRef.current = true;
    // React and componentDidCatch both log caught errors — silence them.
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children untouched when no error occurs", () => {
    shouldThrowRef.current = false;
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(screen.getByText("Діти живі")).toBeInTheDocument();
  });

  it("shows the default fallback with the error message when a child throws", () => {
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(screen.getByText("Щось пішло не так")).toBeInTheDocument();
    expect(screen.getByText(/Виникла непередбачена помилка/)).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Спробувати знову/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Скопіювати помилку/ })
    ).toBeInTheDocument();
  });

  it("uses custom fallbackTitle and fallbackDescription when provided", () => {
    render(
      <ErrorBoundary fallbackTitle="Мій заголовок" fallbackDescription="Мій опис">
        <Thrower />
      </ErrorBoundary>
    );
    expect(screen.getByText("Мій заголовок")).toBeInTheDocument();
    expect(screen.getByText("Мій опис")).toBeInTheDocument();
  });

  it("re-renders children after reset when the error is gone", async () => {
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(screen.getByText("Щось пішло не так")).toBeInTheDocument();

    shouldThrowRef.current = false;
    await user().click(screen.getByRole("button", { name: /Спробувати знову/ }));
    expect(screen.getByText("Діти живі")).toBeInTheDocument();
  });

  it("copies the error details to the clipboard and shows a confirmation", async () => {
    // user() first: userEvent.setup() installs its own clipboard stub on
    // navigator; mockClipboard() must run afterwards to replace it.
    const u = user();
    mockClipboard();
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );

    await u.click(screen.getByRole("button", { name: /Скопіювати помилку/ }));
    const writeText = vi.mocked(navigator.clipboard.writeText);
    expect(writeText).toHaveBeenCalledTimes(1);
    const copiedText = writeText.mock.calls[0][0] as string;
    expect(copiedText).toContain("Помилка: boom");
    expect(copiedText).toContain("Stack trace:");

    // Confirmation label, then it reverts after the 2s timeout.
    await screen.findByRole("button", { name: /Скопійовано/ });
    await vi.waitFor(
      () =>
        expect(
          screen.getByRole("button", { name: /Скопіювати помилку/ })
        ).toBeInTheDocument(),
      { timeout: 4000 }
    );
  });
});
