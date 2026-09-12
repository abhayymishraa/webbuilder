"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { authApi } from "@/api";
import { AuthFrame } from "@/components/ember/AuthFrame";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Call the register API
      const data = await authApi.register({ name, email, password });

      // Validate response data
      if (!data.access_token || !data.user) {
        console.error("Invalid response:", data);
        throw new Error("Invalid response from server");
      }

      // Store token in localStorage
      localStorage.setItem("auth_token", data.access_token);

      // Store user data
      localStorage.setItem("user_data", JSON.stringify(data.user));

      // Verify token was stored before redirect
      const storedToken = localStorage.getItem("auth_token");
      if (!storedToken) {
        throw new Error("Failed to store authentication token");
      }

      setIsLoading(false);
      router.push("/chat");
    } catch (error: unknown) {
      console.error("Error signing up:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign up";

      // Handle specific error messages
      if (errorMessage.includes("Email already registered")) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(errorMessage);
      }

      setIsLoading(false);
      // Clear any partial data on error
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
    }
  };

  return (
    <AuthFrame signup>
      <form
        onSubmit={handleSubmit}
        className="ember-form"
        aria-busy={isLoading}
      >
        <label htmlFor="name">
          Your name
          <Input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Your name"
          />
        </label>
        <label htmlFor="email">
          Email address
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            placeholder="you@example.com"
          />
        </label>
        <label htmlFor="password">
          Password
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={isLoading}
            aria-describedby="password-hint"
          />
        </label>
        <p id="password-hint" className="ember-helper">
          Use at least 6 characters.
        </p>
        {error && (
          <p className="ember-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={isLoading} className="ember-button">
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating account…
            </>
          ) : (
            "Create workspace"
          )}
        </Button>
      </form>
      <p className="ember-auth-switch">
        Already have an account? <Link href="/signin">Sign in</Link>
      </p>
    </AuthFrame>
  );
}
