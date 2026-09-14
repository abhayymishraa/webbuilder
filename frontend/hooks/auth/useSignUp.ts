"use client";

import { authService } from "@/services/service.auth";
import { type AuthOptions } from "@/types/auth.type";
import type React from "react";
import { useState } from "react";

export function useSignUp() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [options, setOptions] = useState<AuthOptions | null>(null);
    const [registered, setRegistered] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await authService.register({ name, email, password });
            setRegistered(true);
            setIsLoading(false);
        } catch (error: unknown) {
            console.error("Error signing up:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to sign up";

            // Handle specific error messages
            if (errorMessage.includes("Email already registered")) {
                setError("This email is already registered. Please sign in instead.");
            } else {
                setError(errorMessage);
            }

            setIsLoading(false);
        }
    };

    return {
        name,
        setName,
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        error,
        options,
        setOptions,
        registered,
        handleSubmit,
    };
}
