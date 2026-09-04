// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { screen, within } from "@testing-library/react";
import { render } from "./test-utils";

const { providerSpy } = vi.hoisted(() => ({ providerSpy: vi.fn() }));
vi.mock("next-auth/react", () => ({
  SessionProvider: (props: { children?: ReactNode }) => {
    providerSpy(props.children);
    return <div data-testid="session-provider">{props.children}</div>;
  },
}));

import { AuthProvider } from "@/components/Providers";

describe("AuthProvider", () => {
  it("renders its children inside the next-auth SessionProvider", () => {
    render(
      <AuthProvider>
        <span>child content</span>
      </AuthProvider>
    );

    const provider = screen.getByTestId("session-provider");
    expect(within(provider).getByText("child content")).toBeInTheDocument();
    // the real SessionProvider was used (mock records every render)
    expect(providerSpy).toHaveBeenCalled();
  });
});
