"use client";

import { useEffect, useState } from "react";
import { SiGithub, SiGoogle } from "react-icons/si";
import { API_BASE_URL, authApi } from "@/api";
import type { AuthOptions } from "@/api/types";

export function SocialLogin({ onOptions, registration = false }: { onOptions?: (options: AuthOptions) => void; registration?: boolean }) {
  const [options, setOptions] = useState<AuthOptions | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    authApi.options().then(value => { if (!disposed) { setOptions(value); onOptions?.(value); } }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, [onOptions]);

  let helperMessage = "Or continue with your email.";
  if (failed) {
    helperMessage = "Social sign-in is temporarily unavailable.";
  } else if (!options) {
    helperMessage = "Loading sign-in options…";
  } else if (!options.providers.google && !options.providers.github) {
    helperMessage = registration && !options.email_verification
      ? "New accounts are awaiting setup. Existing members can sign in."
      : "Social sign-in is awaiting setup. You can use email below.";
  }

  return <div className="ember-social-login">
    <div>
      {(["google", "github"] as const).map(provider => <button type="button" key={provider}
        className="ember-button ember-secondary" disabled={!options?.providers[provider]}
        onClick={() => { window.location.assign(new URL(`${API_BASE_URL}/auth/oauth/${provider}`, window.location.origin).href); }}>
        {provider === "google" ? <SiGoogle aria-hidden="true" /> : <SiGithub aria-hidden="true" />}
        {provider === "google" ? "Google" : "GitHub"}
      </button>)}
    </div>
    <p className="ember-helper">{helperMessage}</p>
  </div>;
}
