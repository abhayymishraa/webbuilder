import { buttonVariants } from "@/components/ui/button";
import { FolderOpen, Plus, UserRound } from "lucide-react";
import Link from "next/link";

export function WorkspaceSidebar({
    current,
}: {
    current: "new" | "projects" | "builder" | "profile";
}) {
    return (
        <aside className="ember-workspace-sidebar w-[205px] shrink-0 py-6 px-4.5 border-r border-r-border bg-sidebar flex flex-col gap-6.5 [&>.ember-button]:text-[12px] [&_nav]:flex [&_nav]:flex-col [&_nav]:gap-1.5 [&_nav_a]:flex [&_nav_a]:items-center [&_nav_a]:gap-2.5 [&_nav_a]:text-muted-foreground [&_nav_a]:py-3 [&_nav_a]:px-2.5 [&_nav_a]:rounded-[8px] [&_nav_a]:text-[12px] [&_nav_a[aria-current=page]]:bg-accent [&_nav_a[aria-current=page]]:text-accent-foreground [&>div]:mt-auto [&>div]:py-4 [&>div]:px-2 [&_p]:text-[12px] [&_p]:text-secondary-foreground [&_span]:block [&_span]:text-[10px] [&_span]:leading-[1.6] [&_span]:mt-2 [&_span]:text-muted-foreground max-[1101px]:w-[175px] max-[1101px]:px-3 max-md:hidden">
            <Link
                href="/chat"
                className={buttonVariants({ variant: "default" })}
                aria-current={current === "new" ? "page" : undefined}
            >
                <Plus size={17} />
                New project
            </Link>
            <nav aria-label="Workspace navigation">
                <Link href="/projects" aria-current={current === "projects" ? "page" : undefined}>
                    <FolderOpen size={17} />
                    Projects
                </Link>
                <Link href="/profile" aria-current={current === "profile" ? "page" : undefined}>
                    <UserRound size={17} />
                    Profile
                </Link>
            </nav>
            <div>
                <p>Your ideas, your code.</p>
                <span>Make something worth opening.</span>
            </div>
        </aside>
    );
}
