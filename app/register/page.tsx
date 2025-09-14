"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { set } from "mongoose";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(undefined);

    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name");
      const email = formData.get("email");
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");


      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }



      { /* Api Call */ }
      const resUserExists = await fetch('/api/userExists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const { exists } = await resUserExists.json();
      if (exists) {
        setError("User with this email already exists. Please log in.");
        setIsLoading(false);
        return;
      }
      
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.message || "Registration failed");} else {
        router.push('/login');
      }




    } catch (err) {
      setError("An error occurred during registration. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return <AuthForm type="register" onSubmit={handleSubmit} isLoading={isLoading} error={error} />;
}