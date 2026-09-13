import { useEffect, useRef, useState } from "react";
import apiClient from "@/api/client";

type PreviewStatus = {
  state: "active" | "sleeping" | "opening" | "building";
  url: string | null;
  revision_id?: string;
};
export type PreviewPhase = PreviewStatus["state"] | "checking" | "error";

const STARTUP_TIMEOUT_MS = 200_000;
const STATUS_TIMEOUT_MS = 10_000;
const STARTUP_POLL_INTERVAL_MS = 3_000;
const ACTIVE_POLL_INTERVAL_MS = 60_000;

// Owned by the chat page, so panel toggles cannot reset the automatic attempt.
export function usePreviewLifecycle({ projectId, revisionId, enabled, isBuilding, onPreviewOpen }: {
  projectId: string;
  revisionId: string | null;
  enabled: boolean;
  isBuilding: boolean;
  onPreviewOpen: (url: string | null) => void;
}) {
  const [phase, setPhase] = useState<PreviewPhase>("checking");
  const [error, setError] = useState<string | null>(null);
  const entry = useRef({ attempted: false, waitingUntil: 0, failure: null as string | null });
  const controls = useRef({ enabled, isBuilding });
  const checkNow = useRef<(() => void) | null>(null);
  const retryNow = useRef<(() => void) | null>(null);
  const previousRevision = useRef<string | null>(null);

  useEffect(() => {
    const wasBuilding = controls.current.isBuilding;
    controls.current = { enabled, isBuilding };
    if (isBuilding || wasBuilding) {
      entry.current.attempted = true;
      entry.current.failure = null;
      entry.current.waitingUntil = 0;
      setError(null);
    }
    checkNow.current?.();
  }, [enabled, isBuilding]);

  useEffect(() => {
    if (!revisionId) return;
    if (previousRevision.current !== revisionId) {
      previousRevision.current = revisionId;
      entry.current.failure = null;
      entry.current.waitingUntil = 0;
    }
    let disposed = false;
    let checking = false;
    let active = false;
    let timer: ReturnType<typeof setTimeout>;
    const requests = new AbortController();
    const path = `/projects/${projectId}/preview`;
    const eligible = () => !disposed && controls.current.enabled && document.visibilityState === "visible";
    const fail = (message: string) => {
      entry.current.failure = message;
      entry.current.waitingUntil = 0;
      setError(message);
      setPhase("error");
      onPreviewOpen(null);
    };
    const observe = (status: PreviewStatus) => {
      if (status.state === "opening" || status.state === "building") {
        active = false;
        entry.current.attempted = true;
        entry.current.waitingUntil ||= Date.now() + STARTUP_TIMEOUT_MS;
        if (Date.now() >= entry.current.waitingUntil) {
          fail("The preview is taking longer than expected. Your saved files are available; try again later.");
          return;
        }
        setPhase(status.state);
        onPreviewOpen(null);
      } else if (status.state === "active" && status.url) {
        if (status.revision_id !== revisionId) {
          fail("The saved project changed while opening. Reopen the project to view its latest version.");
          return;
        }
        active = true;
        entry.current.attempted = true;
        entry.current.waitingUntil = 0;
        entry.current.failure = null;
        setError(null);
        setPhase("active");
        onPreviewOpen(status.url);
      } else {
        active = false;
        onPreviewOpen(null);
        if (entry.current.waitingUntil) {
          fail("Preview could not start. Your saved files are still available.");
        } else {
          setPhase("sleeping");
        }
      }
    };
    const status = async () => (await apiClient.get<PreviewStatus>(path, {
      signal: requests.signal, timeout: STATUS_TIMEOUT_MS,
    })).data;

    const check = async () => {
      if (checking || !eligible() || entry.current.failure) return;
      clearTimeout(timer);
      checking = true;
      try {
        if (controls.current.isBuilding) {
          observe({ state: "building", url: null });
          return;
        }
        const current = await status();
        // Recheck visibility and run state after awaiting the status response.
        if (!eligible() || controls.current.isBuilding) return;
        if (current.state !== "sleeping" || entry.current.attempted) {
          observe(current);
          return;
        }
        entry.current.attempted = true;
        entry.current.waitingUntil = Date.now() + STARTUP_TIMEOUT_MS;
        setPhase("opening");
        setError(null);
        onPreviewOpen(null);
        try {
          const { data } = await apiClient.post<{ url: string; revision_id: string }>(path, undefined, {
            signal: requests.signal, timeout: STARTUP_TIMEOUT_MS,
          });
          if (!disposed && !controls.current.isBuilding) observe({ ...data, state: "active" });
        } catch {
          if (disposed) return;
          // Another tab may own startup. Observe it; never loop startup POSTs.
          const current = await status();
          if (!disposed) observe(current);
        }
      } catch {
        if (!disposed && !active) fail("Preview is temporarily unavailable. Your saved files are still available. Please retry.");
        // A transient status failure should not discard a working preview.
      } finally {
        checking = false;
        if (!disposed && !entry.current.failure) {
          const delay = entry.current.waitingUntil ? STARTUP_POLL_INTERVAL_MS : ACTIVE_POLL_INTERVAL_MS;
          timer = setTimeout(() => { void check(); }, delay);
        }
      }
    };
    const wake = () => { void check(); };
    checkNow.current = wake;
    retryNow.current = () => {
      if (checking || !eligible() || controls.current.isBuilding) return;
      entry.current = { attempted: false, waitingUntil: 0, failure: null };
      setError(null);
      setPhase("checking");
      void check();
    };
    setError(entry.current.failure);
    setPhase(entry.current.failure ? "error" : "checking");
    // Deferred startup lets React's development setup/cleanup finish before I/O.
    timer = setTimeout(wake, 0);
    document.addEventListener("visibilitychange", wake);
    return () => {
      disposed = true;
      requests.abort(); // Server-side ownership remains tracked if startup continues.
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
      checkNow.current = null;
      retryNow.current = null;
    };
  }, [projectId, revisionId, onPreviewOpen]);

  return { phase, error, retry: () => retryNow.current?.() };
}
