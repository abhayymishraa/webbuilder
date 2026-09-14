# E2B capabilities and harness tool shortlist

Research date: 2026-09-14. Research only; no runtime changes or live E2B calls.

## Scope and evidence

Reviewed the current E2B documentation index, targeted pages across its capability
families, and the installed Python SDK 2.49.1. This is not a claim that every API
reference leaf was read or every documented feature was exercised. Account-specific
availability, deployed envd versions, and performance remain unverified.

Context7: resolved E2B, queried `/websites/e2b_dev` for Git integration and request
secret injection (three CLI calls total). Cross-checked with canonical docs and
installed source; indexed references include older SDK versions and old URLs.

Repository source inspected at fixed commits:

- [OpenHands software-agent-sdk](https://github.com/OpenHands/software-agent-sdk/tree/ccde94913e4f95bdb6df196853a8c09f8b1ab834): file editor definition/implementation, terminal definition, task tracker, browser tool definitions. This is the tool implementation repository; the main OpenHands application consumes it.
- [OpenCode](https://github.com/anomalyco/opencode/tree/a74c472ffb941e6b027e5348be50cfe2225c6c56): core read, edit, and grep tools, plus published tool documentation.

Both repositories report MIT licenses. If source is copied later, retain the
applicable copyright/license notices and review the copied files' dependencies.
Popularity is not evidence that a tool improves WebBuilder's task success.

## What those harnesses actually provide

| Capability | Source evidence | E2B replacement boundary |
| --- | --- | --- |
| Targeted file editing | OpenHands supports view ranges, create, replace, insert, undo; OpenCode has bounded reads and editing tools | E2B reads/writes files. Matching, ambiguity handling, concurrency safety, and edit history remain editor logic. |
| Search | OpenCode uses ripgrep for content/file discovery | Run ripgrep through E2B commands; E2B is not itself a code search engine. |
| Terminal | OpenHands supports command execution, input, timeout observations, terminal reset | Native E2B command handles and PTY cover execution/interaction; host ownership and cancellation policy still belong to us. |
| Browser interaction | OpenHands exposes page state, optional screenshots, click and typing | Reuse Playwright in our sandbox; E2B provides execution/files, not DOM interaction or visual judgment. |
| Task tracking | OpenHands has structured task statuses | Application state; no E2B primitive is necessary. |

Sources: [OpenHands file editor](https://github.com/OpenHands/software-agent-sdk/blob/ccde94913e4f95bdb6df196853a8c09f8b1ab834/openhands-tools/openhands/tools/file_editor/definition.py),
[terminal](https://github.com/OpenHands/software-agent-sdk/blob/ccde94913e4f95bdb6df196853a8c09f8b1ab834/openhands-tools/openhands/tools/terminal/definition.py),
[browser](https://github.com/OpenHands/software-agent-sdk/blob/ccde94913e4f95bdb6df196853a8c09f8b1ab834/openhands-tools/openhands/tools/browser_use/definition.py),
[task tracker](https://github.com/OpenHands/software-agent-sdk/blob/ccde94913e4f95bdb6df196853a8c09f8b1ab834/openhands-tools/openhands/tools/task_tracker/definition.py),
[OpenCode tools](https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/tools.mdx).

## Recommended order for WebBuilder

1. **Browser evidence and bounded interactions.** Extend the existing inspection
   surface with optional screenshots and a small action sequence for the local
   generated app. Reuse installed Playwright and native E2B execution/file transfer.
   Keep screenshots optional; send an actual image content block to a capable model,
   not base64 dumped into JSON text. Our current JSON tool-result path needs work
   before this is useful. Bound image size/action count, preserve viewport/revision
   attribution, and distinguish navigation from actions that mutate application data.
   This addresses a concrete gap: current inspection cannot exercise buttons/forms
   or let the model see visual composition. It is a proposed improvement, not a
   measured design-quality gain.
2. **On-demand sandbox diagnostics, owned by the host.** Native `get_metrics()`
   supplies CPU, memory and disk samples; lifecycle events provide provider-side
   evidence when a sandbox disappears. Fetch on failures/support requests rather
   than putting periodic diagnostics into every model turn. Keep application logs
   and durable run state. [Metrics](https://docs.e2b.dev/sandbox/metrics),
   [lifecycle events](https://docs.e2b.dev/sandbox/lifecycle-events-api).
3. **Git integration when repository import/export becomes a product feature.**
   Use `sandbox.git.clone/status/add/commit/push` instead of inventing shell parsers
   and credential plumbing. The installed async SDK has these methods, but no
   `git.diff` method was found. Patch output still needs Git execution. Our starter
   does not initialize a repository and durable archives exclude `.git`, so this
   is not an immediate drop-in change-history system. Keep push explicitly authorized.
   [E2B Git](https://docs.e2b.dev/sandbox/git-integration).
4. **Re-evaluate targeted reads/search/editing separately.** These patterns appear
   in both harnesses and may reduce whole-file tool traffic. Previous WebBuilder
   versions were explicitly removed by the user. Do not silently restore them or
   claim savings: compare representative tasks, tokens, latency and correctness
   before proposing a small replacement. E2B supplies transport, not these semantics.

## Broader capability audit

| Documentation family | Finding | Decision |
| --- | --- | --- |
| Getting started, API key, SDK, cookbook, help | Onboarding inventory reviewed; not an additional model tool surface | Keep credentials host-side; no tool for key management |
| Billing and limits | Provider compute is usage-based; no local evidence of savings from a new capability | Measure before changing storage/compute strategy |
| Templates: base image, dependencies, cache, readiness, names/tags, logs/errors | Native builder/readiness/promotion code is already added locally; not built/deployed | Finish approved validation before expansion |
| File reads/writes and metadata | Native compressed streaming/batch operations already used locally | Keep byte caps, path boundaries and partial-upload handling |
| File custom metadata | Requires envd >=0.6.2; files can carry annotations | Optional provenance, not authoritative revision integrity |
| Watch directory | Native recursive watcher, delayed events, possible missing non-CREATE events during rapid nested folder creation | UI invalidation hint only; never the sole save trigger |
| Volumes: manage/mount/read/write/upload/download | Persistent mounted paths and off-sandbox volume operations | Evaluate scratch/cache use; not a replacement for immutable revisions |
| Volume migration | Official guide mounts both volumes and invokes rsync | No magical atomic migration API; keep migrations explicit |
| Cloud buckets | Official GCS/S3/R2 guide installs FUSE tools such as gcsfuse | Integration recipe, not a native transactional project store |
| Archil | Separate POSIX storage service with object-store integration | Consider only with an explicit shared-storage need and cost comparison |
| Public URL and access restrictions | Native per-sandbox traffic-token header | Useful for private previews; iframe requests require a compatible authenticated proxy/access design |
| Internet controls and proxies | Native allow/deny rules; BYOP routes through external SOCKS5 without a guest proxy client | Host policy when needed, not an unrestricted model network-control tool |
| Custom domains | Current guide involves proxy/server/domain setup | Product/deployment feature; no generation tool needed |
| Secrets create/inject/rotate/delete/list | Proxy resolves stored secrets into matching HTTPS headers outside the sandbox | Useful for future generated-app integrations; not needed for host-only model calls |
| Workload identity | Explicitly private beta | Defer pending access and a real cloud integration |
| Commands and PTY | Native run/connect/list/kill and interactive input | Existing bounded wrapper is appropriate; PTY only for actual interactive workflows |
| Snapshots/forks/filesystem-only pause | Native capabilities exist with different runtime semantics | No default fork per prompt; evaluate separately |
| CLI | Operator create/connect/exec/kill/snapshot management | Use for operations; prefer SDK inside the backend |
| Metrics/lifecycle/OTel | Native metrics/events; telemetry export is Enterprise-only and best effort | On-demand native diagnostics first |

## Limits that materially affect a design

- **Watchers are not a journal.** `include_entry` needs envd >=0.6.3; network-mount
  opt-in needs >=0.6.4. Network watches can miss events and do not observe writes
  from other clients. [Watcher documentation](https://docs.e2b.dev/filesystem/watch).
- **Volumes retain mutable state.** A mounted persistent path can retain a failed
  command's partial edits. Moving our workspace onto it would change the meaning
  of rollback/checkpoint guarantees. Pricing, consistency, isolation and concurrent
  writer behavior need a separate evaluation. [Mounting volumes](https://docs.e2b.dev/volumes/mount).
- **Cloud-bucket mounting is additional machinery.** The GCS guide uses gcsfuse
  and cloud credentials. It does not supply our ownership, archive validation or
  atomic revision-pointer update. [Cloud buckets](https://docs.e2b.dev/storage/cloud-buckets),
  [Archil](https://docs.e2b.dev/storage/archil).
- **Secret resolution does not fail the request closed.** If a referenced secret
  cannot resolve, E2B forwards the request with the affected header omitted. The
  destination must reject unauthenticated requests. Network rules alone do not
  restrict egress; configure allow/deny rules too. Use trusted destinations and
  scoped credentials. [Secret injection](https://docs.e2b.dev/secrets/inject).
- **Private previews need browser-compatible authorization.** The native control
  requires `e2b-traffic-access-token`; merely setting `allow_public_traffic=False`
  would break our direct iframe flow. [Restricted public access](https://docs.e2b.dev/network/restrict-public-access).
- **Forking interrupts connections.** It pauses/captures/resumes the source;
  active WebSocket, PTY and command streams disconnect. Forks are independent
  compute allocations, not free copies. [Forking](https://docs.e2b.dev/sandbox/fork).
- **Disk-only pause loses processes.** `pause(keep_memory=False)` requires a
  reboot and server startup on resume and cannot combine with auto-resume.
  Lighter snapshots do not prove a cheaper or faster complete preview workflow.
  [Filesystem-only snapshots](https://docs.e2b.dev/sandbox/filesystem-only-snapshots).
- **Observability is bounded.** Lifecycle events have a documented seven-day
  default retention. Webhooks have limited retries; keep reconciliation. OTel
  export is Enterprise-only and can drop data. [Events](https://docs.e2b.dev/sandbox/lifecycle-events-api),
  [webhooks](https://docs.e2b.dev/sandbox/lifecycle-events-webhooks),
  [OTel](https://docs.e2b.dev/sandbox/otel-telemetry-export).

## Decision

Prefer native E2B primitives where they own the operation. Reuse established
tools such as Playwright, Git and ripgrep for semantics E2B does not provide.
Keep a small WebBuilder layer for permission, output limits, revision ownership
and final verification. Do not expose the provider's entire administration API
to the generation model. No benchmark or cost improvement is established here.
