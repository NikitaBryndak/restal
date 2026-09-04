// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { screen } from "@testing-library/react";
import { render, user } from "../test-utils";
import RichTextEditor from "@/components/ui/rich-text-editor";

const setup = (value: string) => {
  const onChange = vi.fn();
  render(<RichTextEditor value={value} onChange={onChange} />);
  return { onChange, textarea: screen.getByRole("textbox") as HTMLTextAreaElement };
};

describe("RichTextEditor", () => {
  it("renders toolbar buttons, the editor and a live char/word status bar", () => {
    const value = "one two three";
    const { textarea } = setup(value);
    expect(textarea).toHaveValue(value);
    for (const label of ["Bold", "Italic", "Underline", "Insert link", "Auto-format plain text to HTML"]) {
      expect(screen.getByTitle(label)).toBeInTheDocument();
    }
    expect(
      screen.getByText(new RegExp(`${value.length} chars`))
    ).toBeInTheDocument();
  });

  it("calls onChange with the new value when typing", async () => {
    const onChange = vi.fn();
    function Harness() {
      const [value, setValue] = useState("");
      return (
        <RichTextEditor
          value={value}
          onChange={(v) => {
            onChange(v);
            setValue(v);
          }}
        />
      );
    }
    render(<Harness />);
    await user().type(screen.getByRole("textbox"), "hi");
    expect(onChange).toHaveBeenLastCalledWith("hi");
  });

  it("Bold wraps the current selection in <strong>", async () => {
    const { onChange, textarea } = setup("hello world");
    textarea.setSelectionRange(6, 11); // select "world"
    await user().click(screen.getByTitle("Bold"));
    expect(onChange).toHaveBeenCalledWith("hello <strong>world</strong>");
  });

  it("wraps the placeholder word 'text' when nothing is selected", async () => {
    const { onChange } = setup("");
    await user().click(screen.getByTitle("Italic"));
    expect(onChange).toHaveBeenCalledWith("<em>text</em>");
  });

  it("Ctrl+B wraps the selection like the Bold button", async () => {
    const { onChange, textarea } = setup("hello world");
    textarea.focus();
    textarea.setSelectionRange(6, 11);
    await user().keyboard("{Control>}b{/Control}");
    expect(onChange).toHaveBeenCalledWith("hello <strong>world</strong>");
  });

  it("bullet list inserts a <ul> block with paragraph separation", async () => {
    const { onChange, textarea } = setup("intro ");
    textarea.setSelectionRange(6, 6); // cursor at end of "intro "
    await user().click(screen.getByTitle("Bullet list"));
    expect(onChange).toHaveBeenCalledWith(
      'intro \n\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>\n'
    );
  });

  it("preview renders sanitized HTML and strips script tags", async () => {
    const malicious = '<script>alert(1)</script><p>safe text</p>';
    setup(malicious);
    await user().click(screen.getByTitle("Preview HTML"));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("safe text")).toBeInTheDocument();
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });

  it("preview shows a placeholder when the value is empty", async () => {
    setup("");
    await user().click(screen.getByTitle("Preview HTML"));
    expect(screen.getByText(/Nothing to preview yet/)).toBeInTheDocument();
  });

  it("toggles back to edit mode from preview", async () => {
    setup("abc");
    await user().click(screen.getByTitle("Preview HTML"));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await user().click(screen.getByTitle("Edit mode"));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("auto-format converts plain text into headings, paragraphs and lists", async () => {
    const plain = "My Title\n\nFirst paragraph here.\n\n- item one.\n- item two.";
    const { onChange } = setup(plain);
    await user().click(screen.getByTitle("Auto-format plain text to HTML"));
    expect(onChange).toHaveBeenCalledWith(
      "<h2>My Title</h2>\n\n<p>First paragraph here.</p>\n\n<ul>\n  <li>item one.</li>\n  <li>item two.</li>\n</ul>"
    );
  });

  it("auto-format refuses content that already contains HTML tags", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { onChange } = setup("<p>already html</p>");
    await user().click(screen.getByTitle("Auto-format plain text to HTML"));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });
});
