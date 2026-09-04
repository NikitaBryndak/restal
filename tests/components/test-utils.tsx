// Shared helpers for component tests (jsdom environment).
// Every component test file MUST start with:  // @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// jsdom does not implement Element.prototype.scrollIntoView, but components
// call it on mount/update (chat auto-scroll). Stub once per worker.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom does not implement IntersectionObserver, but framer-motion's useInView
// references the global directly. Stub it inertly — elements never report as
// "in view", which is a deterministic state for assertions.
if (typeof IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class {
    root = null;
    rootMargin = "";
    thresholds = [0];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

export { render };

/** Fresh user-event instance per test (isolates pointer/keyboard state). */
export const user = () => userEvent.setup();

/* ------------------------------------------------------------------ */
/* Standard module mock factories.                                     */
/* Usage in a test file:                                               */
/*   import { nextNavigationMock } from "../test-utils";               */
/*   vi.mock("next/navigation", () => nextNavigationMock());           */
/* The factory runs lazily (when the mocked module is first imported), */
/* so referencing an imported binding inside it is safe.               */
/* IMPORTANT: always wrap the factory call in an arrow — vi.mock is    */
/* hoisted above imports, so passing a binding directly (vi.mock(m,     */
/* nextLinkMock)) throws a TDZ ReferenceError. The arrow defers        */
/* evaluation until the mocked module is first imported, by which time  */
/* test-utils is initialized.                                          */

export const nextNavigationMock = (overrides: Record<string, unknown> = {}) => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  ...overrides,
});

export const nextAuthMock = (session: unknown = null, overrides: Record<string, unknown> = {}) => ({
  useSession: () => ({
    data: session,
    status: session ? "authenticated" : "unauthenticated",
    update: vi.fn(),
  }),
  signOut: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const nextLinkMock = async () => {
  const React = await import("react");
  return {
    default: (props: Record<string, unknown>) =>
      React.createElement("a", props, props.children as React.ReactNode),
  };
};

export const nextImageMock = async () => {
  const React = await import("react");
  return {
    default: (props: Record<string, unknown>) =>
      React.createElement(
        "img",
        { alt: (props.alt as string) ?? "", src: props.src },
        null
      ),
  };
};

/* ------------------------------------------------------------------ */
/* Browser API stubs jsdom lacks. Call inside the test that needs them.*/
/* ------------------------------------------------------------------ */

export const mockMatchMedia = (matches = false) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
};

/**
 * Mocks navigator.clipboard.writeText.
 * GOTCHA: call this AFTER creating the user instance (const u = user()),
 * because userEvent.setup() installs its own clipboard stub on navigator
 * and would silently replace a mock installed before it.
 */
export const mockClipboard = () => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
};
