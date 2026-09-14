import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading your profile…</span>
      <div aria-hidden="true">
        <div className="ember-profile-card relative isolate overflow-hidden border border-border rounded-[18px] bg-card p-8.5 min-h-72.5 max-md:p-6 max-md:min-h-72.5">
          <Skeleton className="mb-4 size-[58px] rounded-full" />
          <Skeleton className="h-7 w-48 max-w-full" />
          <Skeleton className="mt-3 h-4 w-64 max-w-full" />
          <Skeleton className="mt-3 h-4 w-56 max-w-full" />
          <Skeleton className="mt-6 h-4 w-40 max-w-full" />
        </div>
        <div className="ember-profile-settings [&_section>p]:text-[14px] [&_section>p]:leading-[1.6] [&_section>p]:text-muted-foreground grid grid-cols-[1fr_1fr] gap-[clamp(24px,_5vw,_64px)] mt-9 [&_section]:min-w-0 [&_h2]:text-[17px] [&_h2]:font-medium [&_h2]:mb-1.5 [&_.ember-form]:mt-5.5 [&_.ember-form]:gap-4.5 [&_textarea]:resize-y [&_textarea]:min-h-24 [&_textarea]:max-h-55 [&_textarea]:p-3 [&_textarea]:bg-card [&_textarea]:border [&_textarea]:border-input [&_textarea]:rounded-[8px] [&_textarea]:text-[16px] [&_.ember-form_button]:self-start max-md:grid-cols-[1fr] max-md:gap-8">
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
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-16 w-full" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
