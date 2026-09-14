"use client";
import { saveSession } from "@/api/session";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/api";
import { AuthFrame } from "@/components/ember/AuthFrame";
import type { LoginResponse } from "@/api/types";

const errors: Record<string, string> = {
  link_required:
    "An account already uses this email. Sign in with email, then connect this provider from your profile.",
  verified_email_required:
    "Your provider must have a verified email address before you can continue.",
  account_conflict:
    "This provider is already connected to another account, or your account already has a different connection.",
  oauth_failed:
    "Sign-in was cancelled or could not be completed. Please try again.",
};

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  // Reuse the one-time exchange across Strict Mode effect setup/cleanup.
  const exchange = useRef<Promise<LoginResponse> | null>(null);
  const callbackError = useRef("");
  useEffect(() => {
    let disposed = false;
    if (!exchange.current && !callbackError.current) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const ticket = params.get("ticket");
      callbackError.current =
        params.get("error") || (!ticket ? "oauth_failed" : "");
      window.history.replaceState(null, "", window.location.pathname);
      exchange.current =
        ticket && !callbackError.current
          ? authApi.exchangeOAuth(ticket)
          : Promise.reject(new Error("OAuth callback rejected"));
    }
    exchange.current
      ?.then(async (session) => {
        if (disposed) return;
        saveSession(session);
        const user = await authApi.getCurrentUser();
        if (disposed) return;
        localStorage.setItem("user_data", JSON.stringify(user));
        router.replace("/chat");
      })
      .catch(() => {
        if (!disposed)
          setError(errors[callbackError.current] || errors.oauth_failed);
      });
    return () => {
      disposed = true;
    };
  }, [router]);
  return (
    <AuthFrame
      title="Connecting your account"
      description="We’re getting your workspace ready."
    >
      {error ? (
        <>
          <p
            className="ember-error text-destructive border border-destructive bg-card py-3 px-[15px] rounded-[8px] text-[13px] leading-[1.5]"
            role="alert"
          >
            {error}
          </p>
          <p className="ember-auth-switch text-[13px]! text-center mt-[25px]! [&_a]:text-accent-foreground [&_a]:underline [&_a]:underline-offset-[3px]">
            <Link href="/signin">Back to sign in</Link>
          </p>
        </>
      ) : (
        <p role="status">Opening your workspace…</p>
      )}
    </AuthFrame>
  );
}
