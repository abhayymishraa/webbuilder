"use client";

// Interaction patterns adapted from Beautiful UI, MIT © 2026 Shane Levine.
// See ../ember/BEAUTIFUL-UI-LICENSE. All progress comes from recorded run events.
import { useEffect, useState } from "react";
import styles from "./transcript.module.css";

export function PixelLoader() {
    return (
        <span className={styles.pixels + " transcript-pixels"} aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
                <i key={i} style={{ animationDelay: `${i * 90}ms` }} />
            ))}
        </span>
    );
}

export function Elapsed({
    start,
    end,
    running,
}: {
    start: string;
    end?: string;
    running: boolean;
}) {
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => {
        if (!running) return;
        const tick = () => {
            if (!document.hidden) setNow(Date.now());
        };
        tick();
        const timer = setInterval(tick, 1000);
        document.addEventListener("visibilitychange", tick);
        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", tick);
        };
    }, [running]);
    const finish = end ? Date.parse(end) : running ? now : null;
    const seconds =
        finish === null ? NaN : Math.max(0, Math.floor((finish - Date.parse(start)) / 1000));
    if (!Number.isFinite(seconds)) return null;
    return (
        <span className="transcript-duration font-mono text-[11px] text-muted-foreground shrink-0 tabular-nums">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
        </span>
    );
}
