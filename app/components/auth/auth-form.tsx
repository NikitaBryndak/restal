import React from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { AuthFormProps } from "@/app/types";

export function AuthForm({ type, onSubmit, isLoading, error }: AuthFormProps) {
  return (
    <div className="flex flex-wrap flex-col justify-center items-center min-h-screen">
      <div className="w-full max-w-md backdrop-blur-md rounded-lg shadow-xl/30 shadow-white/20 border border-white/10 bg-[--foreground]">
        <form
          onSubmit={onSubmit}
          className="space-y-4 p-6 flex flex-col justify-center items-center"
        >
          {/* Header */}
          <h1 className="text-5xl font-bold m-6">RestAll</h1>
          <p className="">Ваша подорож починається тут</p>

          {/* Error Message */}
          {error && (
            <div className="w-full p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500">
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="w-full space-y-1">
            <Label htmlFor="email">Email:</Label>
            <Input 
              type="email" 
              id="email" 
              name="email" 
              required 
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="w-full space-y-1">
            <Label htmlFor="password">Password:</Label>
            <Input 
              type="password" 
              id="password" 
              name="password" 
              required 
              disabled={isLoading}
              className="w-full"
              minLength={8}
            />
          </div>

          {type === "register" && (
            <div className="w-full space-y-1">
              <Label htmlFor="confirm-password">Confirm Password:</Label>
              <Input 
                type="password" 
                id="confirm-password" 
                name="confirmPassword" 
                required 
                disabled={isLoading}
                className="w-full"
                minLength={8}
              />
            </div>
          )}

          <Button 
            type="submit" 
            variant="outline"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Loading..." : type === "login" ? "Login" : "Register"}
          </Button>
        </form>

        <hr className="w-full border-t border-gray-300/30 my-4" />

        {/* Footer */}
        <div className="mt-4 text-center mb-6">
          {type === "login" ? (
            <p>
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-500 hover:text-blue-400 underline">
                Register here
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Link href="/login" className="text-blue-500 hover:text-blue-400 underline">
                Login here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
