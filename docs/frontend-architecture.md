# Frontend architecture: TryMatcha adaptation

## Source and findings

Reviewed the sibling repository at `../trymatcha`, commit `98c030584a1e1e383b58c567e7693e9982e1e04d`. Source files were read without modifying that repository.

| Source in TryMatcha | Pattern | WebBuilder decision |
| --- | --- | --- |
| `AGENTS.md`, `CLAUDE.md` | Feature components, feature hooks, shared domain types; consistent names | Record the same ownership in `frontend/AGENTS.md` |
| `apps/web/hooks/playground/useFetchOrganizations.ts` | A feature hook owns loading and fetching through a shared client | Use domain hooks backed by existing services; keep current request semantics |
| `apps/web/hooks/socket/useWebSocket.ts` | Socket lifecycle belongs outside page markup | Extract `hooks/chat/useChatConnection.ts`; retain reconnect/session guards |
| `apps/web/lib/session.ts` | Session operations centralized in `SessionServices` | Keep existing session functions and one refresh client; no class needed for stateless operations |
| `apps/server/src/controllers/project/controller.get_product_diff.ts` | Backend action/controller separation | Apply responsibility separation; do not copy Express-style controllers into React |
| `.prettierrc.json` | Four spaces, double quotes, semicolons, trailing commas, 100 columns, LF | Same frontend Prettier configuration, pinned to TryMatcha's installed 3.9.5 |
| `apps/web/eslint.config.mjs` | Next.js recommended lint configuration | Retain Next rules and add explicit boundary/size checks |

TryMatcha's documented static-class convention is primarily a backend convention; its React orchestration uses hooks. It also uses Zustand, React Query, Bun, and monorepo tooling. None is necessary to reorganize this existing frontend, so they were not added.

No enforced word-count or file-line limit was found in the source rules/configuration. WebBuilder now independently enforces **300 nonblank, noncomment TypeScript lines**, with **80 for route pages/layouts**. This measures authored code rather than words. CSS, generated output, documentation, dependencies, and license files are outside this rule.

## Structure

```text
frontend/
  app/                         Next routes, metadata, layouts, global CSS
  components/
    auth/                      Sign-in, registration, verification screens
    chat/                      New-project and running-workspace views
    files/                     File viewer, tree, file icon
    landing/                   Homepage and scoped illustrations
    layout/                    Brand, navigation, sidebar, theme
    profile/                   Profile screen and account controls
    projects/                  Collection, filters, delete dialog
    prototypes/profile/        Existing isolated design study
    ui/                        Shared control primitives
  hooks/<feature>/useName.ts    Behavior and lifecycle orchestration
  services/service.domain.ts   Typed HTTP operations
  types/domain.type.ts         Shared contracts
  lib/<concern>/               Session, HTTP, cache, reduction, filtering
  config/env.ts                Public API/WebSocket configuration
  socket/handleChatEvent.ts    Incoming socket event translation
```

```text
Next route → feature view → feature hook → domain service → HTTP client
                                  ↓                         ↓
                         socket/lifecycle helpers     session refresh
                                  ↓
                         shared domain types
```

A simple component does not need a hook or service. Extract behavior when it has a lifecycle or responsibility of its own. Prefer functions and cohesive objects over artificial inheritance. Client directives remain at real client boundaries; routes do not become client components merely because their child uses hooks.

## Generated E2B applications

`agent/prompts.py` embeds a compact adaptation in the generation system prompt. `run_editor` includes it on every run alongside the runtime skill catalog; no additional skill needs to be loaded for the structure rules.

Generated projects use the installed Vite/React JSX starter, not this Next.js frontend. The adaptation uses `.jsx` components, `.js` hooks/services/helpers, existing React Router routes, relative imports unless configured otherwise, and existing formatting. It preserves Tailwind v4 setup and adds no scaffold, state library, TypeScript conversion, or invented backend. New/substantially rewritten JS/JSX files have a 300-code-line instruction and `App.jsx` an 80-line instruction; older oversized files receive scoped extraction rather than a whole-project migration.

Available design skills remain selectable under the existing catalog rules. Structure does not impose Ember branding on generated apps. These generation limits are prompt instructions, not an E2B linter or a guarantee of model compliance. This prompt-only addition has not received a generation trial or new verification run.

## Migration map

| Previous owner | New owner |
| --- | --- |
| `api/auth.ts`, `api/chat.ts` | `services/service.auth.ts`, `services/service.projects.ts` |
| `api/client.ts`, `api/session.ts` | `lib/http/client.ts`, `lib/auth/session.ts` |
| `api/types.ts`, `lib/chat-types.ts` | Domain files in `types/` |
| Behavior embedded in `app/**/page.tsx` | `hooks/auth`, `hooks/chat`, `hooks/profile`, `hooks/projects` |
| Route markup | Matching `components/<feature>/*Page.tsx` |
| `components/ember/*` | Feature-owned `layout`, `auth`, `profile`, `landing` components |
| Chat's project collection and file viewer | `components/projects`, `components/files` |
| Workspace socket, layout, file polling | `useChatConnection`, `useWorkspaceLayout`, `useProjectFiles` |
| `lib/use-preview-lifecycle.ts` | `hooks/preview/usePreviewLifecycle.ts` plus preview service/types |
| Large inline tool results | `ToolResult`, `ToolList`, `RunStatus`, `CodeListing` |

The migration preserves endpoints, payloads, storage keys, refresh concurrency, cache keys, preview timeouts, conditional file polling, and route URLs. It adds no generation step and changes no backend contract. Existing prototype lint issues were corrected by subscribing to URL changes and initializing the sample deadline lazily rather than synchronously setting state in effects.

## Enforcement and validation

From `frontend/`:

```sh
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Verification commands require user approval under the root rules. No test suite or repository fixtures are introduced. ESLint enforces code/route line limits and rejects direct service/client imports in pages and view components. Human review still checks semantic ownership, relative-import bypasses, and behavior preservation.

Approved validation completed on September 14, 2026:

- Frontend lint, TypeScript, Prettier check, and optimized Next.js production build passed.
- Local production-server browser checks covered 1440×1000 desktop, 390×844 phone, 768×1024 tablet, and 844×390 landscape. The run inspected 55 route/theme/workspace states with no page exceptions or unexpected API requests.
- Exercised public routes, signed-out redirect, invalid verification text, recent-project ordering, search/sort, delete cancellation and completion, profile editing, both themes, tool-detail collapse, file selection, preview tabs, and iframe reload.
- The browser used isolated fake account/project/API/socket responses. All 57 API requests were handled locally; no generation requests were submitted. This does not establish live OAuth, generation, E2B, or storage correctness, or claim a measured performance gain.
- Graphify's code graph was updated without LLM calls. Its existing package/skill version warning and zero-node JSON metadata warnings remain; no graph-tool upgrade was made.

No tests or fixtures were added to the repository. The existing unrelated backend/template edits remain outside this refactor.
