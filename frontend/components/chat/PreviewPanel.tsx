import {
  Eye,
  FileCode,
  Globe,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import type { PreviewPhase } from "@/lib/use-preview-lifecycle";
import { FileViewer } from "./FileViewer";

interface PreviewPanelProps {
  appUrl: string | null;
  previewWidth: number;
  files: string[];
  projectId: string;
  revisionId?: string | null;
  isBuilding?: boolean;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  phase: PreviewPhase;
  previewError: string | null;
  onRetry: () => void;
}
type TabType = "preview" | "files";

export function PreviewPanel({
  appUrl,
  previewWidth,
  files,
  projectId,
  revisionId,
  isBuilding,
  activeTab,
  onTabChange,
  phase,
  previewError,
  onRetry,
}: PreviewPanelProps) {
  const [viewport, setViewport] = useState("desktop");
  const [refresh, setRefresh] = useState(0);
  const preparing = Boolean(revisionId) && (phase === "checking" || phase === "opening");
  const building = isBuilding || phase === "building";

  let emptyTitle = "Your canvas is ready.";
  if (building) {
    emptyTitle = "Your app is building.";
  } else if (preparing) {
    emptyTitle = "Preparing your preview…";
  } else if (previewError) {
    emptyTitle = "Preview unavailable.";
  } else if (revisionId) {
    emptyTitle = "Your preview is sleeping.";
  }

  let emptyDescription = "The app preview will appear when your build makes it available.";
  if (building) {
    emptyDescription = "Follow the existing build in your conversation.";
  } else if (preparing) {
    emptyDescription = "Your saved project will appear here shortly.";
  } else if (revisionId) {
    emptyDescription = "Your saved files are available in Files.";
  }

  return (
    <section
      className="ember-preview"
      aria-label="App workspace"
      data-viewport={viewport}
      style={{ width: `${previewWidth}%` }}
    >
      <div className="ember-preview-toolbar">
        <div className="ember-row" role="group" aria-label="Preview views">
          <button
            className="ember-tab"
            aria-pressed={activeTab === "preview"}
            onClick={() => onTabChange("preview")}
          >
            <Globe size={14} />
            Preview
          </button>
          <button
            className="ember-tab"
            aria-pressed={activeTab === "files"}
            onClick={() => onTabChange("files")}
          >
            <FileCode size={14} />
            Files{files.length ? ` (${files.length})` : ""}
          </button>
        </div>
        <div className="ember-row">
          {activeTab === "preview" && (
            <>
              <button
                className="ember-icon"
                aria-label="Desktop preview"
                aria-pressed={viewport === "desktop"}
                onClick={() => setViewport("desktop")}
              >
                <Monitor size={15} />
              </button>
              <button
                className="ember-icon"
                aria-label="Tablet preview"
                aria-pressed={viewport === "tablet"}
                onClick={() => setViewport("tablet")}
              >
                <Tablet size={15} />
              </button>
              <button
                className="ember-icon"
                aria-label="Mobile preview"
                aria-pressed={viewport === "mobile"}
                onClick={() => setViewport("mobile")}
              >
                <Smartphone size={15} />
              </button>
              <button
                className="ember-icon"
                disabled={!appUrl || phase !== "active"}
                aria-label="Reload preview"
                onClick={() => setRefresh((value) => value + 1)}
              >
                <RotateCcw size={14} />
              </button>
            </>
          )}
          {appUrl && phase === "active" && (
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ember-icon"
              aria-label="Open preview in new tab"
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>
      </div>
      {activeTab === "preview" ? (
        <div className="ember-preview-stage">
          {appUrl && phase === "active" && !building ? (
            <iframe
              key={`${projectId}-${refresh}`}
              src={appUrl}
              title="App preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
          ) : (
            <div className="ember-empty">
              <Eye size={34} />
              <h2>{emptyTitle}</h2>
              <p role={preparing || building ? "status" : undefined}>
                {emptyDescription}
              </p>
              {revisionId && !preparing && !building && <button className="ember-button" onClick={onRetry}>
                {previewError ? "Retry" : "Resume preview"}
              </button>}
              {previewError && !building && <p role="alert">{previewError}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="ember-preview-files">
          <FileViewer key={projectId} files={files} projectId={projectId} revisionId={revisionId} />
        </div>
      )}
      <div className="ember-preview-caption">
        {activeTab === "preview"
          ? "Live app preview · Source available in Files"
          : "Saved source and assets · App databases need their own backups"}
      </div>
    </section>
  );
}
