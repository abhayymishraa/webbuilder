"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import {
  FileCode,
  Download,
  Loader2,
  FolderArchive,
} from "lucide-react";
import apiClient from "@/api/client";
import { toast } from "sonner";
import { File, Folder, Tree } from "@/components/ui/file-tree";

interface FileViewerProps {
  files: string[];
  projectId: string;
  revisionId?: string | null;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

function buildFileTree(files: string[]): FileNode[] {
  const root: FileNode[] = [];

  files.forEach((filePath) => {
    const parts = filePath.split("/");
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath += (index === 0 ? "" : "/") + part;
      const isLastPart = index === parts.length - 1;

      let existingNode = currentLevel.find((node) => node.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          isDirectory: !isLastPart,
          children: !isLastPart ? [] : undefined,
        };
        currentLevel.push(existingNode);
      }

      if (!isLastPart && existingNode.children) {
        currentLevel = existingNode.children;
      }
    });
  });

  return root;
}

function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    py: "python",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    sh: "shell",
  };

  return languageMap[ext || ""] || "plaintext";
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  const colorMap: Record<string, string> = {
    tsx: "text-accent-foreground",
    ts: "text-accent-foreground",
    jsx: "text-cyan-400",
    js: "text-yellow-400",
    css: "text-pink-400",
    json: "text-green-400",
    html: "text-orange-400",
    md: "text-gray-400",
    py: "text-blue-300",
  };

  return (
    <FileCode
      className={`w-4 h-4 ${colorMap[ext || ""] || "text-muted-foreground"}`}
    />
  );
}

function FileTreeNode({ node }: { node: FileNode }) {
  if (!node.isDirectory) return <File value={node.path} name={node.name} />;
  return <Folder value={node.path} name={node.name}>
    {node.children?.map(child => <FileTreeNode key={child.path} node={child} />)}
  </Folder>;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function FileViewer({ files, projectId, revisionId }: FileViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const fileTree = buildFileTree(files);
  const [binary, setBinary] = useState(false);
  const requestNumber = useRef(0);
  const revisionQuery = revisionId ? `revision_id=${encodeURIComponent(revisionId)}` : "";

  useEffect(() => {
    const request = ++requestNumber.current;
    if (!selectedFile) return;
    setIsLoadingFile(true);
    setBinary(false);
    apiClient.get<{ content: string | null; binary: boolean }>(
      `/projects/${projectId}/files/${encodeURIComponent(selectedFile)}?${revisionQuery}`,
    ).then(({ data }) => {
      if (request !== requestNumber.current) return;
      setBinary(data.binary);
      setFileContent(data.content ?? "");
    }).catch(() => {
      if (request === requestNumber.current) setFileContent("Saved file could not be loaded. Try again.");
    }).finally(() => {
      if (request === requestNumber.current) setIsLoadingFile(false);
    });
    return () => { requestNumber.current += 1; };
  }, [projectId, selectedFile, revisionQuery]);

  const handleDownloadFile = async () => {
    if (!selectedFile) return;
    setDownloadError("");
    try {
      const { data: blob } = await apiClient.get<Blob>(
        `/projects/${projectId}/files/${encodeURIComponent(selectedFile)}?raw=true&${revisionQuery}`,
        { responseType: "blob" },
      );
      downloadBlob(blob, selectedFile.split("/").pop() || "file.txt");
      toast.success("File download started", { description: selectedFile, id: `download-${projectId}` });
    } catch {
      setDownloadError("Could not download this file. Please try again.");
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    setDownloadError("");
    try {
      const response = await apiClient.get<Blob>(
        `/projects/${projectId}/download?${revisionQuery}`,
        {
          responseType: "blob",
        },
      );

      downloadBlob(response.data, `${projectId}-files.zip`);
      toast.success("Project ZIP download started", { id: `download-${projectId}` });
    } catch {
      setDownloadError("Could not download the project ZIP. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Auto-select first file
  useEffect(() => {
    if (!files.length) { setSelectedFile(null); return; }
    if (!selectedFile || !files.includes(selectedFile)) {
      const firstFile =
        files.find((f) => !f.includes("/") || f.split("/").length === 1) ||
        files[0];
      setSelectedFile(firstFile);
    }
  }, [files, selectedFile]);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <FileCode className="w-12 h-12 mb-4" />
        <p className="text-sm">No files available yet</p>
        <p className="text-xs mt-1">Files will appear once your app is built</p>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* File Tree Sidebar */}
      <div className="ember-file-tree border-r border-border overflow-y-auto bg-muted">
        <div className="sticky top-0 bg-card backdrop-blur-sm border-b border-border p-3 z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-foreground font-semibold text-sm">Files</h3>
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-accent hover:bg-accent text-accent-foreground rounded transition-colors disabled:opacity-50"
              title="Download all files as ZIP"
            >
              {isDownloading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <FolderArchive className="w-3 h-3" />
              )}
              ZIP
            </button>
          </div>
          <p className="text-muted-foreground text-xs">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </p>
        </div>

        {downloadError && <p role="alert" className="px-3 py-2 text-xs text-destructive">{downloadError}</p>}
        <Tree selectedId={selectedFile} onSelectFile={setSelectedFile}
          initialExpandedItems={fileTree.filter(node => node.isDirectory).map(node => node.path)}>
          {fileTree.map(node => <FileTreeNode key={node.path} node={node} />)}
        </Tree>
      </div>

      {/* Editor Area */}
      <div className="ember-file-editor flex-1 flex flex-col">
        {selectedFile ? (
          <>
            {/* Editor Header */}
            <div className="ember-file-header flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
              <div className="flex items-center gap-2">
                {getFileIcon(selectedFile)}
                <span className="ember-file-path text-foreground font-mono">
                  {selectedFile}
                </span>
              </div>
              <button
                onClick={handleDownloadFile}
                className="flex items-center gap-2 px-3 py-1 text-xs bg-secondary hover:bg-accent text-secondary-foreground hover:text-foreground rounded transition-colors"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 relative">
              {isLoadingFile ? (
                <div className="absolute inset-0 flex items-center justify-center bg-card">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : binary ? (
                <div className="p-6 text-sm text-muted-foreground">Binary or large file. Download to view the original.</div>
              ) : (
                <Editor
                  height="100%"
                  language={getLanguageFromPath(selectedFile)}
                  value={fileContent}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: "on",
                    padding: { top: 16, bottom: 16 },
                  }}
                  loading={
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  }
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Select a file to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
