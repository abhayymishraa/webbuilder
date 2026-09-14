import type { SavedFileContent } from "@/types/file.type";

// Memory only. Immutable revision keys allow reuse without serving old edits.
const files = new Map<string, SavedFileContent>();
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_FILES = 64;
let cachedBytes = 0;
const entrySizeBytes = (key: string, file: SavedFileContent) =>
    (key.length + (file.content?.length ?? 0)) * 2;

export function clearFileContentCache() {
    files.clear();
    cachedBytes = 0;
}

export function getCachedFile(key: string) {
    return files.get(key);
}

export function cacheFile(key: string, file: SavedFileContent) {
    const previous = files.get(key);
    if (previous) {
        cachedBytes -= entrySizeBytes(key, previous);
        files.delete(key);
    }
    const entryBytes = entrySizeBytes(key, file);
    if (entryBytes > MAX_BYTES) return;
    while (files.size >= MAX_FILES || cachedBytes + entryBytes > MAX_BYTES) {
        const [oldestKey, oldest] = files.entries().next().value!;
        cachedBytes -= entrySizeBytes(oldestKey, oldest);
        files.delete(oldestKey);
    }
    files.set(key, file);
    cachedBytes += entryBytes;
}
