// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { render, user, nextLinkMock, nextImageMock } from "../test-utils";

const { authRef } = vi.hoisted(() => ({ authRef: { current: null as ReturnType<typeof defaultAuth> | null } }));

vi.mock("next/link", () => nextLinkMock());
vi.mock("next/image", () => nextImageMock());
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => authRef.current }));

import { AuthForm } from "@/components/auth/auth-form";

function defaultAuth(overrides: Record<string, unknown> = {}) {
  return {
    isLoading: false,
    error: null,
    handleAuth: vi.fn().mockResolvedValue(undefined),
    registrationStep: "form",
    handleVerifyOtp: vi.fn().mockResolvedValue(undefined),
    handleResendOtp: vi.fn().mockResolvedValue(undefined),
    handleBackToForm: vi.fn(),
    pendingPhoneNumber: "+380991234567",
    ...overrides,
  };
}

describe("AuthForm", () => {
  beforeEach(() => {
    authRef.current = defaultAuth();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the login form with phone/password and no registration fields", () => {
    render(<AuthForm type="login" />);
    expect(screen.getByText("Вітаємо знову")).toBeInTheDocument();
    expect(screen.getByLabelText(/Номер телефону/)).toBeInTheDocument();
    expect(screen.getByLabelText("Пароль")).toHaveAttribute("type", "password");
    expect(screen.queryByLabelText(/Ім'я/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Увійти" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Забули пароль/ })).toHaveAttribute("href", "/forgot-password");
  });

  it("renders the registration form with all fields and a switch-to-login link", () => {
    render(<AuthForm type="register" />);
    expect(screen.getByText("Створити акаунт")).toBeInTheDocument();
    for (const label of ["Ім'я", "Номер телефону", "Пароль", "Підтвердіть пароль"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText(/Реферальний код/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Далі →" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Увійти" })).toHaveAttribute("href", "/login");
  });

  it("submits the login form values to handleAuth", async () => {
    render(<AuthForm type="login" />);
    await user().type(screen.getByLabelText(/Номер телефону/), "+380991234567");
    await user().type(screen.getByLabelText("Пароль"), "secret-pass");
    await user().click(screen.getByRole("button", { name: "Увійти" }));

    expect(authRef.current!.handleAuth).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumber: "+380991234567", password: "secret-pass" })
    );
  });

  it("shows the auth error message when present", () => {
    authRef.current = defaultAuth({ error: "Невірний пароль" });
    render(<AuthForm type="login" />);
    expect(screen.getByText("Невірний пароль")).toBeInTheDocument();
  });

  it("disables submit and shows a loading label while authenticating", () => {
    authRef.current = defaultAuth({ isLoading: true });
    render(<AuthForm type="login" />);
    const btn = screen.getByRole("button", { name: "Завантаження..." });
    expect(btn).toBeDisabled();
  });

  it("renders the OTP step with a disabled confirm button until six digits are entered", async () => {
    authRef.current = defaultAuth({ registrationStep: "otp" });
    render(<AuthForm type="register" />);

    expect(screen.getByText("Підтвердження номера")).toBeInTheDocument();
    expect(screen.getByText(/Ми надіслали SMS-код на \+380991234567/)).toBeInTheDocument();

    const otp = screen.getByPlaceholderText("123456");
    let confirm = screen.getByRole("button", { name: "Підтвердити код" });
    expect(confirm).toBeDisabled();

    await user().type(otp, "12345");
    confirm = screen.getByRole("button", { name: "Підтвердити код" });
    expect(confirm).toBeDisabled();

    await user().type(otp, "6");
    confirm = screen.getByRole("button", { name: "Підтвердити код" });
    expect(confirm).toBeEnabled();
  });

  it("filters non-digits out of the OTP input and caps at six characters", async () => {
    authRef.current = defaultAuth({ registrationStep: "otp" });
    render(<AuthForm type="register" />);
    const otp = screen.getByPlaceholderText("123456");
    await user().type(otp, "12a4567890");
    expect(otp).toHaveValue("124567");
  });

  it("verifies the entered OTP on submit", async () => {
    authRef.current = defaultAuth({ registrationStep: "otp" });
    render(<AuthForm type="register" />);
    await user().type(screen.getByPlaceholderText("123456"), "123456");
    await user().click(screen.getByRole("button", { name: "Підтвердити код" }));
    expect(authRef.current.handleVerifyOtp).toHaveBeenCalledWith("123456");
  });

  it("counts the resend cooldown down and resends when it reaches zero", async () => {
    vi.useFakeTimers();
    authRef.current = defaultAuth({ registrationStep: "otp" });
    render(<AuthForm type="register" />);
    act(() => {}); // flush mount effect that starts the 60s cooldown

    let resend = screen.getByRole("button", { name: /Надіслати знову \(60с\)/, hidden: true });
    expect(resend).toBeDisabled();

    // each tick re-schedules from the latest state, so advance one second at a time
    for (let i = 0; i < 60; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
    resend = screen.getByRole("button", { name: "Надіслати знову", hidden: true });
    expect(resend).toBeEnabled();

    fireEvent.click(resend);
    await act(async () => {});
    expect(authRef.current.handleResendOtp).toHaveBeenCalled();
    // cooldown restarts after a manual resend
    expect(screen.getByRole("button", { name: /Надіслати знову \(60с\)/, hidden: true })).toBeDisabled();
  });

  it("lets the user go back to change the phone number", async () => {
    authRef.current = defaultAuth({ registrationStep: "otp" });
    render(<AuthForm type="register" />);
    await user().click(screen.getByRole("button", { name: /Змінити номер/ }));
    expect(authRef.current.handleBackToForm).toHaveBeenCalled();
  });
});
