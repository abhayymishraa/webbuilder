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
import { useEffect, useRef, useState } from "react";
import { FileViewer } from "./FileViewer";
import apiClient from "@/api/client";

interface PreviewPanelProps {
  appUrl: string | null;
  previewWidth: number;
  files: string[];
  projectId: string;
  revisionId?: string | null;
  isBuilding?: boolean;
  onPreviewOpen?: (url: string | null) => void;
}
type TabType = "preview" | "files";

export function PreviewPanel({
  appUrl,
  previewWidth,
  files,
  projectId,
  revisionId,
  isBuilding,
  onPreviewOpen,
}: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [viewport, setViewport] = useState("desktop");
  const [refresh, setRefresh] = useState(0);
  const [opening, setOpening] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewRequest = useRef(0);
  useEffect(() => {
    previewRequest.current += 1;
    setOpening(false);
    setPreviewError(null);
    return () => { previewRequest.current += 1; };
  }, [projectId]);
  useEffect(() => {
    if (!appUrl || isBuilding) return;
    let disposed = false;
    const check = async () => {
      try {
        const { data } = await apiClient.get<{ state: string }>(`/projects/${projectId}/preview`);
        if (!disposed && data.state === "sleeping") onPreviewOpen?.(null);
      } catch { /* A transient status failure does not discard a visible preview. */ }
    };
    void check();
    const timer = setInterval(() => { void check(); }, 60000);
    return () => { disposed = true; clearInterval(timer); };
  }, [appUrl, projectId, isBuilding, onPreviewOpen]);
  const openPreview = async () => {
    if (opening || isBuilding) return;
    setOpening(true);
    setPreviewError(null);
    const request = ++previewRequest.current;
    try {
      const { data } = await apiClient.post<{ url: string }>(`/projects/${projectId}/preview`, undefined, { timeout: 200000 });
      if (request !== previewRequest.current) return;
      onPreviewOpen?.(data.url);
      setRefresh(value => value + 1);
    } catch {
      if (request === previewRequest.current) setPreviewError("Preview could not start. Your saved files are still available.");
    } finally { if (request === previewRequest.current) setOpening(false); }
  };
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
              <h2>{revisionId ? "Your preview is sleeping." : "Your canvas is ready."}</h2>
              <p>
                {revisionId ? "Your files are saved. Open a temporary preview to continue exploring." : "The app preview will appear when your build makes it available."}
              </p>
              {revisionId && <button className="ember-button" disabled={opening || isBuilding} onClick={openPreview}>
                {opening ? "Opening preview…" : "Open preview"}
              </button>}
              {revisionId && <small>Starts sandbox compute. No AI request or generation credit.</small>}
              {previewError && <p role="alert">{previewError}</p>}
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
