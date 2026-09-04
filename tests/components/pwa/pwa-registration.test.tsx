// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "react";
import { render } from "../test-utils";

import { PWARegistration } from "@/components/pwa/pwa-registration";

type FakeWorker = { state: string; postMessage: (msg: unknown) => void };
type FakeRegistration = {
  update: () => void;
  addEventListener: (type: string, handler: () => void) => void;
  installing?: FakeWorker & { addEventListener?: (type: string, handler: () => void) => void };
};

const stubServiceWorker = (registration: FakeRegistration) => {
  const registerSpy = vi.fn().mockResolvedValue(registration);
  Object.defineProperty(navigator, "serviceWorker", {
    value: { register: registerSpy },
    configurable: true,
  });
  return registerSpy;
};

describe("PWARegistration", () => {
  afterEach(() => {
    delete (navigator as unknown as Record<string, unknown>).serviceWorker;
  });

  it("registers /sw.js with root scope and no cache on load", async () => {
    const registration: FakeRegistration = { update: vi.fn(), addEventListener: vi.fn() };
    const registerSpy = stubServiceWorker(registration);

    render(<PWARegistration />);
    await act(async () => {}); // flush the async registration

    expect(registerSpy).toHaveBeenCalledTimes(1);
    expect(registerSpy).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" });
  });

  it("does nothing when service workers are unsupported", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<PWARegistration />);
    await act(async () => {});
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("auto-activates a new version once it is installed while a controller exists", async () => {
    let updatefoundHandler: (() => void) | null = null;
    let statechangeHandler: (() => void) | null = null;
    const postMessageSpy = vi.fn();

    const worker = {
      state: "installed",
      postMessage: postMessageSpy,
      addEventListener: (type: string, handler: () => void) => {
        if (type === "statechange") statechangeHandler = handler;
      },
    };
    const registration: FakeRegistration = {
      update: vi.fn(),
      addEventListener: (type, handler) => {
        if (type === "updatefound") updatefoundHandler = handler;
      },
      installing: worker,
    };

    stubServiceWorker(registration);
    render(<PWARegistration />);
    await act(async () => {});

    // a controller must exist for auto-activation to kick in
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: vi.fn(), controller: {} },
      configurable: true,
    });

    act(() => {
      updatefoundHandler!();
    });
    expect(statechangeHandler).not.toBeNull(); // component subscribed to the new worker's state changes

    act(() => {
      statechangeHandler!();
    });
    expect(postMessageSpy).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });
});
