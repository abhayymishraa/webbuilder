"use client";
import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";
import { SiGithub, SiGoogle } from "react-icons/si";
import { API_BASE_URL, authApi } from "@/api";
import type { AuthOptions } from "@/api/types";

export function SocialLogin({
  onOptions,
  registration = false,
}: {
  onOptions?: (options: AuthOptions) => void;
  registration?: boolean;
}) {
  const [options, setOptions] = useState<AuthOptions | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    authApi
      .options()
      .then((value) => {
        if (!disposed) {
          setOptions(value);
          onOptions?.(value);
        }
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
    };
  }, [onOptions]);

  let helperMessage = "Or continue with your email.";
  if (failed) {
    helperMessage = "Social sign-in is temporarily unavailable.";
  } else if (!options) {
    helperMessage = "Loading sign-in options…";
  } else if (!options.providers.google && !options.providers.github) {
    helperMessage =
      registration && !options.email_verification
        ? "New accounts are awaiting setup. Existing members can sign in."
        : "Social sign-in is awaiting setup. You can use email below.";
  }

  return (
    <div className="ember-social-login mt-6 [&>div]:grid [&>div]:grid-cols-[1fr_1fr] [&>div]:gap-3 [&_.ember-helper]:mt-3.5 [&_.ember-helper]:leading-[1.5]">
      <div>
        {(["google", "github"] as const).map((provider) => (
          <Button
            type="button"
            key={provider}
            variant="secondary"
            disabled={!options?.providers[provider]}
            onClick={() => {
              window.location.assign(
                new URL(
                  `${API_BASE_URL}/auth/oauth/${provider}`,
                  window.location.origin,
                ).href,
              );
            }}
          >
            {provider === "google" ? (
              <SiGoogle aria-hidden="true" />
            ) : (
              <SiGithub aria-hidden="true" />
            )}
            {provider === "google" ? "Google" : "GitHub"}
          </Button>
        ))}
      </div>
      <p className="ember-helper text-[12px] leading-[1.6] text-muted-foreground">
        {helperMessage}
      </p>
    </div>
  );
}
