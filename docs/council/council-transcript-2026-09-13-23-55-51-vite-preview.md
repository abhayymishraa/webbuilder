# Council: Reliable Vite previews

Date: 2026-09-13-23-55-51 (local Asia/Kolkata)

## Method

Five sequentially simulated advisor perspectives and five sequentially simulated anonymous comparative reviews, produced by the main agent under the project rule requiring subagent work to run sequentially in the main thread. No independent agents or models were run; anonymity limits naming cues, not shared-context bias. This is structured reasoning, not empirical validation.

## Original question

Keep Vite's dev server. Research Context7 documentation and established open-source app builders, then use the LLM Council to decide the smallest reliable fix for our stale E2B preview. Research and recommendation only.

## Framed question

Decide how WebBuilder should keep its existing Vite dev preview consistent with saved source after AI edits, project restoration, and sandbox resume. Do not replace the dev server with static production hosting. Balance correctness, implementation size, latency, sandbox costs, and recoverability.
Observed evidence from the immediately preceding investigation: run cc4843a8-5bc1-4419-8310-4be6fa0b439d completed; its saved archive contains the Mara portfolio and App.jsx imports Home correctly. A direct sandbox comparison found disk Home.jsx contains the portfolio while the HTTP-transformed Home.jsx contains 'Ready to build'; Playwright also displayed that starter. A later saved revision still contains the portfolio. The precise missed-watcher/cache trigger is unproven.
Current code builds with npm run build and then checks the independently running dev server on port 5173. The browser checker accepts a nonempty root with no uncaught errors. Source restoration deletes/recreates project entries except node_modules, then runs npm ci while the template-owned dev server remains running. Model tools prohibit duplicate dev starts. One API worker serializes project operations; source archives and latest-saved/latest-verified pointers already exist. Preview recovery must not replay an LLM generation.
Documentation: Vite offers restart(forceOptimize?) and reloadModule; a full-reload browser message alone does not invalidate source caches. Polling is available but has CPU overhead, and the documented WSL case does not establish an E2B diagnosis. Vite 8.3.0 restartServer logs and returns if replacement-server creation fails, requiring independent readiness/content checks. E2B start/ready configuration supplies startup mechanics, not source correctness.
Comparators inspected at pinned SHAs: E2B Fragments uses a prestarted Next.js dev server; Bolt.diy tracks runtime start/port events and separates builds; Dyad manages child processes and documents restart separately from refresh. These are implementation references, not evidence that any exact patch fixes our Vite 8.3.0 sandbox.
Evaluate normal HMR plus polling, targeted explicit invalidation, a host-owned completion/restore restart, and conditional stale-detection recovery. Consider old templates, process ownership, timeout/cancellation, stale UI events, public control-surface risks, and visible app state. Do not assume a broad migration, a new model call, or a new sandbox is necessary.

## Evidence boundaries

The preceding authorized diagnostic established stale HTTP output versus saved source. This council performed documentation/source research only: no new E2B operation, model generation, restart, app-code modification, regression test, or deployment. Precise watcher failure remains a hypothesis. Historical lifecycle memory was checked against the current service implementation.

## Advisor: Contrarian

A restart recommendation can simply move the false-success bug. If the controller marks a revision ready because a restart command returns, the app can still serve the old process, wrong directory, or a replacement that failed to initialize. Vite 8.3.0 provides a concrete example: one restart failure path logs and returns. Require evidence from the serving process and rendered app, not command completion.

Do not expose an unauthenticated restart URL on the public preview port. Do not use broad process-name killing or port scanning that can stop unrelated work. The host must identify its own process, stop it with a deadline, confirm exit, then start exactly one replacement on the same strict port.

Most importantly, distinguish the observed stale module from the guessed reason. Directory replacement is suspicious, but the first run could also expose template-time or file-write watcher behavior. Reproduce the disk-versus-HTTP mismatch and test restart recovery before calling the architecture fixed. A placeholder rejection catches this incident, not every incorrect app. Include realistic fresh-content expectations and retain failed evidence for diagnosis. Polling and dependency-cache deletion should not be introduced without evidence that they solve a remaining failure.

## Advisor: First Principles Thinker

The invariant is that the preview advertised as ready corresponds to the saved source being discussed. A successful build proves a separate compiler input was acceptable. A nonempty browser root proves only that some UI rendered. Neither connects the advertised revision to the served program. Fix that missing connection first.

Keep one dev server and a host-controlled transition from editing to synchronizing to checking to ready. Ordinary edits can use HMR. At the completion boundary, rebuild the serving process from the settled source once, then inspect the actual route in a fresh browser context. On restore, stop before replacing the tree and start after dependency installation. That order avoids relying on watchers during destructive directory replacement.

A revision token is useful correlation, but an endpoint that merely reads the latest revision file proves nothing about cached modules. Bind any token to the actual server generation and combine it with content assertions. Avoid a universal semantic validator in this patch. Reproduce the known starter-versus-portfolio failure and establish concrete checks for it, while clearly limiting the general claim. Skip restart for an unchanged healthy preview. This is a lifecycle correction, not a reason to change hosting.

## Advisor: Expansionist

The upside is a preview users can trust, with useful diagnostics when it cannot be shown. Build on the existing durable revisions rather than creating a second deployment platform. A small synchronization result can record the target revision, server generation, elapsed startup time, route checked, and a bounded failure category. Those facts would make future incidents much cheaper to investigate.

A completion restart is a strong initial correctness baseline. After measuring it, conditional invalidation could remove unnecessary restarts, especially during many small edits. Vite's module reload APIs provide a future path, but they require tracking changed files, deleted files, import dependents, and non-JavaScript inputs. Do not put that optimization before a reliable baseline.

Keep the same sandbox and origin so the user does not lose origin-scoped state because a new URL was allocated. A page reload can still discard unsaved in-memory app state, so communicate synchronization clearly and avoid restarting on every visit. Later, a verified build could support permanent publishing, but that is separate scope. The present opportunity is observability plus consistency, with no extra model call and no blanket polling tax.

## Advisor: Outsider

The confusing part is the product saying the portfolio exists while showing a starter. The user should not have to learn whether Vite cached a module or whether an iframe refreshed. The product should say it is preparing the updated preview, show the new page when ready, or say that the files were saved but the preview could not be prepared.

Keep the server the team already uses. Let the backend restart it when a generation completes or when saved files have been restored. Do not make the user press another Generate button or spend credits to display work that already exists. Do not add several repair buttons that each do slightly different things. A single retry for preview preparation is understandable if automatic recovery fails.

Completion must be tied to the currently open project and current operation. If someone switches projects while checks run, the old project's late ready event must not replace the new preview. Test the same address the user opens, including the actual application route, rather than an unrelated default page. A permanent spinner and a green false success are both failures. Keep the error state explicit and preserve the saved work.

## Advisor: Executor

Start with one controlled experiment on the reported project: confirm disk and served module differ, restart only the owned Vite process, and repeat both the HTTP-module and browser-content checks. Do not regenerate code. If that does not repair the mismatch, inspect process cwd, startup command, and proxy target before designing more machinery.

If it works, implement one sandbox-side process controller outside the generated source tree. It owns start, stop, PID identity, strict port 5173, bounded logs, and a lock. Reuse the existing per-project host admission instead of adding another orchestration framework. Keep model tools forbidden from starting a second server; invoke the controller only from host code.

The normal completion path waits for mutations to settle, runs the build gate, restarts once, then checks the actual preview. The restore path stops the server before replacing source and installing dependencies, then starts it once. A healthy unchanged resume does not restart. Rollout must address old templates that lack the controller; updating backend Python alone will not retrofit their startup behavior. Add focused tests for stale content, restore, rapid requests, failure, and cancellation, then measure latency before deciding on polling or incremental invalidation.

## Anonymous mapping

A: First Principles Thinker
B: Contrarian
C: Executor
D: Outsider
E: Expansionist

## Peer review 1 (simulated)

1. Strongest: A. It defines the missing relationship between saved source and the program actually served, rather than equating restart with correctness.
2. Biggest blind spot: E. Its useful telemetry could become a revision handshake that reports a fresh identifier while still serving stale modules.
3. Missing across the responses: the exact source-to-served assertion needs specification. Transformed JavaScript cannot simply be byte-compared to JSX. Use the known fixture's distinguishing content, route assertions, and process provenance first; do not claim a generic hash proves the rendered application is correct.

## Peer review 2 (simulated)

1. Strongest: C. It starts with the discriminating experiment and recognizes that existing templates will not acquire a controller from a backend deploy alone.
2. Biggest blind spot: B. It challenges failure modes without choosing a concrete minimum implementation; that can prolong the user's broken preview.
3. Missing across the responses: a stop timeout must prevent starting a duplicate server. Verify process identity and wait for exit; if ownership is uncertain, report failure. A file containing a PID by itself is not reliable after PID reuse. Existing snapshots need an explicit compatible migration policy.

## Peer review 3 (simulated)

1. Strongest: D. It describes the actual user-visible contract and catches late readiness events after project navigation.
2. Biggest blind spot: C. Treating every completion identically may restart even when no source changed and may reset an interactive form unnecessarily.
3. Missing across the responses: classify a no-op separately from a mutation. Start with restarts for completed mutations and known restore boundaries. If a healthy unchanged runtime is reopened, preserve it. Log the reason for synchronization so users are not left watching unexplained reloads.

## Peer review 4 (simulated)

1. Strongest: B. It refuses to turn a documented API into a guarantee; the restart failure path makes that caution concrete.
2. Biggest blind spot: A. A server-generation token remains only correlation unless it is tied to the process that produced the response; the design must not hide behind terminology.
3. Missing across the responses: controller placement alone is not a security boundary when generated code shares its Unix user. Use existing sandbox isolation and host authorization, avoid a publicly reachable control endpoint, and do not describe this helper as tamper-proof.

## Peer review 5 (simulated)

1. Strongest: C. It scopes the repair to existing lifecycle seams and avoids both a second serving stack and extra model calls.
2. Biggest blind spot: E. Permanent publishing and expanded telemetry are useful later, but they are not necessary to repair this incident.
3. Missing across the responses: distinguish legitimate brief restart downtime from a failed generation. Startup errors must preserve the saved draft and the last verified revision metadata, without claiming the old page stays continuously available through the same-port restart. Validate failure and cancellation, not only a successful portfolio refresh.

## Where the Council Agrees

Keep Vite's dev server and HMR for interactive edits. Browser refresh is insufficient for the observed server-side stale module. The host must own source restoration and server lifecycle; the model must not launch duplicates. Build validity, preview availability, freshness, and content correctness are different checks. Preserve saved source and avoid new LLM generation. These are convergent simulated perspectives, not independent empirical confirmations.

## Where the Council Clashes

Deterministic restart versus conditional invalidation: the Executor favors a single restart after a completed mutation as the smallest baseline; the Expansionist favors reducing restarts after measuring a reliable baseline. The Contrarian and First Principles perspectives prioritize observable freshness over any specific recovery command. Resolution: validate a controlled restart first, then implement one host-owned synchronization boundary. Do not introduce polling or a dependency-aware invalidation engine in the initial patch. A no-op or healthy unchanged visit does not justify a restart.

## Blind Spots the Council Caught

A fresh revision string alone cannot prove transformed modules are fresh; raw JSX and transformed JavaScript differ. A successful restart call can leave the previous server alive on a configuration failure. A PID file alone does not prove process ownership. A backend deploy does not change already-built E2B templates or existing paused snapshots. Restarting the same server can discard in-memory UI state and briefly interrupt availability. Generated code in the same Unix user can interfere with controller files; do not expose public control routes or claim tamper-proof verification. A content smoke check is still not comprehensive product acceptance.

## The Recommendation

Adopt a host-owned Vite dev-server lifecycle, gated by a focused stale-preview experiment. Keep one serving process, one stable sandbox URL and strict port 5173. For completed source mutations, wait for writes to settle, run the existing build gate, perform one controlled stop/start, verify the actual dev preview, then publish readiness and reload the iframe. For source restore or npm ci, stop before replacing the tree and start only after files and dependencies are settled. Preserve a healthy unchanged resume; if it is stale or unhealthy, use one bounded recovery attempt. Do not allocate a new sandbox merely to clear the server cache.

Implement the smallest process controller compatible with the real template startup mechanism. Keep control outside the generated source/archive tree and invoke it through host-authorized E2B command execution, not a public restart HTTP route. Record the owned process identity, synchronization reason and bounded diagnostic output. Verify the old process exited before starting a replacement. Existing per-project admission must serialize writes, synchronization, cancellation, and preview opening. The runtime generation/template migration path must also address old saved revisions that still pin an older template.

Keep build and preview checks separate in logs. A browser check must reject the exact unchanged starter fixture and assert the route's expected content in representative tests. On the live stale case, compare distinguishing portfolio content in the served module and rendered page against the saved source before and after synchronization. Any lightweight revision/generation marker is supporting provenance, not standalone proof. Return a preview-specific failure if freshness cannot be established; preserve saved files and do not claim successful display.

Use a supervised fresh process for the initial boundary rather than integrating a new public control API solely to call server.restart(). Vite's programmatic restart remains a valid implementation option if the host later directly owns the Vite instance. Do not force dependency re-optimization on every restart. Defer polling and targeted reloadModule integration until there is evidence and a measured need.

## The One Thing to Do First

Run a controlled restart experiment on the reported stale sandbox: capture the saved source, served module and visible text; restart only its owned Vite process on the same port; repeat the observations without regenerating code. This experiment has not been performed by this council run. Its outcome gates the patch.

## Proposed flow

```text
Completed mutation
  → settle file writes
  → existing build check
  → controlled restart of owned dev process
  → verify actual served page
  → publish ready + reload iframe

Restore
  → stop owned dev process
  → restore source + install dependencies
  → start once
  → verify actual served page
```

## Validation plan (not run)

- **Initial starter → portfolio:** Disk and served module contain the portfolio; visible root is not the starter.
- **Second completed edit:** Updated text is visible without allocating a different sandbox.
- **Archive restoration and dependency install:** Server is stopped during replacement; starts once against the settled source.
- **Healthy unchanged resume:** No unnecessary restart; current preview remains usable.
- **Failed stop, startup, build or content check:** No duplicate process and no false-ready status; saved source retained.
- **Concurrent open/edit and cancellation:** Existing project admission prevents overlap; late results cannot publish the wrong revision.
- **Mobile and desktop route checks:** Actual app route renders expected content at both sizes; this does not claim full design acceptance.
- **Legacy template and paused snapshot:** Controller compatibility and runtime generation are checked explicitly; no silent unsupported startup path.

## Sources

- [Vite JavaScript API: restart and reloadModule](https://vite.dev/guide/api-javascript#vitedevserver) — Context7 documentation plus official page. restart(forceOptimize?) differs from browser refresh and selective HMR.
- [Vite 8.3.0 restart implementation](https://github.com/vitejs/vite/blob/v8.3.0/packages/vite/src/node/server/index.ts#L1386-L1466) — Inspected exact runtime version source. Replacement construction failure is logged and returns; independent readiness checks remain necessary.
- [Vite watcher configuration](https://vite.dev/config/server-options#server-watch) — Context7 documentation. Polling adds CPU overhead; documented WSL limitations are not proof of our E2B trigger.
- [Vite build versus preview](https://vite.dev/guide/static-deploy) — Build produces dist; it does not synchronize a separately running dev server. vite preview is not intended for permanent production hosting.
- [E2B template start and ready commands](https://e2b.dev/docs/sdk-reference/js-sdk/v2.6.3/template) — Official versioned reference. Startup/port readiness does not establish current project content.
- [E2B Fragments: Next.js template](https://github.com/e2b-dev/fragments/blob/cc07f43736855f42191de7ac011350cef6752342/sandbox-templates/nextjs-developer/template.ts) — 6,373 GitHub stars observed in this research. Starts a Next.js dev server with a port readiness check.
- [Bolt.diy preview event tracking](https://github.com/stackblitz-labs/bolt.diy/blob/2e254ac19a696394030601bc602f54945b12bfc4/app/lib/stores/previews.ts) — 19,870 GitHub stars observed. Tracks server-ready and port events; runtime action runner separates build from start.
- [Bolt.diy runtime actions](https://github.com/stackblitz-labs/bolt.diy/blob/2e254ac19a696394030601bc602f54945b12bfc4/app/lib/runtime/action-runner.ts) — Inspected start/build branches. Copy lifecycle ideas, not arbitrary fixed startup sleeps.
- [Dyad process ownership](https://github.com/dyad-sh/dyad/blob/0c8403662504264f911242504fc2d2b07895c6ad/src/ipc/utils/process_manager.ts) — 21,517 GitHub stars observed. Tracks process identity and manages termination; current code is much larger than the helper we need.
- [Dyad restart versus refresh](https://www.dyad.sh/docs/guides/previewing) — Official docs distinguish restarting the Node.js server from reloading the page.

## Local implementation seams

- `agent/runner.py:verify` builds then inspects a separate dev server.
- `agent/browser-check.cjs` currently accepts any nonempty root.
- `agent/service.py:get_e2b_sandbox` restores source and runs npm ci without a server synchronization boundary.
- `agent/archive.py:restore` deletes and recreates source directories.
- `agent/sandbox_runtime.py` already tracks ownership, reuse, template identity and runtime generation.
- `sandbox/Dockerfile` provisions the template; its actual start command must be inspected during implementation.
- No change to the generated-app dev-server choice or deployed host architecture is proposed.
