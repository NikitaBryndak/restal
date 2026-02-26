"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Quote } from "@/types";
import { chooseRandomItem } from "@/lib/utils";
import { quotes } from "@/data";
import { FormField } from "./form-field";
import { useAuth } from "@/hooks/useAuth";
import { MIN_PASSWORD_LENGTH, OTP_LENGTH } from "@/config/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export function AuthForm({ type }: { type: "login" | "register" }) {
    const {
      isLoading,
      error,
      handleAuth,
      registrationStep,
      handleVerifyOtp,
      handleResendOtp,
      handleBackToForm,
      pendingPhoneNumber,
    } = useAuth({ type });

    const [otpValue, setOtpValue] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    // Cooldown timer for resend button
    useEffect(() => {
      if (resendCooldown <= 0) return;
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Start cooldown when OTP step is shown
    useEffect(() => {
      if (registrationStep === "otp") {
        setResendCooldown(60);
        setOtpValue("");
      }
    }, [registrationStep]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);

      await handleAuth({
        name: formData.get("name") as string,
        phoneNumber: formData.get("phoneNumber") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
        referralCode: formData.get("referralCode") as string,
      });
    };

    const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await handleVerifyOtp(otpValue);
    };

    const handleResend = async () => {
      await handleResendOtp();
      setResendCooldown(60);
    };

    // Fetch Quote
    const [currentQuote, setCurrentQuote] = React.useState<Quote>({ quote: "", author: "" });
    useEffect(() => {
      const { quote, author } = chooseRandomItem(quotes);
      setCurrentQuote({ quote, author });
    }, []);

    return (
      <div className="min-h-screen flex">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-4 sm:p-8 relative">
          <div className="w-full max-w-[380px]">

            {/* Back */}
            <Link
              href="/"
              className="absolute top-6 left-6 text-sm text-foreground/60 flex items-center gap-2 transition-colors"
            >
              <span>&larr;</span>
              <span className="hover:underline">Назад</span>
            </Link>

            {/* Logo */}
            <Link href="/" className="inline-block mb-8">
              <Image src="/logo.png" alt="RestAL" width={112} height={28} className="h-7 w-auto" />
            </Link>

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-light mb-1.5">
                {type === "login"
                  ? "Вітаємо знову"
                  : registrationStep === "otp"
                    ? "Підтвердження номера"
                    : "Створити акаунт"}
              </h1>
              <p className="text-foreground/60 text-sm">
                {type === "login"
                  ? "Ввійдіть, щоб продовжити"
                  : registrationStep === "otp"
                    ? `Ми надіслали SMS-код на ${pendingPhoneNumber}`
                    : "Розпочніть свою подорож"}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 border"></div>
            </div>

            <form onSubmit={type === "register" && registrationStep === "otp" ? handleOtpSubmit : handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  {error}
                </div>
              )}

              {/* OTP Step (Registration) */}
              {type === "register" && registrationStep === "otp" ? (
                <>
                  <div>
                    <Label htmlFor="otp" className="text-sm text-foreground/60 mb-1.5 block">
                      Код підтвердження
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                      required
                      maxLength={OTP_LENGTH}
                      disabled={isLoading}
                      className="h-11 bg-background/50 border border-foreground/10 focus:border-foreground/30 text-center tracking-[0.5em] text-lg font-mono"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || otpValue.length !== OTP_LENGTH}
                    variant="default"
                    className="w-full h-10 mt-2 text-black bg-white hover:bg-white/70 transition-colors text-sm"
                  >
                    {isLoading ? "Перевірка..." : "Підтвердити код"}
                  </Button>

                  <div className="flex items-center justify-between mt-2">
                    <button
                      type="button"
                      onClick={handleBackToForm}
                      disabled={isLoading}
                      className="text-sm text-foreground/60 hover:text-foreground/80 underline underline-offset-4 transition-colors"
                    >
                      ← Змінити номер
                    </button>

                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isLoading || resendCooldown > 0}
                      className="text-sm text-foreground/60 hover:text-foreground/80 underline underline-offset-4 transition-colors disabled:opacity-50 disabled:no-underline"
                    >
                      {resendCooldown > 0
                        ? `Надіслати знову (${resendCooldown}с)`
                        : "Надіслати знову"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Form Fields */}
              {type === "register" && (
                <FormField
                  id="name"
                  label="Ім'я"
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="Ваше ім'я"
                />
              )}

              <FormField
                id="phoneNumber"
                label="Номер телефону"
                type="tel"
                required
                disabled={isLoading}
                placeholder="+380XXXXXXXXX"
              />

              <FormField
                id="password"
                label="Пароль"
                type="password"
                required
                disabled={isLoading}
                minLength={MIN_PASSWORD_LENGTH}
                placeholder="••••••••"
              />

              {type === "register" && (
                <FormField
                  id="confirmPassword"
                  label="Підтвердіть пароль"
                  type="password"
                  required
                  disabled={isLoading}
                  minLength={MIN_PASSWORD_LENGTH}
                  placeholder="••••••••"
                />
              )}

              {type === "register" && (
                <FormField
                  id="referralCode"
                  label="Реферальний код (необов'язково)"
                  type="text"
                  disabled={isLoading}
                  placeholder="REF-XXXX-XXXX"
                  className="uppercase tracking-wider font-mono"
                />
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                variant="default"
                className="w-full h-10 mt-2 text-black bg-white hover:bg-white/70 transition-colors text-sm"
              >
                {isLoading ? "Завантаження..." : type === "login" ? "Увійти" : "Далі →"}
              </Button>

              {/* Forgot Password Link */}
              {type === "login" && (
                <div className="text-center mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-foreground/60 hover:text-foreground/80 underline underline-offset-4 transition-colors"
                  >
                    Забули пароль?
                  </Link>
                </div>
              )}
                </>
              )}
            </form>

            {/* Switch Auth Type Link */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-center bg-linear-to-t from-background/80 to-transparent backdrop-blur-sm">
              <p className="text-sm text-foreground/60">
                {type === "login" ? (
                  <>
                    Немає акаунту?{" "}
                    <Link
                      href="/register"
                      className="text-foreground hover:text-foreground/80 underline underline-offset-4 transition-colors"
                    >
                      Зареєструватися
                    </Link>
                  </>
                ) : (
                  <>
                    Вже є акаунт?{" "}
                    <Link
                      href="/login"
                      className="text-foreground hover:text-foreground/80 underline underline-offset-4 transition-colors"
                    >
                      Увійти
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:block lg:w-[55%] bg-cover bg-center relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-orange-500/20 to-orange-900/20" />
          <Image
            width={1365}
            height={1706}
            src="/login-bg.jpg"
            alt="Travel"
            className="absolute inset-0 w-full h-full object-cover"
            sizes="55vw"
            priority
            quality={80}
          />
          <div className="absolute inset-0 backdrop-blur-[1px]" />
          <div className="relative z-10 p-12 h-full flex flex-col justify-end">
            <blockquote className="text-white max-w-lg">
              <p className="text-2xl font-light mb-4">
                {currentQuote.quote}
              </p>
              <footer className="text-sm text-white/70">— {currentQuote.author}</footer>
            </blockquote>
          </div>
        </div>
      </div>
  );
};
