"use client";

import { FileIcon } from "./FileIcon";

import { Tree } from "@/components/ui/file-tree";
import Editor from "@monaco-editor/react";
import { Download, FileCode, FolderArchive, Loader2 } from "lucide-react";

import { useFileViewer } from "@/hooks/files/useFileViewer";
import { buildFileTree, getLanguageFromPath } from "@/lib/files/tree";
import { FileTreeNode } from "./FileTreeNode";
interface FileViewerProps {
    files: string[];
    projectId: string;
    revisionId?: string | null;
}

export function FileViewer({ files, projectId, revisionId }: FileViewerProps) {
    const {
        selectedFile,
        setSelectedFile,
        fileContent,
        isLoadingFile,
        isDownloading,
        downloadError,
        binary,
        handleDownloadFile,
        handleDownloadAll,
    } = useFileViewer({ files, projectId, revisionId });
    const fileTree = buildFileTree(files);
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
            <div className="ember-file-tree w-47.5 min-w-30 max-w-[38%] shrink-0 max-md:w-[135px] border-r border-border overflow-y-auto bg-muted">
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

                {downloadError && (
                    <p role="alert" className="px-3 py-2 text-xs text-destructive">
                        {downloadError}
                    </p>
                )}
                <Tree
                    selectedId={selectedFile}
                    onSelectFile={setSelectedFile}
                    initialExpandedItems={fileTree
                        .filter((node) => node.isDirectory)
                        .map((node) => node.path)}
                >
                    {fileTree.map((node) => (
                        <FileTreeNode key={node.path} node={node} />
                    ))}
                </Tree>
            </div>

            {/* Editor Area */}
            <div className="ember-file-editor min-w-0 flex-1 flex flex-col">
                {selectedFile ? (
                    <>
                        {/* Editor Header */}
                        <div className="ember-file-header min-w-0 flex-wrap gap-2 flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
                            <div className="flex items-center gap-2">
                                <FileIcon filename={selectedFile} />
                                <span className="ember-file-path min-w-0 wrap-anywhere text-[11px] text-foreground font-mono">
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
                                <div className="p-6 text-sm text-muted-foreground">
                                    Binary or large file. Download to view the original.
                                </div>
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
