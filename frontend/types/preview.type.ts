export type PreviewStatus = {
    state: "active" | "sleeping" | "opening" | "building";
    url: string | null;
    revision_id?: string;
};
export type PreviewPhase = PreviewStatus["state"] | "checking" | "error";
