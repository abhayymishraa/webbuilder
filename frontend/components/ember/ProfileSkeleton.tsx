import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading your profile…</span>
      <div aria-hidden="true">
        <div className="ember-profile-card">
          <Skeleton className="mb-4 size-[58px] rounded-full" />
          <Skeleton className="h-7 w-48 max-w-full" />
          <Skeleton className="mt-3 h-4 w-64 max-w-full" />
          <Skeleton className="mt-3 h-4 w-56 max-w-full" />
          <Skeleton className="mt-6 h-4 w-40 max-w-full" />
        </div>
        <div className="ember-profile-settings">
          <section>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-6 h-4 w-16" />
            <Skeleton className="mt-2 h-11 w-full" />
            <Skeleton className="mt-5 h-4 w-24" />
            <Skeleton className="mt-2 h-24 w-full" />
            <Skeleton className="mt-5 h-11 w-32" />
          </section>
          <section>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <div className="mt-5 space-y-3">
              {[0, 1, 2].map((item) => <Skeleton key={item} className="h-16 w-full" />)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
