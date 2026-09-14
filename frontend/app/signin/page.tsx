"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { authApi } from "@/api";
import { clearSession, getSessionId, saveSession } from "@/api/session";
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
        const sessionId = getSessionId();
        if (token) {
          const user = await authApi.getCurrentUser();
          if (disposed) return;
          if (getSessionId() === sessionId) {
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
    return () => {
      disposed = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Call the login API
      const data = await authApi.login({ email, password });

      saveSession(data);

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
      clearSession();
    }
  };

  if (checkingSession) {
    return (
      <main className="ember-auth-page" aria-busy="true">
        <p
          className="ember-helper text-[12px] leading-[1.6] text-muted-foreground p-6"
          role="status"
        >
          Checking your session…
        </p>
      </main>
    );
  }

  return (
    <AuthFrame>
      <SocialLogin />
      <form
        onSubmit={handleSubmit}
        className="ember-form flex flex-col gap-[21px] mt-7.5 [&_.ember-helper]:-mt-3"
        aria-busy={isLoading}
      >
        <label className="flex flex-col gap-[9px] text-[13px]" htmlFor="email">
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
        <label
          className="flex flex-col gap-[9px] text-[13px]"
          htmlFor="password"
        >
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
        <p
          id="password-hint"
          className="ember-helper text-[12px] leading-[1.6] text-muted-foreground"
        >
          Use the password for your WebBuilder account.
        </p>
        {error && (
          <p
            className="ember-error text-destructive border border-destructive bg-card py-3 px-[15px] rounded-[8px] text-[13px] leading-[1.5]"
            role="alert"
          >
            {error}
          </p>
        )}
        <Button type="submit" disabled={isLoading} variant="default">
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
      <p className="ember-auth-switch text-[13px]! text-center mt-[25px]! [&_a]:text-accent-foreground [&_a]:underline [&_a]:underline-offset-[3px]">
        <Link href="/verify-email">Verify your email</Link>
      </p>
      <p className="ember-auth-switch text-[13px]! text-center mt-[25px]! [&_a]:text-accent-foreground [&_a]:underline [&_a]:underline-offset-[3px]">
        New to WebBuilder? <Link href="/signup">Create a workspace</Link>
      </p>
    </AuthFrame>
  );
}
