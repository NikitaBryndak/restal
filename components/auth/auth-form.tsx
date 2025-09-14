"use client"

import React, { useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AuthFormProps, Quote } from "@/types";
import { chooseRandomItem } from "@/lib/utils";
import { quotes } from "@/data";

export function AuthForm({ type, onSubmit, isLoading, error }: AuthFormProps) {

    // const [credentials, setCredentials] = React.useState<Credential>({ email: "", password: "", confirmPassword: "" });

    // Fetch Quote
    const [currentQuote, setCurrentQuote] = React.useState<Quote>({ quote: "", author: "" });
    useEffect(() => {
      const { quote, author } = chooseRandomItem(quotes);
      setCurrentQuote({ quote, author });
    }, []);

    return (
      <div className="min-h-screen flex">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-8 xl:p-12 relative">
          <div className="w-full max-w-md">

            {/* Back */}
            <Link 
              href="/" 
              className="absolute top-8 left-8 text-sm text-foreground/60 flex items-center gap-2 transition-colors"
            >
              <span>&larr;</span>
              <span className="hover:underline">Назад</span>
            </Link>

            {/* Logo */}
            <Link href="/" className="inline-block mb-12">
              <img src="/logo.png" alt="RestAll" className="h-8" />
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-light mb-2">
                {type === "login" ? "З поверненням" : "Створити акаунт"}
              </h1>
              <p className="text-foreground/60">
                {type === "login" ? "Увійдіть для продовження" : "Почніть свою подорож"}
              </p>
            </div>

            {/* Social Logins */}
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-11 bg-background/50 border border-foreground/10 hover:bg-white/90 hover:text-black hover:border-foreground/20 transition-colors group"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 fill-white group-hover:fill-black transition-colors" >
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
                Продовжити з Google
              </Button>
            </div>

            {/* Divider */} 
            <div className="flex items-center gap-3 my-8">
              <div className="h-px flex-1 border"></div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  {error}
                </div>
              )}

              {/* Form Fields */}
                {type === "register" && (
                <div>
                  <Label htmlFor="name" className="text-sm text-foreground/70">Ім'я</Label>
                  <Input 
                    type="name" 
                    id="name" 
                    name="name" 
                    required 
                    disabled={isLoading}
                    className="mt-1.5 h-11 bg-background/50 border border-foreground/10 focus:border-foreground/30"
                    placeholder="Ваше ім'я"
                  />
                </div>
                )}

                <div>
                  <Label htmlFor="email" className="text-sm text-foreground/70">Електронна пошта</Label>
                  <Input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    disabled={isLoading}
                    className="mt-1.5 h-11 bg-background/50 border border-foreground/10 focus:border-foreground/30"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm text-foreground/70">Пароль</Label>
                  <Input 
                    type="password" 
                    id="password" 
                    name="password" 
                    required 
                    disabled={isLoading}
                    className="mt-1.5 h-11 bg-background/50 border border-foreground/10 focus:border-foreground/30"
                    minLength={8}
                    placeholder="••••••••"
                  />
                </div>

                {type === "register" && (
                  <div>
                    <Label htmlFor="confirm-password" className="text-sm text-foreground/70">
                      Підтвердіть пароль
                    </Label>
                    <Input 
                      type="password" 
                      id="confirm-password" 
                      name="confirmPassword" 
                      required 
                      disabled={isLoading}
                      className="mt-1.5 h-11 bg-background/50 border border-foreground/10 focus:border-foreground/30"
                      minLength={8}
                      placeholder="••••••••"
                    />
                  </div>
                )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isLoading}
                variant="default"
                className="w-full h-11 mt-4 mb-8 text-black bg-white hover:bg-white/70 transition-colors"
              >
                {isLoading ? "Завантаження..." : type === "login" ? "Увійти" : "Зареєструватися"}
              </Button>
            </form>

            {/* Switch Auth Type Link */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-center bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm">
              <p className="text-sm text-foreground/60">
                {type === "login" ? (
                  <>
                    Немає облікового запису?{" "}
                    <Link 
                      href="/register" 
                      className="text-foreground hover:text-foreground/80 underline underline-offset-4 transition-colors"
                    >
                      Зареєструватися
                    </Link>
                  </>
                ) : (
                  <>
                    Вже маєте обліковий запис?{" "}
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
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-900/20" />
          <img
            src="https://images.unsplash.com/photo-1757492166964-518d2c8b9f41?q=80&w=1365&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
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
