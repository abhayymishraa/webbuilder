"use client";

import { useEffect, useState } from "react";
import { SiGithub, SiGoogle } from "react-icons/si";
import { authApi } from "@/api";
import type { AuthOptions } from "@/api/types";

export function SocialLogin({ onOptions, registration = false }: { onOptions?: (options: AuthOptions) => void; registration?: boolean }) {
  const [options, setOptions] = useState<AuthOptions | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    authApi.options().then(value => { if (!disposed) { setOptions(value); onOptions?.(value); } }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, [onOptions]);
  return <div className="ember-social-login">
    <div>
      {(["google", "github"] as const).map(provider => <button type="button" key={provider}
        className="ember-button ember-secondary" disabled={!options?.providers[provider]}
        onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/oauth/${provider}`; }}>
        {provider === "google" ? <SiGoogle aria-hidden="true" /> : <SiGithub aria-hidden="true" />}
        {provider === "google" ? "Google" : "GitHub"}
      </button>)}
    </div>
    <p className="ember-helper">{failed ? "Social sign-in is temporarily unavailable." : !options ? "Loading sign-in options…" : !options.providers.google && !options.providers.github ? registration && !options.email_verification ? "New accounts are awaiting setup. Existing members can sign in." : "Social sign-in is awaiting setup. You can use email below." : "Or continue with your email."}</p>
  </div>;
}
