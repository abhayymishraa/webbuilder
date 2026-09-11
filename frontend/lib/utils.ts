import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Determine WS_URL based on whether we're in browser and HTTPS
const getWsUrl = (): string => {
  const configUrl = process.env.NEXT_PUBLIC_WS_URL;

  // If explicitly set, use it
  if (configUrl) {
    return configUrl;
  }

  // If in browser, derive from current location
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}`;
  }

  // Default fallback
  return "ws://localhost:8000";
};

export const WS_URL: string = getWsUrl();
