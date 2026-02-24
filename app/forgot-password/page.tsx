"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_PASSWORD_LENGTH, OTP_LENGTH } from "@/config/constants";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<"request" | "verify">("request");

    // Form fields
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    // Cooldown timer for resend button
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");
        setError("");

        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber, purpose: "forgot-password" }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Щось пішло не так");
            }

            // Also call forgot-password endpoint to store OTP hash on user record
            await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber }),
            });

            // Move to next step
            setStep("verify");
            setMessage("Код підтвердження надіслано на ваш номер телефону.");
            setResendCooldown(60);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setIsLoading(true);
        setMessage("");
        setError("");

        try {
            await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber, purpose: "forgot-password" }),
            });

            await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber }),
            });

            setMessage("Код підтвердження надіслано повторно.");
            setResendCooldown(60);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Паролі не співпадають");
            return;
        }

        setIsLoading(true);
        setMessage("");
        setError("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber,
                    otp,
                    password
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Щось пішло не так");
            }

            setMessage("Пароль успішно змінено! Переспрямовуємо...");

            // Redirect to login after a few seconds
            setTimeout(() => {
                router.push("/login");
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-background border rounded-lg p-4 sm:p-8 shadow-sm">
                 <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-foreground mb-6 block"
                >
                    &larr; Назад до входу
                </Link>

                <h1 className="text-2xl font-bold mb-2">
                    {step === "request" ? "Відновлення пароля" : "Підтвердження коду"}
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                    {step === "request"
                        ? "Введіть ваш номер телефону і ми надішлемо вам код підтвердження через SMS."
                        : `Ми надіслали код на ${phoneNumber}. Введіть його нижче для відновлення пароля.`
                    }
                </p>

                {step === "request" ? (
                    <form onSubmit={handleRequestOTP} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Номер телефону</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                placeholder="+380XXXXXXXXX"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                        </div>

                        {error && <div className="text-sm text-red-500">{error}</div>}
                        {message && <div className="text-sm text-green-500">{message}</div>}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Надсилання..." : "Надіслати код"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Код підтвердження</Label>
                            <Input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                                required
                                maxLength={OTP_LENGTH}
                                className="text-center tracking-[0.5em] text-lg font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Новий пароль</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={MIN_PASSWORD_LENGTH}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Підтвердіть новий пароль</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={MIN_PASSWORD_LENGTH}
                            />
                        </div>

                        {error && <div className="text-sm text-red-500">{error}</div>}
                        {message && <div className="text-sm text-green-500">{message}</div>}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Збереження..." : "Встановити новий пароль"}
                        </Button>

                        <div className="flex items-center justify-between mt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setStep("request");
                                    setOtp("");
                                    setPassword("");
                                    setConfirmPassword("");
                                    setError("");
                                    setMessage("");
                                }}
                                className="text-sm text-muted-foreground underline hover:text-foreground"
                            >
                                ← Змінити номер
                            </button>

                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={isLoading || resendCooldown > 0}
                                className="text-sm text-muted-foreground underline hover:text-foreground disabled:opacity-50"
                            >
                                {resendCooldown > 0
                                    ? `Надіслати знову (${resendCooldown}с)`
                                    : "Надіслати знову"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
