"use client";

import { AuthForm } from "@/app/components/auth/auth-form";
import { useState } from "react";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(undefined);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email");
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      // TODO: Add your registration logic here
      console.log("Registration attempt:", { email, password });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      setError("An error occurred during registration. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return <AuthForm type="register" onSubmit={handleSubmit} isLoading={isLoading} error={error} />;
}