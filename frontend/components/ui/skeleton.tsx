import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// shadcn/ui Skeleton pattern (MIT), using Ember colors and optional motion.
// https://ui.shadcn.com/docs/components/skeleton
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md bg-secondary motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}
