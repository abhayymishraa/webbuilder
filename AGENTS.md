# Repository rules

## No test suites

- No tests in repo: Python, TypeScript, JavaScript, or other languages.
- Do not add, restore, or generate test files, fixtures, test-only dependencies, test scripts, or CI test jobs.
- Applies to bundled skills too. Excludes installed dependencies and external tool caches.
- Preserve runtime validation, build checks, preview checks, and deployment health checks.
- Run lint, typecheck, build, or manual browser checks only with explicit user approval. Never claim unrun checks passed.

## Frontend architecture

- Read `frontend/AGENTS.md` before changing frontend code. It defines the feature folders, request boundaries, naming, formatting, and enforced file limits.
- The structure is adapted from the sibling TryMatcha repository. Evidence and deliberate differences are recorded in `docs/frontend-architecture.md`.
- Keep frontend restructuring scoped to the frontend; do not transplant backend controller classes, change API contracts, or add state libraries solely to match a folder layout.
