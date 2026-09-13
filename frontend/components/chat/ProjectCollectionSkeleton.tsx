import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCollectionSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div role="status">
      <span className="sr-only">Loading your projects…</span>
      <div aria-hidden="true" className={compact ? "ember-project-stack" : "ember-project-grid"}>
        {[0, 1, 2].map((item) => (
          <div key={item} className="ember-project-card">
            {!compact && <Skeleton className="h-40 rounded-none" />}
            <div className="ember-project-copy">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <Skeleton className="mt-5 h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
