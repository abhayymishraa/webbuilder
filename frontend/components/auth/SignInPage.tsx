"use client";

import { AuthFrame } from "@/components/auth/AuthFrame";
import { SocialLogin } from "@/components/auth/SocialLogin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { useSignIn } from "@/hooks/auth/useSignIn";

export default function SignInPage() {
    const {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        error,
        checkingSession,
        handleSubmit,
    } = useSignIn();
    if (checkingSession) {
        return (
            <main className="ember-auth-page" aria-busy="true">
                <p
                    className="ember-helper text-[12px] leading-[1.6] text-muted-foreground p-6"
                    role="status"
                >
                    Checking your session…
                </p>
            </main>
        );
    }

    return (
        <AuthFrame>
            <SocialLogin />
            <form
                onSubmit={handleSubmit}
                className="ember-form flex flex-col gap-[21px] mt-7.5 [&_.ember-helper]:-mt-3"
                aria-busy={isLoading}
            >
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
                <label className="flex flex-col gap-[9px] text-[13px]" htmlFor="password">
                    Password
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={isLoading}
                        aria-describedby="password-hint"
                    />
                </label>
                <p
                    id="password-hint"
                    className="ember-helper text-[12px] leading-[1.6] text-muted-foreground"
                >
                    Use the password for your WebBuilder account.
                </p>
                {error && (
                    <p
                        className="ember-error text-destructive border border-destructive bg-card py-3 px-[15px] rounded-[8px] text-[13px] leading-[1.5]"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                <Button type="submit" disabled={isLoading} variant="default">
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Signing in…
                        </>
                    ) : (
                        "Sign in"
                    )}
                </Button>
            </form>
            <p className="ember-auth-switch text-[13px]! text-center mt-[25px]! [&_a]:text-accent-foreground [&_a]:underline [&_a]:underline-offset-[3px]">
                <Link href="/verify-email">Verify your email</Link>
            </p>
            <p className="ember-auth-switch text-[13px]! text-center mt-[25px]! [&_a]:text-accent-foreground [&_a]:underline [&_a]:underline-offset-[3px]">
                New to WebBuilder? <Link href="/signup">Create a workspace</Link>
            </p>
        </AuthFrame>
    );
}
