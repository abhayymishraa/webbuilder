import Link from "next/link";
import { FolderOpen, LogOut, Plus, UserRound } from "lucide-react";
import type { UserData } from "@/api";
import { Brand } from "@/components/ember/Brand";
import { ThemeToggle } from "@/components/ember/ThemeProvider";

interface ChatNavbarProps {
  isAuthenticated: boolean;
  userData: UserData | null;
  onSignOut: () => void;
}

export function ChatNavbar({
  isAuthenticated,
  userData,
  onSignOut,
}: ChatNavbarProps) {
  return (
    <header className="ember-workspace-header">
      <Brand />
      <div className="ember-row">
        <ThemeToggle />
        {isAuthenticated ? (
          <>
            <Link href="/projects" className="ember-text-link ember-projects-link" aria-label="Projects">
              <FolderOpen size={16} />
              <span>Projects</span>
            </Link>
            <Link href="/profile" className="ember-icon" aria-label="Your profile"><UserRound size={18} /></Link>
            <div className="ember-account">
              {userData && (
                <>
                  <span>{userData.email}</span>
                  <span className="ember-balance">
                    {userData.tokens_remaining} credits
                  </span>
                </>
              )}
            </div>
            <button
              className="ember-icon"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </>
        ) : (
          <>
            <Link href="/signin" className="ember-text-link">
              Sign in
            </Link>
            <Link href="/signup" className="ember-button">
              <Plus size={16} />
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
