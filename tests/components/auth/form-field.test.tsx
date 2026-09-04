// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render, user } from "../test-utils";

import { FormField } from "@/components/auth/form-field";

describe("FormField", () => {
  it("associates the label with the input via htmlFor/id", () => {
    render(<FormField id="email" label="Email" type="text" />);
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "email");
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "email");
  });

  it("sets name from id and passes through type, placeholder and minLength", () => {
    render(
      <FormField id="phone" label="Телефон" type="tel" placeholder="+380" minLength={10} />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("name", "phone");
    expect(input).toHaveAttribute("type", "tel");
    expect(input).toHaveAttribute("placeholder", "+380");
    expect(input).toHaveAttribute("minlength", "10");
  });

  it("applies required and disabled attributes", () => {
    const { container } = render(
      <FormField id="pass" label="Пароль" type="password" required disabled />
    );
    const input = container.querySelector('input[type="password"]')!;
    expect(input).toHaveAttribute("required");
    expect(input).toBeDisabled();
  });

  it("accepts typing when enabled", async () => {
    render(<FormField id="name" label="Ім'я" type="text" />);
    await user().type(screen.getByRole("textbox"), "Nikita");
    expect(screen.getByRole("textbox")).toHaveValue("Nikita");
  });

  it("merges a custom className with the defaults", () => {
    render(<FormField id="x" label="X" type="text" className="mt-4" />);
    expect(screen.getByRole("textbox")).toHaveClass("mt-4", "h-11");
  });
});
