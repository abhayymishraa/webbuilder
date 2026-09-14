"use client";
import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/api";
import { saveSession } from "@/api/session";
import { AuthFrame } from "@/components/ember/AuthFrame";
import { Input } from "@/components/ui/input";

export default function VerifyEmailPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    if (value) {
      setToken(value);
      window.history.replaceState(null, "", window.location.pathname);
    }
    setReady(true);
  }, []);
  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const session = await authApi.confirmVerification(token);
      saveSession(session);
      const user = await authApi.getCurrentUser();
      localStorage.setItem("user_data", JSON.stringify(user));
      router.replace("/profile");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We could not verify this link.",
      );
      setToken("");
      setBusy(false);
    }
  };
  return (
    <AuthFrame
      title="Verify your email"
      description="One small step before your next idea."
    >
      {!ready ? (
        <p role="status">Opening verification…</p>
      ) : token ? (
        <div className="ember-form flex flex-col gap-[21px] mt-7.5 [&_.ember-helper]:-mt-3">
          <p>Confirm your email to finish setting up your account.</p>
          <Button
            type="button"
            variant="default"
            disabled={busy}
            onClick={confirm}
          >
            {busy ? "Verifying…" : "Verify email"}
          </Button>
        </div>
      ) : (
        <form
          className="ember-form flex flex-col gap-[21px] mt-7.5 [&_.ember-helper]:-mt-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            setMessage("");
            try {
              setMessage((await authApi.requestVerification(email)).message);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Unable to send verification.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label
            className="flex flex-col gap-[9px] text-[13px]"
            htmlFor="verification-email"
          >
            Account email
            <Input
              id="verification-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={busy}
            />
          </label>
          <Button type="submit" variant="default" disabled={busy}>
            {busy ? "Sending…" : "Send verification link"}
          </Button>
        </form>
      )}
      {message && (
        <p
          role="status"
          className="ember-helper text-[12px] leading-[1.6] text-muted-foreground mt-4"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="ember-error text-destructive border border-destructive bg-card py-3 px-[15px] rounded-[8px] text-[13px] leading-[1.5] mt-4"
        >
          {error}
        </p>
      )}
      <p className="ember-auth-switch text-[13px]! text-center mt-[25px]! [&_a]:text-accent-foreground [&_a]:underline [&_a]:underline-offset-[3px]">
        <Link href="/signin">Back to sign in</Link>
      </p>
    </AuthFrame>
  );
}
