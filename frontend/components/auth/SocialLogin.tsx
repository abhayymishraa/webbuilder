"use client";

import { useSocialLogin } from "@/hooks/auth/useSocialLogin";

import { Button } from "@/components/ui/button";

import { API_BASE_URL } from "@/config/env";
import type { AuthOptions } from "@/types/auth.type";
import { SiGithub, SiGoogle } from "react-icons/si";

export function SocialLogin({
    onOptions,
    registration = false,
}: {
    onOptions?: (options: AuthOptions) => void;
    registration?: boolean;
}) {
    const { options, helperMessage } = useSocialLogin(registration, onOptions);

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
