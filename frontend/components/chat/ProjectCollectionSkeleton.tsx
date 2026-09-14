import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCollectionSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div role="status">
      <span className="sr-only">Loading your projects…</span>
      <div aria-hidden="true" className={compact ? "flex flex-col gap-3" : "grid grid-cols-1 gap-9 md:grid-cols-2"}>
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className={`border border-border bg-card ${compact ? "rounded-xl p-4" : "min-h-72 rounded-[24px] p-6 sm:p-8"}`}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className={`${compact ? "mt-4 h-5" : "mt-12 h-8"} w-3/4`} />
            {!compact && <Skeleton className="mt-3 h-8 w-1/2" />}
            <Skeleton className={`${compact ? "mt-3" : "mt-10"} h-4 w-32`} />
          </div>
        ))}
      </div>
    </div>
  );
}
