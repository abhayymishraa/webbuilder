import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCollectionSkeleton({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div role="status">
      <span className="sr-only">Loading your projects…</span>
      <div
        aria-hidden="true"
        className={
          compact
            ? "ember-project-stack flex flex-col gap-3 [&_.ember-project-copy]:p-[17px] [&_h2]:text-[16px] [&_small]:mt-3"
            : "ember-project-grid grid grid-cols-3 gap-5.5 max-[1101px]:grid-cols-2 max-md:grid-cols-[1fr]"
        }
      >
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="ember-project-card border border-border rounded-[14px] overflow-hidden bg-card no-underline flex flex-col pointer-fine:hover:border-input focus-visible:outline-offset-1"
          >
            {!compact && <Skeleton className="h-40 rounded-none" />}
            <div className="ember-project-copy p-5.5 [&_h2]:flex [&_h2]:justify-between [&_h2]:gap-3 [&_h2]:text-[19px] [&_h2]:leading-[1.25] [&_h2]:tracking-[-0.5px] [&_h2]:font-medium [&_h2]:wrap-anywhere [&_p]:text-[12px] [&_p]:leading-[1.6] [&_p]:mt-3 [&_p]:text-muted-foreground [&_small]:block [&_small]:mt-5 [&_small]:text-accent-foreground [&_small]:text-[11px]">
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
