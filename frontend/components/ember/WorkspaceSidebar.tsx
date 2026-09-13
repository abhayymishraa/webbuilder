import Link from "next/link";
import { BookOpen, FolderOpen, Plus, UserRound } from "lucide-react";

export function WorkspaceSidebar({
  current,
}: {
  current: "new" | "projects" | "builder" | "profile";
}) {
  return (
    <aside className="ember-workspace-sidebar">
      <Link href="/chat" className="ember-button">
        <Plus size={17} />
        New project
      </Link>
      <nav aria-label="Workspace navigation">
        <Link
          href="/projects"
          aria-current={current === "projects" ? "page" : undefined}
        >
          <FolderOpen size={17} />
          Projects
        </Link>
        <Link
          href="/chat"
          aria-current={current === "new" ? "page" : undefined}
        >
          <Plus size={17} />
          Write a brief
        </Link>
        <Link href="/profile" aria-current={current === "profile" ? "page" : undefined}><UserRound size={17} />Profile</Link>
        <Link href="/#how-it-works">
          <BookOpen size={17} />
          How it works
        </Link>
      </nav>
      <div>
        <p>Your ideas, your code.</p>
        <span>Make something worth opening.</span>
      </div>
    </aside>
  );
}
