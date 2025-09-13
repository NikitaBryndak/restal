"use client";

import { AuthForm } from "@/app/components/auth/auth-form";
import { useState } from "react";

export default function LoginPage() {
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

      // TODO: Add your login logic here
      console.log("Login attempt:", { email, password });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      setError("An error occurred during login. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return <AuthForm type="login" onSubmit={handleSubmit} isLoading={isLoading} error={error} />;
}
