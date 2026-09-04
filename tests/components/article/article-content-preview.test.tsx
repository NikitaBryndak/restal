// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "../test-utils";

const { sessionRef } = vi.hoisted(() => ({
  sessionRef: { current: null as unknown },
}));
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: sessionRef.current }) }));

import ArticleContentPreview from "@/components/article/article-content-preview";

describe("ArticleContentPreview", () => {
  it("renders sanitised HTML and strips script tags", () => {
    const { container } = render(
      <ArticleContentPreview content="<p>Hello</p><script>alert(1)</script>" />
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
  });

  it("shows a placeholder for empty content", () => {
    render(<ArticleContentPreview content="" />);
    expect(screen.getByText("No content available.")).toBeInTheDocument();
  });

  it("hides the source toggle from non-admins", () => {
    sessionRef.current = null;
    const { container } = render(<ArticleContentPreview content="<p>Body</p>" />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("lets admins switch between rendered and raw source views", () => {
    sessionRef.current = { user: { role: "admin" } };
    const { container } = render(<ArticleContentPreview content="<p>Hello</p>" />);

    // default is the rendered view, with a Source toggle available
    expect(screen.getByText("Hello")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Source" });

    fireEvent.click(toggle);
    // source view shows the sanitised markup as text
    expect(screen.getByText("<p>Hello</p>")).toBeInTheDocument();
    expect(container.querySelector("pre")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Rendered" }));
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(container.querySelector("pre")).toBeNull();
  });

  it("denies the toggle to non-admin roles", () => {
    sessionRef.current = { user: { role: "manager" } };
    const { container } = render(<ArticleContentPreview content="<p>Body</p>" />);
    expect(container.querySelector("button")).toBeNull();
  });
});
