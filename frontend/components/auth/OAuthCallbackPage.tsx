"use client";

import { AuthFrame } from "@/components/auth/AuthFrame";
import Link from "next/link";

import { useOAuthCallback } from "@/hooks/auth/useOAuthCallback";

export default function OAuthCallbackPage() {
    const { error } = useOAuthCallback();
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
