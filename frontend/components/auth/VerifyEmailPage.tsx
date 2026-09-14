"use client";

import { Button } from "@/components/ui/button";

import { AuthFrame } from "@/components/auth/AuthFrame";
import { Input } from "@/components/ui/input";
import Link from "next/link";

import { useEmailVerification } from "@/hooks/auth/useEmailVerification";

export default function VerifyEmailPage() {
    const { token, email, setEmail, ready, busy, message, error, confirm, requestVerification } =
        useEmailVerification();
    return (
        <AuthFrame title="Verify your email" description="One small step before your next idea.">
            {!ready ? (
                <p role="status">Opening verification…</p>
            ) : token ? (
                <div className="ember-form flex flex-col gap-[21px] mt-7.5 [&_.ember-helper]:-mt-3">
                    <p>Confirm your email to finish setting up your account.</p>
                    <Button type="button" variant="default" disabled={busy} onClick={confirm}>
                        {busy ? "Verifying…" : "Verify email"}
                    </Button>
                </div>
            ) : (
                <form
                    className="ember-form flex flex-col gap-[21px] mt-7.5 [&_.ember-helper]:-mt-3"
                    onSubmit={requestVerification}
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
