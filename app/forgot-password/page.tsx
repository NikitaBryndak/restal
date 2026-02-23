"use client";

import { useState } from "react";
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

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");
        setError("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            // Move to next step
            setStep("verify");
            setMessage(data.message);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
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
                throw new Error(data.message || "Something went wrong");
            }

            setMessage("Password reset successful! Redirecting...");

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
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength={OTP_LENGTH}
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

                        <button
                            type="button"
                            onClick={() => setStep("request")}
                            className="text-sm text-muted-foreground underline w-full text-center mt-2 hover:text-foreground"
                        >
                            Змінити номер телефону
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
