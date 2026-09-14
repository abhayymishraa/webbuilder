import { FileCode } from "lucide-react";

export function FileIcon({ filename }: { filename: string }) {
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

    return <FileCode className={`w-4 h-4 ${colorMap[ext || ""] || "text-muted-foreground"}`} />;
}
