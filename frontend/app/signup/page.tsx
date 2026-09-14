"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { type AuthOptions, authApi } from "@/api";
import { AuthFrame } from "@/components/ember/AuthFrame";
import { SocialLogin } from "@/components/ember/SocialLogin";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<AuthOptions | null>(null);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authApi.register({ name, email, password });
      setRegistered(true);
      setIsLoading(false);
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
    }
  };

  if (registered)
    return (
      <AuthFrame signup>
        <p role="status">
          We sent a verification link to {email}. Open it within 30 minutes to
          continue.
        </p>
        <p className="ember-auth-switch text-[13px]! text-center mt-[25px]! [&_a]:text-accent-foreground [&_a]:underline [&_a]:underline-offset-[3px]">
          <Link href="/verify-email">Resend verification email</Link>
        </p>
      </AuthFrame>
    );

  return (
    <AuthFrame signup>
      <SocialLogin registration onOptions={setOptions} />
      <form
        onSubmit={handleSubmit}
        className="ember-form flex flex-col gap-[21px] mt-7.5 [&_.ember-helper]:-mt-3"
        aria-busy={isLoading}
      >
        <label className="flex flex-col gap-[9px] text-[13px]" htmlFor="name">
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={256}
            disabled={isLoading}
            aria-describedby="password-hint"
          />
        </label>
        <p
          id="password-hint"
          className="ember-helper text-[12px] leading-[1.6] text-muted-foreground"
        >
          Use at least 8 characters. Verify your email to open your workspace.
        </p>
        {error && (
          <p
            className="ember-error text-destructive border border-destructive bg-card py-3 px-[15px] rounded-[8px] text-[13px] leading-[1.5]"
            role="alert"
          >
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={isLoading || !options?.email_verification}
          variant="default"
        >
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
      <p className="ember-auth-switch text-[13px]! text-center mt-[25px]! [&_a]:text-accent-foreground [&_a]:underline [&_a]:underline-offset-[3px]">
        Already have an account? <Link href="/signin">Sign in</Link>
      </p>
    </AuthFrame>
  );
}
