import type { CostAllowance } from "@/types/auth.type";

const money = (value: number) => `$${value.toFixed(3)}`;

export function UsageAllowance({ allowance }: { allowance?: CostAllowance | null }) {
    if (!allowance || allowance.unlimited) return null;

    return (
        <div className="mt-6 space-y-3 text-sm">
            <h3 className="font-medium">Build and preview allowance</h3>
            <dl className="space-y-3">
                {(["daily", "monthly"] as const).map((period) => {
                    const window = allowance[period];
                    return (
                        <div key={period}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <dt className="capitalize text-muted-foreground">{period}</dt>
                                <dd className="font-mono text-xs tabular-nums">
                                    {money(window.remaining_usd)} / {money(window.limit_usd)} left
                                </dd>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Resets {new Date(window.resets_at).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    timeZone: "UTC",
                                })} UTC
                            </p>
                        </div>
                    );
                })}
            </dl>
            <p className="text-xs leading-relaxed text-muted-foreground">
                Includes estimated usage and funds reserved for running work. Build credits still
                apply. This allowance is not a payment balance.
            </p>
        </div>
    );
}
