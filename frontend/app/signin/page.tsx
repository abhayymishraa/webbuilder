"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { authApi } from "@/api";
import { AuthFrame } from "@/components/ember/AuthFrame";
import { SocialLogin } from "@/components/ember/SocialLogin";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let disposed = false;

    const checkSession = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          const user = await authApi.getCurrentUser();
          if (disposed) return;
          if (localStorage.getItem("auth_token") === token) {
            try {
              localStorage.setItem("user_data", JSON.stringify(user));
            } catch {
              // Caching profile data is optional after validating the session.
            }
            router.replace("/chat");
            return;
          }
        }
      } catch {
        // The API client clears expired credentials. Network failures keep them.
      }
      if (!disposed) setCheckingSession(false);
    };

    void checkSession();
    return () => { disposed = true; };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Call the login API
      const data = await authApi.login({ email, password });

      // Validate response data
      if (!data.access_token) {
        throw new Error("No access token received");
      }

      // Store token in localStorage
      localStorage.setItem("auth_token", data.access_token);

      // Fetch user data after login since login doesn't return it
      try {
        const userData = await authApi.getCurrentUser();
        localStorage.setItem("user_data", JSON.stringify(userData));
      } catch (err) {
        console.warn("Failed to fetch user data after login:", err);
        // Continue anyway, user data will be fetched on chat page
      }

      // Verify token was stored before redirect
      const storedToken = localStorage.getItem("auth_token");
      if (!storedToken) {
        throw new Error("Failed to store authentication token");
      }

      setIsLoading(false);
      router.replace("/chat");
    } catch (error: unknown) {
      console.error("Error signing in:", error);
      setError(error instanceof Error ? error.message : "Failed to sign in");
      setIsLoading(false);
      // Clear any partial data on error
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
    }
  };

  if (checkingSession) {
    return (
      <main className="ember-auth-page" aria-busy="true">
        <p className="ember-helper p-6" role="status">Checking your session…</p>
      </main>
    );
  }

  return (
    <AuthFrame>
      <SocialLogin />
      <form
        onSubmit={handleSubmit}
        className="ember-form"
        aria-busy={isLoading}
      >
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={isLoading}
            aria-describedby="password-hint"
          />
        </label>
        <p id="password-hint" className="ember-helper">
          Use the password for your WebBuilder account.
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
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      <p className="ember-auth-switch"><Link href="/verify-email">Verify your email</Link></p>
      <p className="ember-auth-switch">
        New to WebBuilder? <Link href="/signup">Create a workspace</Link>
      </p>
    </AuthFrame>
  );
}
