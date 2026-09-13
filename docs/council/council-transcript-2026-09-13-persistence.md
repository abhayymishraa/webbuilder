# Persistence council transcript

Date: 13 September 2026.

Method disclosure: five advisor perspectives and five anonymous-letter peer reviews were simulated sequentially by the same assistant because the project's tool mapping requires subagent work to run in the main task. These are not independent agents or different models. No paid external model API was called. Recommendations are design judgments, not completed implementation or runtime test evidence.

## Original request

“Think through file persistence and logs; explore open source; use GCS in production and MinIO locally; use LLM Council for good code decisions and lower charges.”

## Framed question

What is the smallest reliable and low-cost persistence design for WebBuilder's generated files, conversation/run history and diagnostics, using GCS in production and MinIO locally?

Context: Next.js frontend, one FastAPI worker on Oracle (512 MiB API container; 32 MiB /tmp), PostgreSQL/Neon, E2B compute, two concurrent runs. Current code saves text snapshots to a host-mounted projects directory, skips some binary formats, publishes activity before periodic Run.events JSON checkpoints, and requires a live sandbox for file/ZIP routes. The owner wants lower charges and says GCS credentials exist; their scope and billing were not probed. Prior orchestration decisions prohibit automatically replaying interrupted model work.

Research packet: OpenHands SDK separates ordered persisted events; OpenHands Cloud exposes GCS/S3 session storage and optional workspace archives. bolt.diy uses browser IndexedDB for chats/snapshots. Open Lovable's inspected manager caches/reconnects sandboxes. MinIO's community repository is currently archived/source-only. GCS native credentials and S3 HMAC interoperability are different authentication paths. Official pricing charges for storage, operations and network usage; eligible free allowances exist but are not a universal zero-cost guarantee.

Decide the data boundaries, save acknowledgement protocol, restoration behavior, checkpoint granularity, log retention, storage interface and first implementation slice. Compare full revisions with per-file or Git-based persistence. Preserve existing ownership, cancellation and bounded execution. Distinguish source recovery from live previews and avoid additional paid model APIs for this research.

## Advisor perspectives

### Contrarian

The dangerous part is not choosing a bucket. It is telling the user that a project was saved when some files were skipped or when the database points at an incomplete upload. The current binary exclusions and per-file replacement make that a real concern. Moving the same algorithm to GCS merely makes mixed revisions remote.

Make the previous complete revision untouchable. Upload a new immutable archive, validate it, then advance the database pointer. Keep the latest verified revision separate from a failed draft. A storage outage must produce a save error, not an automatic paid regeneration. Cancellation should retain the last checkpoint and stop external work immediately.

I oppose saving only at the end: that risks an entire paid run for a tiny reduction in object operations. Checkpoint completed mutations, but fence concurrent filesystem writers and refuse silent partial captures. Explicitly admit that work inside the current unfinished mutation is not protected.

MinIO locally does not validate GCS credentials, IAM or conditional retries. Its archived community status also means image provenance needs deliberate selection. Keep it local. The first convincing evidence is a restart-and-restore exercise with binary files and a forced upload failure, not a successful PUT request.

### First Principles Thinker

There are three different promises hidden inside “persistence.” The user expects their app files to remain accessible, their conversation to be remembered, and their build outcome to be understandable. A running sandbox and an expiring preview address satisfy none of those promises permanently.

Make an immutable project revision the unit of filesystem truth. Make a committed event the unit of visible activity truth. Make a terminal run record the unit of execution truth. PostgreSQL is already present and handles ownership, ordering and transactions. Object storage handles the heavier bytes. E2B should be reconstructible from those records.

The cheapest architecture is one that does not invoke a model or keep a sandbox alive just to retrieve previous work. Whole compressed archives are appropriate while projects remain deliberately small; a manifest supports browsing without object listings. Per-file content-addressed storage can wait until measured archive duplication warrants its complexity.

Storage adapters should expose only the operations this application uses. Native GCS and a local S3-compatible client are acceptable because there are two actual environments. A universal filesystem or distributed event platform adds no missing product guarantee. First write the invariant: once “saved” is acknowledged, that exact revision must be recoverable after the API and sandbox disappear.

### Expansionist

Durable revisions can make the product substantially more useful than a chat connected to temporary compute. A user could reopen an old project from another device, download it without waiting for a sandbox, compare changes, or return to the last build that passed. These are natural consequences of a small revision model rather than reasons to add an elaborate platform.

I would preserve a short history from the start, with a parent revision and run ID. That gives future rollback and branching a foundation without exposing those features immediately. Retaining a few complete archives is easier to operate than reconstructing a chain of patches after a failure. Include binary assets and a pinned template identity so recovery restores the actual app rather than merely its text files.

The same durable event stream can explain what happened: which change was saved, which verification failed, and whether the preview is sleeping. Those labels may reduce repeated user requests and unnecessary model spending.

My bias is to retain more information than the minimum, but with explicit caps and expiry. Do not save secrets or unlimited raw logs. Measure archive size, restore time and model tokens avoided by reopening existing work. Introduce deduplication beyond whole-revision hashes only after those measurements show meaningful savings.

### Outsider

If I return tomorrow, I expect my app and its chat to still be there. I do not know what a sandbox is, and a “project not active” error would look like lost work. The design should make opening a saved app boring: show its files, history and last save time immediately, then offer to wake a live preview if that requires compute.

The words matter. “Build passed,” “Changes saved,” and “Preview available” are three separate facts. A failed build can still contain saved work. A sleeping preview does not mean files were deleted. An upload error means the latest changes are not yet protected, even if the screen currently displays them.

I would rather see five reliable recent versions than an unexplained promise to store everything forever. State when detailed logs expire and retain understandable summaries. If restoring an old project needs a new model request, the storage design has failed its simplest user expectation.

Before debating adapters, draw what happens after I close the laptop during a build and reopen the same project on another device. Also say whether the database created inside my generated app is saved. Saving the builder's source files does not automatically back up an app's runtime database.

### Executor

Keep the existing API routes and replace their dependency on a live sandbox with a ready revision lookup. Implement the object adapter, revision table and ZIP capture first. The first slice is one test project with text plus an image, saved to local MinIO, followed by sandbox removal and an API restart. Listing, reading and downloading must still return identical bytes without an LLM request.

Initially, full compressed revisions are simpler than per-file objects or Git packs. Use a manifest, deterministic content hash and immutable upload key. A small pending/ready state handles retries and the upload-to-database gap. Keep native GCS credentials separate from MinIO credentials and run the same storage contract locally before an approved cloud probe.

Once that slice works, hook checkpoints into completed mutation batches and add ordered database events before WebSocket delivery. Keep the current single-worker run model. Do not introduce background infrastructure just to perform bounded reconciliation or retention.

Migrate legacy snapshots idempotently and keep the originals until recovery is proven. Existing omitted images cannot be magically restored from text metadata. The production memory and temporary-storage limits are tight, so never accumulate several full archives and expanded trees in API memory. Profile transfer sizes before selecting buffer limits or increasing the VM footprint.

## Peer review

Responses were labeled in a shuffled order for this phase. The single-assistant simulation cannot guarantee blind independence. Mapping revealed: A: Expansionist; B: Executor; C: Outsider; D: Contrarian; E: First Principles Thinker.

### Review 1

Strongest: E. It defines the independent things that must survive and puts them in stores the project already understands. Biggest blind spot: A. Short version history is valuable, but future comparison/branching can distract from restoring current data. All five under-specify the database/object-store commit gap: define pending rows and deterministic keys, reader rules, orphan cleanup, and what happens if the process dies after upload but before pointer advancement.

### Review 2

Strongest: D. It refuses to treat partial or unverified captures as saved and protects the previous revision. Biggest blind spot: B. A tiny proof can become an accidental architecture if the ZIP format lacks version, template identity and deletion semantics. All five miss that restoring onto a template without removing absent files resurrects deleted files. Restore a complete manifest into a clean tree and detect incompatible template or lockfile changes.

### Review 3

Strongest: C. It exposes the user's actual expectations, including the difference between saved source and a live application. Biggest blind spot: A. More retained history has storage, privacy and deletion costs that accumulate beyond the original copy. All five miss that lifetime billing depends on soft-deleted objects, account-wide free-tier usage and Oracle/browser egress, not just visible bucket size. Also distinguish generated-app databases and uploaded user content from builder project archives.

### Review 4

Strongest: B. Its vertical slice provides a concrete stop/go boundary before a broad migration. Biggest blind spot: D. Per-mutation protection could become many expensive sandbox round-trips if implemented with the existing one-file-at-a-time loop. All five need a capture strategy that packages inside E2B, skips unchanged content and fences background writers. Recovery point and cancellation latency must be stated together; cancellation cannot wait for a new archive.

### Review 5

Strongest: E. It avoids a filesystem framework and keeps transactional ownership separate from bytes. Biggest blind spot: B. “Ordered events” alone does not define migration from existing JSON arrays or replay behavior during release. All five need bounded diagnostic payloads, redaction before persistence, stable existing event IDs, a staged backfill, and garbage collection that cannot delete a latest or pending revision. MinIO contract tests must not be presented as proof of GCS behavior.

## Chairman synthesis

### Where the Council Agrees

Keep PostgreSQL for ownership/history and object storage for complete file revisions. Saved reads and downloads must not require E2B. Preserve the last acknowledged revision, use bounded logs and retain the single-worker architecture. Do not make paid model calls to recover files.

### Where the Council Clashes

The Expansionist wants useful version history immediately; the Executor wants the narrowest recovery slice. Resolve this with a revision schema and short bounded retention, but no rollback/branching UI yet. The Contrarian favors frequent checkpoint protection; cheap terminal-only archives reduce writes but lose paid work. Choose checkpoints after completed mutating tool batches, skip unchanged hashes, and accept that unfinished mutations remain outside the durability guarantee.

### Blind Spots the Council Caught

The upload-to-database gap needs pending/ready reconciliation. Restores must preserve deletions and template identity. Background commands can race capture. Soft delete and egress affect costs. Legacy event migration, archive extraction limits and reference-aware deletion need explicit handling. Generated applications' external databases are not backed up by source archives. These are peer-review observations from simulated perspectives, not independently discovered evidence.

### The Recommendation

Use immutable ZIP revisions in private GCS and local MinIO, with native GCS and S3 adapters exposing only required operations. Keep revision manifests and latest-saved/latest-verified pointers in PostgreSQL. Save completed mutation checkpoints before acknowledging them. Store compact ordered events in PostgreSQL before broadcasting; archive bounded expanded diagnostics once per terminal run. Implement explicit saved/build/preview statuses, no automatic model replay, and low-cost retention/quotas. Treat the local source folder as a migration source or disposable cache, not the durable authority. The detailed proposal defines failure ordering, limits and provider-specific release checks.

### The One Thing to Do First

Implement and prove one MinIO vertical slice: save a text-and-image project, remove its E2B sandbox, restart the API, then list/read/download the exact saved bytes without invoking a model.

## Evidence

See [the persistence proposal](../architecture/persistence-proposal.md) for inspected code, source links, current costs, explicit limits, migration and acceptance criteria. Application code and provider configuration were not changed in this research task.

