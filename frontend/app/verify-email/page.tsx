"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/api";
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
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (value) {
      setToken(value);
      window.history.replaceState(null, "", window.location.pathname);
    }
    setReady(true);
  }, []);
  const confirm = async () => {
    setBusy(true); setError("");
    try {
      const session = await authApi.confirmVerification(token);
      localStorage.setItem("auth_token", session.access_token);
      localStorage.removeItem("user_data");
      const user = await authApi.getCurrentUser();
      localStorage.setItem("user_data", JSON.stringify(user));
      router.replace("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not verify this link.");
      setToken(""); setBusy(false);
    }
  };
  return <AuthFrame title="Verify your email" description="One small step before your next idea.">
    {!ready ? <p role="status">Opening verification…</p> : token ? <div className="ember-form">
      <p>Confirm your email to finish setting up your account.</p>
      <button type="button" className="ember-button" disabled={busy} onClick={confirm}>{busy ? "Verifying…" : "Verify email"}</button>
    </div> : <form className="ember-form" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError(""); setMessage("");
      try { setMessage((await authApi.requestVerification(email)).message); }
      catch (err) { setError(err instanceof Error ? err.message : "Unable to send verification."); }
      finally { setBusy(false); }
    }}>
      <label htmlFor="verification-email">Account email<Input id="verification-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} /></label>
      <button type="submit" className="ember-button" disabled={busy}>{busy ? "Sending…" : "Send verification link"}</button>
    </form>}
    {message && <p role="status" className="ember-helper mt-4">{message}</p>}
    {error && <p role="alert" className="ember-error mt-4">{error}</p>}
    <p className="ember-auth-switch"><Link href="/signin">Back to sign in</Link></p>
  </AuthFrame>;
}
