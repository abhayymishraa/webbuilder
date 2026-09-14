// API Response Types

export interface CostWindow {
    limit_usd: number;
    used_or_reserved_usd: number;
    remaining_usd: number;
    resets_at: string;
}

export interface CostAllowance {
    unlimited: boolean;
    currency: string;
    reset_timezone: string;
    daily: CostWindow;
    monthly: CostWindow;
}

export interface UserData {
    id: number;
    email: string;
    name: string;
    tokens_remaining: number;
    tokens_reset_at?: string | null;
    credits_unlimited?: boolean;
    bio?: string;
    email_verified?: boolean;
    created_at?: string;
    providers?: string[];
    cost_allowance?: CostAllowance | null;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface RegisterResponse {
    verification_required: boolean;
    message: string;
}

export interface AuthOptions {
    providers: { google: boolean; github: boolean };
    email_verification: boolean;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}
