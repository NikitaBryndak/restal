// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render, user } from "../test-utils";
import FormInput from "@/components/ui/form-input";

describe("FormInput", () => {
  it("renders a label linked to the input via htmlFor/id (id falls back to name)", () => {
    const { container } = render(
      <FormInput labelText="Ім'я" name="name" />
    );
    expect(screen.getByText("Ім'я")).toHaveAttribute("for", "name");
    expect(container.querySelector("input")).toHaveAttribute("id", "name");
  });

  it("does not render a label when labelText is omitted", () => {
    const { container } = render(<FormInput name="x" />);
    expect(container.querySelector("label")).not.toBeInTheDocument();
  });

  it("passes raw value through unchanged for the default formatType", async () => {
    const onChange = vi.fn();
    render(<FormInput name="free" onChange={onChange} />);
    await user().type(screen.getByRole("textbox"), "abc-123");
    expect(screen.getByRole("textbox")).toHaveValue("abc-123");
  });

  it("formats date input as DD/MM/YYYY while typing digits", async () => {
    const onChange = vi.fn();
    render(<FormInput name="d" formatType="date" onChange={onChange} />);
    await user().type(screen.getByRole("textbox"), "01022026");
    expect(screen.getByRole("textbox")).toHaveValue("01/02/2026");
    // onChange receives a synthetic event carrying the formatted value
    const lastCall = onChange.mock.calls.at(-1)![0];
    expect(lastCall.target.value).toBe("01/02/2026");
  });

  it("shows a validation error and aria-invalid for an impossible date", async () => {
    render(<FormInput name="d" formatType="date" />);
    const input = screen.getByRole("textbox");
    await user().type(input, "31022025"); // 31 Feb 2025
    expect(input).toHaveValue("31/02/2025");
    expect(screen.getByText("лютий 2025 має лише 28 днів.")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("border-red-500");
  });

  it("clears the date error once the field is corrected", async () => {
    render(<FormInput name="d" formatType="date" />);
    const input = screen.getByRole("textbox");
    await user().type(input, "3102"); // incomplete -> format error
    expect(screen.getByText(/ДД\/ММ\/РРРР/)).toBeInTheDocument();

    await user().clear(input);
    await user().type(input, "28022025"); // valid date from scratch
    expect(input).toHaveValue("28/02/2025");
    expect(screen.queryByText(/ДД\/ММ\/РРРР/)).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  it("formats time input as HH:MM and rejects out-of-range hours", async () => {
    render(<FormInput name="t" formatType="time" />);
    const input = screen.getByRole("textbox");
    await user().type(input, "2400"); // 24:00 — invalid hour
    expect(input).toHaveValue("24:00");
    expect(screen.getByText("Hours must be between 00 and 23.")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("accepts a valid time without error", async () => {
    render(<FormInput name="t" formatType="time" />);
    const input = screen.getByRole("textbox");
    await user().type(input, "2359");
    expect(input).toHaveValue("23:59");
    expect(screen.queryByText(/Hours must be/)).not.toBeInTheDocument();
  });

  it("validates email format and treats empty as valid (optional field)", async () => {
    render(<FormInput name="e" formatType="email" />);
    const input = screen.getByRole("textbox");
    // Empty is allowed for an optional field.
    expect(
      screen.queryByText("Please enter a valid email address.")
    ).not.toBeInTheDocument();

    await user().type(input, "not-an-email");
    expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");

    await user().clear(input);
    await user().type(input, "test@example.com");
    expect(
      screen.queryByText("Please enter a valid email address.")
    ).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  it("syncs an externally controlled value into the display", () => {
    render(<FormInput name="d" formatType="date" value="01/02/2026" />);
    expect(screen.getByRole("textbox")).toHaveValue("01/02/2026");
  });

  it("applies containerClassName to the wrapper div", () => {
    const { container } = render(
      <FormInput name="x" containerClassName="w-80" />
    );
    expect(container.firstElementChild).toHaveClass("w-80");
  });
});
