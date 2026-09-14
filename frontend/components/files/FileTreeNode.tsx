"use client";

import { File, Folder } from "@/components/ui/file-tree";

import type { FileNode } from "@/types/file.type";
export function FileTreeNode({ node }: { node: FileNode }) {
    if (!node.isDirectory) return <File value={node.path} name={node.name} />;
    return (
        <Folder value={node.path} name={node.name}>
            {node.children?.map((child) => (
                <FileTreeNode key={child.path} node={child} />
            ))}
        </Folder>
    );
}
