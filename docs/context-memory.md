# Project context and guarded compaction

Status: implemented locally, checks intentionally unrun at the user's request.
No paid model evaluation, provider smoke, migration execution or deployment was
performed for this change. This is not evidence of benchmark accuracy.

This implements the staged [council recommendation](council/council-report-2026-09-13-06-30-42-context-memory.html):
keep the existing runner; add project-scoped context assembly; evaluate continuity
before enabling automatic summaries. No OpenHands runtime, vector database,
embedding service, Redis or additional model provider was added.

## What a new request receives

`Service.admit` records the authenticated owner and the exact user-message ID on
the live run. `ProjectContext` verifies the owner and email-verification state
again whenever it loads or searches history. All queries are scoped to that
project and ordered before `(created_at, id)` of that request. Later messages
cannot move the cutoff during the run.

The context builder supplies:

- The original user request, explicitly labelled as historical.
- The last six user/assistant messages in chronological order. Legacy tool-event
  messages are excluded; current assistant run summaries are included.
- Up to eight older matches from PostgreSQL full-text search, deduplicated against
  the recent window and original request. All matches remain attributed quotes.
- An existing validated summary, if one has been created with compaction enabled.
- The previous run's recorded status and bounded reason, not a fabricated success.
- The current saved revision ID and message cutoff for provenance.

This is bounded retrieval, not a promise that every past requirement is always
in context. The original request is an initial brief; there is no separate
user-editable pinned-requirements UI in this slice. Recent corrections and the
latest request take priority over older quotes. If an important decision is not
selected, the agent can call `search_project_history` with specific words or file
names. Ambiguous references must be clarified. Lexical search does not interpret
screenshots or guarantee semantic matches; the fixture pack explicitly includes
such limits rather than pretending to solve them.

Existing file paths are ranked using the request and selected evidence. Up to
eight current files are provided as labelled 4,000-byte excerpts. The agent must
read complete files before replacing them. Existing cached file tools remain
available. A historical path is never inserted into the current file list.

Context data is capped at 48,000 serialized UTF-8 bytes; retrieval tool results
at 24,000 bytes. If the recent window itself cannot fit, the run stops with a
context error instead of silently dropping it. Older legacy messages exceeding
12,000 characters are explicitly marked truncated. Secret redaction happens
before model-facing history is assembled; public activity retains its existing
short redaction limit. Source data and retrieved instructions remain untrusted
data beneath the system and current user instructions.

## Compaction is opt-in

`MEMORY_COMPACTION_ENABLED=false` is the default. Basic history retrieval needs
no extra LLM call. Set it to `true` only after approving and evaluating summary
quality on the desired model.

When enabled, one compaction attempt may run before a new editing conversation,
after sandbox preflight. The six recent exchanges are not summarized. Older
unsummarized history triggers consideration when it exceeds twelve messages or
12,000 serialized bytes. At most 101 pending rows are selected and at most 24,000
bytes of old-summary-plus-message data are submitted. Large backlogs are covered
incrementally; the stored cutoff identifies exactly how far compaction reached.
Uncovered history remains searchable.

The existing model is reused with a 2,048-token output cap and 25-second timeout.
There is no new provider or independent summarizer agent. The existing SDK client
permits one retry; changing copied model settings does not rebuild that client.
Two attempts are conservatively reserved against the shared run budget before
awaiting the call. Reported usage goes into measured token counters; unconfirmed
capacity remains in `reserved_tokens`, which also participates in spend checks.
This can stop earlier than actual billed usage would require. It is not a billing
meter or a guarantee of cost reduction.

The summary schema contains an overview, unresolved work and exact user-decision
quotes with message IDs. Validation checks schema limits, source existence,
project scope, user role and exact quote membership. Quotes can come only from the
submitted messages or the previous summary's cited evidence. This rejects invented
citations; it does not prove that the overview is true or that every important
constraint survived. Derived summaries are labelled untrusted in model input.

`project_memory` stores one summary per project, a version, covered message ID and
source revision ID. Publication locks the project and compares the previously
loaded summary version and current revision. The old summary remains until the
replacement transaction commits. Failed validation, provider errors or insufficient
budget keep the old summary. Cancellation propagates. Compaction cannot extend the
run's outer deadline or replay interrupted mutations.

Compaction is between requests, not an in-run rewrite of tool-call history. The
current run's tool-call/result pairs stay intact and its original context/turn
limits remain enforced. Longer single-run tool conversations still stop at those
limits. A future in-run condenser requires separate tool-pair and failure tests.

## Persistence and deletion

Original user messages remain in PostgreSQL under the existing conversation
retention policy. Expiring diagnostic events does not remove those messages.
Public event logs are never reconstructed as a complete LLM conversation.

Project deletion cascades to its memory row; deleting the covered message also
invalidates the row through a foreign key. Cited user messages are rechecked when
loading a summary. No user-wide or cross-project memory is created. GCS/MinIO
continue to hold source/log artifacts; they do not serve memory-search queries.

The additive migration creates `project_memory`, a project/time message index and
a PostgreSQL GIN text-search index. Restart with the existing `make backend`
workflow to apply it before using this code. Large production histories may make
initial index creation take time; use the existing drained deployment procedure.
No current private environment files were modified for this feature.

## Fixtures and evaluation

`tests/fixtures/context_conversations.json` has ten scenarios: early palette,
verified-email requirement, changed decisions, named files, renamed files,
ambiguous references, failed work, restart, project isolation and deletion.
`tests/test_context.py` adds offline contracts and opt-in real PostgreSQL checks
using fake model responses. These tests check evidence availability and storage
boundaries, not whether a real coding model follows the evidence.

Checks were deliberately left unrun. When explicitly authorized:

```sh
uv run --env-file .env python -m unittest discover -s tests -p 'test_context.py'
uv run --env-file .env python -m unittest discover -s tests -p 'test_orchestration.py'
```

For database tests, use a separate local database whose name contains
`webbuilder_test`, set `DATABASE_URL` to it, and set `RUN_CONTEXT_DB_TESTS=1`.
The tests refuse non-local targets and other database names. Never point those
fixtures at the application's normal database.

Before turning compaction on by default, run a separately authorized evaluation
with the same model and spending limits across the baseline and new context
builder. Include held-out paraphrases and repeated runs. Score current-requirement
retention, superseded decisions, required-file retrieval, invented paths, actual
feature correctness and total successful-task cost. The current fixtures do not
establish a score, semantic-retrieval quality or superiority to OpenHands.
