"use client";
import { Button, buttonVariants } from "@/components/ui/button";

import { useEffect, useState, type PointerEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  FolderOpen,
  PanelsTopLeft,
  Search,
} from "lucide-react";
import { chatApi } from "@/api/chat";
import type { Project } from "@/api/types";
import { ProjectCollectionSkeleton } from "./ProjectCollectionSkeleton";
import styles from "./project-spotlight.module.css";

// 21st's lightweight Spotlight Card pattern: update CSS variables, not React state.
// https://21st.dev/blog/react-spotlight-effect-components
function updateSpotlight(event: PointerEvent<HTMLDivElement>) {
  if (
    event.pointerType === "touch" ||
    document.documentElement.dataset.theme === "light" ||
    !window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    ).matches
  )
    return;

  const card =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>("[data-project-spotlight]")
      : null;
  if (!card) return;

  const bounds = card.getBoundingClientRect();
  card.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
  card.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
}

export function ProjectCollection({
  compact = false,
  onOpen,
}: {
  compact?: boolean;
  onOpen?: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    chatApi
      .listProjects()
      .then((response) => {
        if (!disposed) setProjects(response.projects);
      })
      .catch(() => {
        if (!disposed)
          setError("Could not load your projects. Please try again.");
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [attempt]);
  const visible = projects.filter((project) =>
    project.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div>
      <div className="ember-project-toolbar flex items-center justify-between gap-5 mb-[25px]">
        <label className="ember-search flex items-center gap-2.5 max-w-95 w-full border border-input rounded-[8px] py-2.5 px-3 [&_input]:w-full [&_input]:min-w-0 [&_input]:bg-transparent [&_input]:border-0 [&_input]:text-foreground [&_input]:outline-none [&_input]:text-[14px] focus-within:outline-2 focus-within:outline-solid focus-within:outline-ring focus-within:outline-offset-0.5">
          <Search size={16} />
          <input
            aria-label="Search projects"
            placeholder="Search your projects"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {!compact && (
          <span className="ember-project-count text-[12px] text-muted-foreground">
            {loading ? "Loading…" : `${projects.length} projects`}
          </span>
        )}
      </div>
      {loading ? (
        <ProjectCollectionSkeleton compact={compact} />
      ) : error ? (
        <div className="ember-empty py-17.5 px-[25px] flex flex-col items-center text-center gap-4 border border-dashed border-border rounded-[14px] text-muted-foreground [&_h2]:text-[22px] [&_h2]:text-foreground [&_p]:text-[14px] [&_p]:max-w-92.5">
          <p role="alert">{error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setError("");
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : !visible.length ? (
        <div className="ember-empty py-17.5 px-[25px] flex flex-col items-center text-center gap-4 border border-dashed border-border rounded-[14px] text-muted-foreground [&_h2]:text-[22px] [&_h2]:text-foreground [&_p]:text-[14px] [&_p]:max-w-92.5">
          <FolderOpen size={34} />
          <h2>
            {query ? "No matching projects." : "A blank canvas, just for you."}
          </h2>
          <p>
            {query
              ? "Try another project name."
              : "Start with an idea. Your projects will be waiting here."}
          </p>
          {query ? (
            <Button variant="secondary" onClick={() => setQuery("")}>
              Clear search
            </Button>
          ) : (
            <Link
              href="/chat"
              className={buttonVariants({ variant: "default" })}
              onClick={onOpen}
            >
              Start a project <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      ) : (
        <div
          className={
            compact
              ? "ember-project-stack flex flex-col gap-3 [&_.ember-project-copy]:p-[17px] [&_h2]:text-[16px] [&_small]:mt-3"
              : "ember-project-grid grid grid-cols-3 gap-5.5 max-[1101px]:grid-cols-2 max-md:grid-cols-[1fr]"
          }
          onPointerMove={updateSpotlight}
        >
          {visible.map((project) => (
            <Link
              href={`/chat/${project.id}`}
              onClick={onOpen}
              key={project.id}
              className={`ember-project-card border border-border rounded-[14px] overflow-hidden bg-card no-underline flex flex-col pointer-fine:hover:border-input focus-visible:outline-offset-1 ${styles.card} spotlight-card relative isolate`}
              data-project-spotlight=""
            >
                {!compact && (
                  <div className="ember-project-cover h-40 bg-secondary flex items-center justify-center text-accent-foreground">
                    <PanelsTopLeft size={55} strokeWidth={1} />
                  </div>
                )}
                <div className="ember-project-copy p-5.5 [&_h2]:flex [&_h2]:justify-between [&_h2]:gap-3 [&_h2]:text-[19px] [&_h2]:leading-[1.25] [&_h2]:tracking-[-0.5px] [&_h2]:font-medium [&_h2]:wrap-anywhere [&_p]:text-[12px] [&_p]:leading-[1.6] [&_p]:mt-3 [&_p]:text-muted-foreground [&_small]:block [&_small]:mt-5 [&_small]:text-accent-foreground [&_small]:text-[11px]">
                  <h2>
                    {project.title}
                    <ArrowUpRight size={16} className="shrink-0" />
                  </h2>
                  <p>
                    Created{" "}
                    {new Date(project.created_at).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </p>
                  <small>
                    {project.app_url
                      ? "Open workspace and preview"
                      : "Continue in workspace"}
                  </small>
                </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
