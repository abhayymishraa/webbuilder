import { ChevronLeft, Eye, EyeOff, Plus } from "lucide-react";
import type { UserData } from "@/api";
import { Brand } from "@/components/ember/Brand";
import { ThemeToggle } from "@/components/ember/ThemeProvider";
import { ProjectsList } from "./ProjectsList";

interface ChatIdHeaderProps {
  userData: UserData | null;
  showPreview: boolean;
  onTogglePreview: () => void;
  onNewChat: () => void;
  onBack: () => void;
}

export function ChatIdHeader({
  userData,
  showPreview,
  onTogglePreview,
  onNewChat,
  onBack,
}: ChatIdHeaderProps) {
  return (
    <header className="ember-workspace-header">
      <div className="ember-row">
        <button
          className="ember-icon"
          onClick={onBack}
          aria-label="Back to projects"
        >
          <ChevronLeft size={21} />
        </button>
        <Brand />
      </div>
      <div className="ember-row">
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
        <ThemeToggle />
        <ProjectsList />
        <button
          className="ember-icon ember-preview-toggle"
          onClick={onTogglePreview}
          aria-label={showPreview ? "Hide preview" : "Show preview"}
          aria-pressed={showPreview}
        >
          {showPreview ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
        <button className="ember-button" onClick={onNewChat}>
          <Plus size={16} />
          <span className="ember-builder-new-label">New project</span>
          <span className="sr-only md:hidden">New project</span>
        </button>
      </div>
    </header>
  );
}
