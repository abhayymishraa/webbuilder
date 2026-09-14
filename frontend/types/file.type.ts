export type SavedFileContent = { content: string | null; binary: boolean };

export interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
}
