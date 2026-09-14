# Native E2B migration acceptance

Status: **local and disposable E2B acceptance passed**. The user approved these
checks on 2026-09-14. Existing-project recovery, generation costs and production
readiness remain unverified. No runtime source changes were needed in this pass.

Detailed observations: [acceptance results](e2b-native-migration-results-2026-09-14.json).

## Candidate

- Base commit: `ebc3a3c8466d32aabeb226a0e4125425e03af711` on `main`.
- Working tree: uncommitted migration; the base commit alone does not identify it.
- Scoped source SHA-256: `fe35886695cbd7ad6cc927f94886e3b8f946c08822c4962a2c3314f3c1929954`.
- File fingerprints: [candidate manifest](e2b-native-migration-candidate-2026-09-14.json).
- Required SDK: `e2b==2.49.1`, from `pyproject.toml` and the lockfile.
- Native template candidate: `webbuilder-react-design:18d85465-a287-44a8-814b-242583f89c08`.
- Candidate release: `webbuilder-react-design:v2026-09-14-acceptance-1819`; build finished in 58 seconds
  according to the native builder log. No environment tag was promoted.
- Existing project/run for recovery: **not selected**. Select through the
  authenticated local application; do not assume an old conversation's project
  still exists or belongs to the current session.

The manifest covers the migration, its immediate runtime dependencies and tracked
starter files. It is not a full deployment image identity. Refresh it after any
source change; record a complete commit and immutable build before release.
No credentials, private project source or environment values belong in this record.

## Source inspection findings

These are code observations, not passing runtime checks:

| Requirement | Existing implementation |
| --- | --- |
| Native bounded command execution | `agent/commands.py:run_command` uses background handles, one owned-process reconnect and an outer deadline; it does not rerun the shell command. |
| Unknown command outcome | `CommandStateError` escapes `run_editor` before its dirty checkpoint; `Service.execute` retires the sandbox on failure. |
| Partial upload | `write_files` raises `FileWriteError`; the runner stops before checkpointing the incomplete batch. |
| Fresh preview after mutations | `ensure_preview_current` advances its revision only after the host's preview restart succeeds. `verify` builds before restarting/checking. |
| Durable recovery | `Service.save_files` stores revisions; runtime reuse requires matching saved revision, template and generation. |
| Correct completion boundary | Successful service completion follows host verification. Latest saved and latest verified revision pointers remain separate. |
| Native template preparation | `sandbox/template.py` builds with native start/readiness commands and returns an immutable build reference. Promotion is a separate command. |

The codebase-memory index returned stale deleted-test symbols. Current files were
read directly after graph discovery; old graph results are not verification evidence.

## Approval boundaries

The user approved local checks, one candidate template build and disposable
sandbox acceptance. The first two scopes below have been executed. The remaining
scopes have not been executed or inferred from that approval.

1. Local syntax/import and temporary fake-SDK checks: no provider calls, no test
   files in the repository. Ask for approval before execution.
2. Starter lint/build and one native E2B template build plus disposable-sandbox
   checks: separate approval covering package downloads and E2B quota.
3. Authenticated local project reopening: may resume E2B; no generation request.
   Requires an available signed-in session and approval for that browser check.
4. A representative generation/cost comparison: separate OpenAI/E2B approval.
   Do not infer it from approval for provider-free checks.

No staging environment is assumed. Do not promote any environment tag, change
production configuration, deploy, or operate on a user's active sandbox as part
of the isolated acceptance exercise.

## Phase 1: local acceptance

Run from the repository root only after approval:

```sh
uv run --no-sync python -m compileall -q agent sandbox/template.py
node --check agent/browser-check.cjs
uv run --no-sync python sandbox/template.py --help
```

These cover syntax and template CLI import/argument initialization, not remote
SDK behavior. They may create local bytecode caches. A missing dependency is a
blocked prerequisite, not a successful check; do not silently update the lockfile.

Use an ephemeral external workspace for the following manual fake-SDK exercises.
No permanent harness, fixtures, test dependencies or CI jobs are to be added:

| Exercise | Required observation |
| --- | --- |
| Successful command | One start call; bounded stdout/stderr and the observed exit code. |
| Disconnect while owned process is still running | One start, at most one reconnect to the matching PID/cmd/args/cwd; output marked potentially incomplete. |
| Lost start response, missing PID, failed reconnect or timeout | `CommandStateError`; no replacement command invocation. |
| Output bound exceeded | Fatal command state; no later edit or checkpoint from that tool turn. |
| Batch upload fails after an earlier file was written | `FileWriteError`; runner emits failure and does not checkpoint the partial batch. |
| Service receives either fatal error | Sandbox retirement attempted; terminal result cannot claim success. Cleanup failure keeps reopening blocked. |
| Preview restart fails | `preview_revision` is not advanced; a later attempt remains possible. |

Observe wrapper calls and checkpoint/publication boundaries, not merely exception
types. Simulated failures establish application behavior under the simulation;
they cannot prove provider transport, process identity or cancellation semantics.

## Phase 2: isolated native template and sandbox

After the relevant approval, run the starter checks:

```sh
npm --prefix sandbox ci --no-audit --no-fund
npm --prefix sandbox run lint
npm --prefix sandbox run build
```

Build one uniquely versioned candidate through the existing native release CLI:

```sh
uv run --no-sync --env-file .env python sandbox/template.py build webbuilder-react-design:v2026-09-14-acceptance-1
```

If that release name was already used, choose a new suffix and record it. Save
the returned `build_ref`, build logs, SDK and actual sandbox daemon versions.
Do not invoke `promote`; do not rewrite `.env` or any backend deployment variable.

Create one disposable sandbox from that exact reference using the existing native
create/lifecycle settings. Retain its ID locally for bounded cleanup. In that
sandbox only:

1. Observe native startup and HTTP readiness, and run `check_browser(...,
   preflight=True)` to exercise installed Chromium. The untouched starter is
   deliberately rejected by the application's final build check; that expected
   rejection is not a template-start failure.
2. Through `WorkspaceTools` write a temporary visible acceptance marker into the
   starter's Home component. Read it back through the compressed read path.
   Invoke `verify(workspace)` and inspect both desktop and mobile. Require the
   marker in actual rendered content, not just HTTP 200 or successful compilation.
3. Change the marker again through the same tool surface. Require a fresh preview
   of the second marker; retain the two workspace revision observations.
4. Pause and reconnect this disposable sandbox with native E2B lifecycle methods.
   Observe restored files and browser content. Record timing and sandbox identity.
5. Exercise a harmless bounded command timeout only in this disposable sandbox.
   Record unknown outcome and cleanup; do not manually fault-inject into an
   existing user project or claim this proves durable DB checkpoint behavior.
6. Terminate the disposable sandbox even if an earlier observation fails. Record
   cleanup as confirmed or pending; unknown cleanup must not be called complete.

No model invocation is needed for this phase. E2B compute/build quota is used.
Inspecting a generated page can issue external requests; use the neutral starter
with no third-party integrations for the disposable sandbox exercises.

## Phase 3: ordinary application recovery

Select a previously failing saved project through `/projects` in the signed-in
local application. Do not submit a prompt or modify its source for this phase.

Use authenticated browser network responses from these existing backend routes:

| Route | Evidence to retain, redacted |
| --- | --- |
| `GET /projects/{id}/revisions` | Latest saved ID, latest verified ID, relevant ready revisions and run IDs. |
| `GET /projects/{id}/files` | Manifest and revision ID. |
| `GET /projects/{id}/files/src/pages/Home.jsx?revision_id={id}` | A known visible source phrase; do not archive the whole private source in this report. |
| `GET /chats/{id}/runs` | Status, reason, relevant metrics and verification/checkpoint events. |
| `GET /projects/{id}/preview` | Application preview state. |
| The normal UI's `POST /projects/{id}/preview` | Returned preview and the exact iframe URL actually displayed. |

Open the saved project normally, compare that visible phrase with the saved
revision, leave and reopen it. Record project, run, saved revision, verified
revision, sandbox and iframe identities together. If the latest saved revision
differs from the verified revision, report that distinction explicitly.

A historical generation might lack a unique visible phrase. In that case this
phase is insufficient to establish freshness; request a separately authorized
controlled edit on a disposable project. Do not invent a freshness result.

## Evidence ledger

| Item | Current result |
| --- | --- |
| Local syntax/import checks | PASSED: Python compilation, browser script syntax, template CLI initialization |
| Simulated failure boundaries | PASSED: 17 cases in a temporary external workspace; network connections forbidden |
| Starter lint/build | PASSED locally; local Node 24.18.0 emitted an engine warning. Builds also passed on template Node 24.21.0. |
| Exact native template build reference | BUILT: `webbuilder-react-design:18d85465-a287-44a8-814b-242583f89c08` |
| Disposable sandbox create/edit/verify/resume | PASSED: native startup, untouched-starter rejection, two fresh marker edits in desktop/mobile, same-sandbox pause/resume, nonzero exit and fatal timeout |
| Disposable sandbox cleanup | CONFIRMED ABSENT via provider lookup after kill: `id5uid6wiwl8n5dtckk6b` |
| Existing project recovery via normal UI | NOT RUN; project not selected |
| Real provider token/cost baseline | NOT RUN |
| Production readiness | NOT ESTABLISHED |

Stop on a lost durable revision, incorrect preview identity, command replay,
unconfirmed cleanup or misleading success. Fix that demonstrated failure before
expanding tools. Preserve previous successful checkpoints; never overwrite them
to make an acceptance case pass.

## Observed environment and limits

- SDK 2.49.1; envd 0.9.0; template Node 24.21.0; Playwright 1.63.0.
- Disposable sandbox: 1 CPU, 1024 MiB memory.
- Native create: 1.180 seconds; pause: 0.661 seconds; resume plus file reads and
  desktop/mobile inspections: 4.911 seconds. These are single observations, not
  cold-start or resume benchmarks. Entire disposable exercise: 46.537 seconds.
- All files covered by the candidate manifest still matched after acceptance.
- Local fakes exercised runner checkpoint suppression and service retirement.
  They do not prove live DB/object-storage durability or recovery of a real user
  project. Provider reconnect semantics were simulated; native nonzero exit and
  timeout were exercised live.
- No screenshots, browser actions, metrics tools or storage changes were added.

## Decision after acceptance

- Correct source served, but visible defects remain unseen: propose optional
  screenshot observation within `inspect_preview`, with actual image transport,
  a compatible model, bounded images/calls and explicit cost measurement.
- Lifecycle failures remain unexplained: add only the missing on-demand native
  metrics/lifecycle evidence, owned by the host.
- Budget stop: inspect the recorded stage, input estimate, output reserve,
  measured usage and remaining allowance. Caching discounts do not automatically
  change the application's token limit; E2B-only acceptance cannot prove savings.
- No demonstrated gap: ship the validated migration only when explicitly asked.

Browser clicks/forms, storage migration, Git integration and reinstated custom
editing tools remain deferred. Passing this record establishes only the checked
behaviors on the identified candidate, not universal quality or benchmark gains.
