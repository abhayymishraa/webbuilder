import { authService } from "@/services/service.auth";
import type { AuthOptions } from "@/types/auth.type";
import { useEffect, useState } from "react";
export function useSocialLogin(registration: boolean, onOptions?: (options: AuthOptions) => void) {
    const [options, setOptions] = useState<AuthOptions | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let disposed = false;
        authService
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

    return { options, helperMessage };
}
