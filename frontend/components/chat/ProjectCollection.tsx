"use client";

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
    !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches
  ) return;

  const card = event.target instanceof Element
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
    setLoading(true);
    setError("");
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
      <div className="ember-project-toolbar">
        <label className="ember-search">
          <Search size={16} />
          <input
            aria-label="Search projects"
            placeholder="Search your projects"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {!compact && (
          <span className="ember-project-count">
            {loading ? "Loading…" : `${projects.length} projects`}
          </span>
        )}
      </div>
      {loading ? (
        <ProjectCollectionSkeleton compact={compact} />
      ) : error ? (
        <div className="ember-empty">
          <p role="alert">{error}</p>
          <button
            className="ember-button ember-secondary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : !visible.length ? (
        <div className="ember-empty">
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
            <button
              className="ember-button ember-secondary"
              onClick={() => setQuery("")}
            >
              Clear search
            </button>
          ) : (
            <Link href="/chat" className="ember-button" onClick={onOpen}>
              Start a project <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      ) : (
        <div
          className={compact ? "ember-project-stack" : "ember-project-grid"}
          onPointerMove={updateSpotlight}
        >
          {visible.map((project) => (
            <Link
              href={`/chat/${project.id}`}
              key={project.id}
              className={`ember-project-card ${styles.card}`}
              data-project-spotlight=""
              onClick={onOpen}
            >
              {!compact && (
                <div className="ember-project-cover">
                  <PanelsTopLeft size={55} strokeWidth={1} />
                </div>
              )}
              <div className="ember-project-copy">
                <h2>
                  {project.title}
                  <ArrowUpRight size={16} className="shrink-0" />
                </h2>
                <p>
                  Created{" "}
                  {new Date(project.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
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
