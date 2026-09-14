import { test } from "node:test";
import assert from "node:assert/strict";
import { filterProjects } from "../lib/project-filters.ts";
import type { Project } from "../api/types.ts";

const now = Date.parse("2026-09-14T12:00:00Z");
const day = 86_400_000;
function project(id: string, title: string, age: number): Project {
  return { id, title, user_id: 1, app_url: null, created_at: new Date(now - age * day).toISOString() };
}
const projects = [project("b", "Notes 10", 30), project("a", "Notes 2", 7), project("c", "Garden", 1)];
const ids = (items: Project[]) => items.map((item) => item.id);

test("search and period combine, trim whitespace and preserve the source order", () => {
  const original = structuredClone(projects);
  assert.deepEqual(ids(filterProjects(projects, "  NOTES  ", "newest", "7", now)), ["a"]);
  assert.deepEqual(ids(filterProjects(projects, "   ", "newest", "all", now)), ["c", "a", "b"]);
  assert.deepEqual(projects, original);
});

test("rolling date windows include the exact boundary, excluding older and future timestamps", () => {
  const list = [project("inside", "One", 7), project("outside", "Two", 7 + 1 / day), project("future", "Three", -1)];
  assert.deepEqual(ids(filterProjects(list, "", "newest", "7", now)), ["inside"]);
  assert.deepEqual(ids(filterProjects(projects, "", "newest", "30", now)), ["c", "a", "b"]);
});

test("date and natural title sorting work in both directions", () => {
  assert.deepEqual(ids(filterProjects(projects, "", "oldest", "all", now)), ["b", "a", "c"]);
  assert.deepEqual(ids(filterProjects(projects, "", "name-asc", "all", now)), ["c", "a", "b"]);
  assert.deepEqual(ids(filterProjects(projects, "", "name-desc", "all", now)), ["b", "a", "c"]);
});

test("ties are deterministic and unknown dates follow known dates", () => {
  const list = [project("b", "Same", 1), project("a", "same", 1), { ...project("x", "Unknown", 1), created_at: "invalid" }];
  for (const sort of ["newest", "oldest", "name-asc"] as const) {
    assert.deepEqual(ids(filterProjects(list, "", sort, "all", now)), ["a", "b", "x"]);
  }
  assert.deepEqual(ids(filterProjects(list, "", "oldest", "7", now)), ["a", "b"]);
  assert.deepEqual(filterProjects(list, "missing", "newest", "all", now), []);
});
