"use client"

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Quote } from "@/types";
import { chooseRandomItem } from "@/lib/utils";
import { quotes } from "@/data";
import { FormField } from "./form-field";
import { useAuth } from "@/hooks/useAuth";


export function AuthForm({ type }: { type: "login" | "register" }) {
    const { isLoading, error, handleAuth } = useAuth({ type });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      await handleAuth({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
      });
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
        <div className="w-full lg:w-[45%] flex items-center justify-center p-8 relative">
          <div className="w-full max-w-[380px]">

            {/* Back */}
            <Link 
              href="/" 
              className="absolute top-6 left-6 text-sm text-foreground/60 flex items-center gap-2 transition-colors"
            >
              <span>&larr;</span>
              <span className="hover:underline">Back</span>
            </Link>

            {/* Logo */}
            <Link href="/" className="inline-block mb-8">
              <img src="/logo.png" alt="RestAll" className="h-7" />
            </Link>

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-light mb-1.5">
                {type === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-foreground/60 text-sm">
                {type === "login" ? "Sign in to continue" : "Start your journey"}
              </p>
            </div>

            {/* Social Logins */}
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-10 bg-background/50 border border-foreground/10 hover:bg-white/90 hover:text-black hover:border-foreground/20 transition-colors group text-sm"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2 fill-white group-hover:fill-black transition-colors" >
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
                Continue with Google
              </Button>
            </div>

            {/* Divider */} 
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 border"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  {error}
                </div>
              )}

              {/* Form Fields */}
              {type === "register" && (
                <FormField
                  id="name"
                  label="Name"
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="Your name"
                />
              )}

              <FormField
                id="email"
                label="Email"
                type="email"
                required
                disabled={isLoading}
                placeholder="name@example.com"
              />

              <FormField
                id="password"
                label="Password"
                type="password"
                required
                disabled={isLoading}
                minLength={8}
                placeholder="••••••••"
              />

              {type === "register" && (
                <FormField
                  id="confirmPassword"
                  label="Confirm password"
                  type="password"
                  required
                  disabled={isLoading}
                  minLength={8}
                  placeholder="••••••••"
                />
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isLoading}
                variant="default"
                className="w-full h-10 mt-2 text-black bg-white hover:bg-white/70 transition-colors text-sm"
              >
                {isLoading ? "Loading..." : type === "login" ? "Sign in" : "Sign up"}
              </Button>
              
              {/* Forgot Password Link */}
              {type === "login" && (
                <div className="text-center mt-2">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-foreground/60 hover:text-foreground/80 underline underline-offset-4 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </form>

            {/* Switch Auth Type Link */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-center bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm">
              <p className="text-sm text-foreground/60">
                {type === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <Link 
                      href="/register" 
                      className="text-foreground hover:text-foreground/80 underline underline-offset-4 transition-colors"
                    >
                      Sign up
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link 
                      href="/login" 
                      className="text-foreground hover:text-foreground/80 underline underline-offset-4 transition-colors"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:block lg:w-[55%] bg-cover bg-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-900/20" />
          <Image
            width={1365}
            height={1706}
            src="/login-bg.jpg"
            alt="Travel"
            className="absolute inset-0 w-full h-full object-cover"
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
