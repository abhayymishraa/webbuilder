"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

export function CreditReset({ resetAt, onReset }: { resetAt: string; onReset: () => void }) {
    const deadline = Date.parse(resetAt);
    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!Number.isFinite(deadline)) return;
        let completed = false;
        function tick() {
            const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setRemaining(seconds);
            if (seconds === 0 && !completed) {
                completed = true;
                window.clearInterval(timer);
                onReset();
            }
        }
        const timer = window.setInterval(tick, 1000);
        tick();
        // Recalculate from the deadline after a background tab resumes.
        document.addEventListener("visibilitychange", tick);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", tick);
        };
    }, [deadline, onReset]);

    if (!Number.isFinite(deadline)) return null;
    const seconds = remaining ?? 0;
    const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor(seconds / 60) % 60).padStart(2, "0");
    const rest = String(seconds % 60).padStart(2, "0");
    return (
        <span className="ember-credit-reset tabular-nums [&_svg]:shrink-0">
            <Clock3 size={14} aria-hidden="true" />
            <time
                dateTime={resetAt}
                title={`Reset available ${new Date(deadline).toLocaleString()}`}
            >
                {remaining === null
                    ? "Loading reset time…"
                    : remaining === 0
                      ? "Reset available"
                      : `Resets in ${hours}h ${minutes}m ${rest}s`}
            </time>
        </span>
    );
}
