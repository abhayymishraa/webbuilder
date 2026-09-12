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
import { FileViewer } from "./FileViewer";

interface PreviewPanelProps {
  appUrl: string | null;
  previewWidth: number;
  files: string[];
  projectId: string;
}
type TabType = "preview" | "files";

export function PreviewPanel({
  appUrl,
  previewWidth,
  files,
  projectId,
}: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [viewport, setViewport] = useState("desktop");
  const [refresh, setRefresh] = useState(0);
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
            onClick={() => setActiveTab("preview")}
          >
            <Globe size={14} />
            Preview
          </button>
          <button
            className="ember-tab"
            aria-pressed={activeTab === "files"}
            onClick={() => setActiveTab("files")}
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
                disabled={!appUrl}
                aria-label="Reload preview"
                onClick={() => setRefresh((value) => value + 1)}
              >
                <RotateCcw size={14} />
              </button>
            </>
          )}
          {appUrl && (
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
          {appUrl ? (
            <iframe
              key={`${projectId}-${refresh}`}
              src={appUrl}
              title="App preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
          ) : (
            <div className="ember-empty">
              <Eye size={34} />
              <h2>Your canvas is ready.</h2>
              <p>
                The app preview will appear when your build makes it available.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="ember-preview-files">
          <FileViewer key={projectId} files={files} projectId={projectId} />
        </div>
      )}
      <div className="ember-preview-caption">
        {activeTab === "preview"
          ? "Live app preview · Source available in Files"
          : "Read your source or download the project ZIP"}
      </div>
    </section>
  );
}
