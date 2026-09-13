# WebBuilder context and memory council

Date: 2026-09-13 06:30:42 UTC

## Method and limits

Five perspectives and five letter-labelled peer reviews were simulated sequentially by the main assistant under the project's sequential-work rule. No independent subagents or external model calls were used. Labels were randomly assigned after drafting the perspectives; the same assistant still knew the mapping, so this is not a blinded or independent evaluation. Sources were checked in the preceding research turn. This report makes a design recommendation, not a measured accuracy claim.

## Original question

Use llm-council to decide what we should use for accurate context storage, retrieval and chat compaction among the projects just researched.

## Framed question

Which context-management approach should WebBuilder adopt now: integrate the OpenHands SDK, build a small extension of the current runner using selected upstream patterns, or adopt another researched app-builder architecture? Decide how to handle durable history, retrieval, long-chat compaction, accuracy evaluation and cost.

WebBuilder uses Next.js, one FastAPI worker on a small Oracle deployment (512 MiB API container), PostgreSQL, E2B temporary compute, and a configurable lower-cost OpenAI model. The user prioritizes low charges, reliable edits and remembering requirements across many requests. Existing execution has explicit run ownership, cancellation, time/token/tool budgets and host-controlled build/browser verification. The current run_editor creates a fresh conversation from the latest request, five selected scaffold/source files and a file list. It does not retrieve earlier chat decisions or compact growing context; it stops at a context budget.

Persistence implementation keeps ownership/messages/events/revision metadata in PostgreSQL and source/log objects in private GCS or local MinIO. A real local Playwright flow proved sample file import, source display and byte-identical ZIP download after removing originals and restarting the backend. Live generation checkpointing, log recovery, E2B restoration and production GCS remain unverified. A memory change must not be confused with completing those checks.

Evidence checked during the preceding research: OpenHands documents conversation persistence, threshold-based LLM condensation and opt-in two-tier Markdown memory with a small index and on-demand notes. Its April 2025 experiment reported 54% versus 53% solved on a SWE-bench Verified subset and per-turn costs eventually below half the baseline; this does not benchmark newer persistent memory or establish current leadership. Dyad offers model-assisted relevant-file selection as a Pro feature. Its merged PR #4128 describes an eight-fixture internal compaction evaluation measuring fact retention, superseded decisions, invented file paths and downstream probes; best reported weighted retention was 83%, downstream probes 80%. Those are internal synthetic results, not directly comparable to SWE-bench. bolt.diy and Open Lovable were useful persistence/sandbox references; comparable retrieval-accuracy evidence was not established.

Choose a concrete implementation boundary and first step. Consider integration/maintenance cost, stale or lossy summaries, cross-project isolation, reliable continuation, retrieval quality, model costs and measurable acceptance. Do not assume SDK integration, embeddings or a second model are necessary. Do not assume a hand-built memory system is automatically cheaper or safer. This task decides and documents; it does not authorize application changes, paid eval runs, deployment or pushes.

## Advisor responses

### The Contrarian

The dangerous assumption is that adding a summary makes this agent remember accurately. A summary can confidently preserve the wrong decision, omit the one constraint the user cares about, and repeat that mistake on every later request. Dyad's own numbers show that compaction is lossy. OpenHands' older benchmark is not evidence that our inexpensive model will preserve a long app-building conversation.

Do not migrate the runtime to chase a leaderboard. Do not immediately add recursive summaries either. First give each new request access to recent authentic messages and explicit project constraints with links to their source messages. Retrieve older evidence when the request refers backward. Keep current source files authoritative for implementation facts.

I would defer automatic LLM compaction until a small evaluation demonstrates that it beats the existing baseline without resurrecting abandoned choices. Include an early security requirement followed by many irrelevant turns, then a contradictory later request and a failed build. Measure whether the system recognizes what actually changed.

Preserve the current stop limits. A broken memory service should not silently reset the brief or initiate fresh model work. The cheapest reliable first step is making existing history useful, not creating another autonomous agent to curate it.

### The First Principles Thinker

The decision is about selecting evidence for an edit. Storage, selection and summarization are different operations. PostgreSQL can retain conversation facts; object storage can retain source artifacts; neither determines which evidence the model sees. The missing product primitive is a bounded context assembly step.

Use the existing runner and introduce one context builder. Its inputs should be the new request, the authenticated project, the current revision and a stable conversation cutoff. Its output should contain authoritative project requirements, a compact account of earlier work, recent exchanges, relevant current source and unresolved verification failures. Every remembered decision needs a source reference. A summary is a convenience for navigation, not an authority that overrides newer user instructions.

Borrow OpenHands' distinction between the durable record and the model-facing view. Borrow Dyad's evaluation dimensions rather than its paid file-ranking service. Begin retrieval with project-scoped text search and explicit file paths; use the existing file tools to inspect code. Indexing everything into vectors does not fix wrong ownership, obsolete facts or absent context.

Compaction belongs behind the same boundary. Trigger it only when the assembled context exceeds a measured budget, while preserving recent exchanges and explicit constraints. This gives us a replaceable component without replacing execution, storage or authentication.

### The Expansionist

The upside of OpenHands is not its headline score. It is the accumulation of engineering around conversations, tool results, condensation, resumption and extensibility. WebBuilder has already spent substantial effort reconstructing pieces of an agent platform. Continuing to add bespoke persistence and memory may create a framework by accident.

I would make the OpenHands SDK the leading long-term candidate and compare a minimal integration against extending the current runner before committing to more custom orchestration. Keep our product UI, authentication and storage ownership. Investigate whether the SDK can own the model conversation without owning the entire application or deployment. The E2B integration, cancellation boundary and existing checkpoints are compatibility questions that must be demonstrated, not assumed.

The opportunity is reliable multi-session work: a user returns to an app after days, changes direction and gets a coherent continuation. That would matter more than one impressive first generation. A common conversation abstraction could also let us compare models on identical tasks and inspect where memory was lost.

Do not buy Dyad Pro merely for file selection. But do count engineering maintenance as a real cost. If a supported SDK can satisfy our execution contracts and deployment footprint with less custom code, rejecting it for ideological simplicity would be expensive.

### The Outsider

A user does not know whether you have a vector database, a condenser or an event store. They know whether they must explain the same thing again. If I said orange, kept the login requirement and rejected a pricing section, I expect the next edit to respect all three. I also expect to be able to change my mind.

Choose the approach that makes those promises understandable. Keep a short project brief that reflects my current instructions, with a way to correct it. Separate what I asked for, what the agent attempted and what actually passed verification. A failed attempt must not become a remembered feature. An old screenshot must not be treated as the current application.

I would keep the current system and add focused continuity first. When I say “use the earlier version,” find the relevant choice or ask which version if there are several. Do not silently guess because a summary sounds confident.

Make compaction invisible when it works and explain a limitation when it does not. Avoid another dashboard full of logs and controls. The success test is a realistic conversation with changes of mind, followed by a return visit. Neither a high star count nor a successful ZIP download demonstrates that experience.

### The Executor

Ship the missing connection between saved history and the model before changing the framework. Implement a single context-building function beside run_editor and keep the current admission, cancellation, checkpoint and verification contracts intact. Fetch recent user and assistant messages from PostgreSQL, include a bounded project brief, then resolve relevant files from the current revision. Leave the existing tool loop responsible for additional reads.

Start with a replayable fixture pack drawn from WebBuilder tasks: retain a palette, preserve verified-email access, undo a rejected design, continue after a failed build, and switch between two projects with different requirements. Record the exact context assembled for each request. These fixtures let us compare the current runner, the small extension and a later SDK experiment using the same model.

After basic continuity works, add a stored summary with a covered-message cutoff and revision identity. Generate it at a safe turn boundary only when necessary. Keep the previous valid summary until a replacement is accepted. Count summary calls against the same spend budget.

Do not introduce a vector service or copy an SDK condenser class without its event dependencies. The first deliverable is a tested context contract. The next is compaction. A runtime migration is a separate decision with measured evidence.

## Anonymization mapping (revealed)

- Response A: The First Principles Thinker
- Response B: The Executor
- Response C: The Outsider
- Response D: The Expansionist
- Response E: The Contrarian

## Simulated peer reviews

### Reviewer 1

Strongest: B. It gives a staged implementation and a comparison path instead of treating a framework choice as proof of accuracy. Biggest blind spot: D. It has no demonstrated estimate for integration work or the deployed SDK footprint, so its maintenance advantage remains a hypothesis. All five missed the mismatch between our redacted, truncated activity events and full model/tool context. Replaying UI logs as tool messages would lose source detail and potentially break tool-call/result pairing. Define a separate safe context record; retrieve source from the exact revision rather than reconstructing it from activity text.

### Reviewer 2

Strongest: A. Its evidence boundary explains why a summary cannot become the source of truth. Biggest blind spot: E. Deferring compaction without defining what happens when raw history exceeds the budget may leave longer tasks permanently unusable. All five missed concurrent summary publication and deletion. A summary built at message N must not erase N+1, and deleting a project must remove its summaries and search records too. Store the covered message range and publish using a version check. A failed or cancelled summary job must leave the last valid context intact.

### Reviewer 3

Strongest: D. It challenges the assumption that a small custom layer stays small forever. Biggest blind spot: B. The suggested fixture pack could overfit five familiar examples and make an inadequate search strategy look complete. All five missed retrieval misses involving indirect references: “the other card,” renamed files and decisions represented only in screenshots. Define how unsupported visual context is disclosed, include held-out paraphrases, and compare retrieval independently from the coding model. Let measured misses decide whether lexical search needs a semantic supplement.

### Reviewer 4

Strongest: C. It defines the user-visible promise and distinguishes intent from attempted work. Biggest blind spot: A. Calling project requirements authoritative does not explain how they are extracted, corrected or protected from untrusted content. All five missed prompt injection through retrieved source or tool output. Keep those sources as data, never promote them into system instructions or user requirements automatically, and enforce authorization in server code. Persistent memory should start within one project, not learn arbitrary cross-user or cross-project preferences.

### Reviewer 5

Strongest: B. Its cutoff and revision identity make the plan implementable. Biggest blind spot: D. “Evaluate a minimal integration” can expand into a migration before there is a baseline. All five missed retention alignment and cache costs. Our diagnostics already expire; a summary pointing only to expired records becomes unauditable. Preserve source messages needed by active decisions within a defined retention policy, expose missing evidence, and remove derived records when originals are deliberately deleted. Measure total successful-task cost, including retrieval, summarization and cache invalidation, rather than promising savings from fewer visible tokens.

## Chairman synthesis

### Where the Council Agrees

Across the simulated perspectives, the priority is reliable continuation of user intent, not a leaderboard label. Durable files and activity are necessary but do not put previous decisions into the next model request. Preserve current execution limits, owner checks, cancellation and build/browser verification. Evaluate memory with realistic changes of mind, failed attempts and delayed follow-ups. Consensus in this single-model exercise is not independent corroboration.

### Where the Council Clashes

The Expansionist prefers evaluating OpenHands SDK integration now to avoid growing a home-built framework. The Executor and First Principles Thinker prefer a narrow context layer because it fixes the observed gap without changing runtime contracts. The Contrarian would defer automatic summarization until continuity is proven; the other implementation-oriented views accept it as a second stage. The chairman chooses the narrow layer first. SDK compatibility, operating footprint and maintenance savings have not been measured; there is no basis to promise either a cheap migration or a permanent advantage for custom code.

### Blind Spots the Council Caught

The review round identified six design requirements: activity logs are not complete model history; a summary needs a stable message cutoff and source revision; new messages must not be lost when a summary publishes; retrieved content is untrusted data; retention/deletion must cover summaries and search records; and lexical search may miss renamed files, indirect references or screenshot-only decisions. Summaries can hallucinate or drop constraints. Re-read current source and retrieve original evidence when a summary is insufficient. Compaction must preserve valid tool-call/result groups and run only between completed groups.

### The Recommendation

Use the existing FastAPI/OpenAI runner with a small project-scoped context layer. Borrow OpenHands' separation of durable history from the model-facing view and its threshold-based condensation pattern. Borrow Dyad's evaluation method for retained facts, obsolete decisions, invented paths and continuation quality. Do not install the full OpenHands SDK or depend on Dyad Pro in this first slice. Keep OpenHands SDK as the named alternative if the narrow layer grows into general agent infrastructure or fails equivalent evaluations.

Use PostgreSQL for a compact project brief, recent messages, summary metadata and project-scoped text retrieval; use the current revision's files as implementation evidence. GCS/MinIO remain artifact storage, not the memory search engine. Begin with explicit paths, file listings, bounded reads and PostgreSQL text search. No additional vector service, embeddings pipeline, Redis or autonomous memory agent initially.

The model input should contain trusted instructions, the latest user request, source-linked current project requirements, one validated summary of older work, a recent message window, relevant current files and unresolved checks. Label attempted work separately from verified outcomes. Requirements must be derived from explicit user instructions; assistant inference is labeled and never overrides the user. Keep provenance and a stable covered-message cutoff. Existing public activity logs remain diagnostic records; do not inject redacted/truncated logs as if they were the complete model transcript.

Implement cross-request context before automatic compaction. Then summarize completed older groups only when a token budget requires it, reserving capacity for tools and output. Keep the old summary until the new version publishes atomically; count compaction tokens and latency against the overall run budget. On summarizer failure, retain valid context and stop clearly if it cannot fit. Do not silently discard requirements. Keep scope to one owned project, and require corrective evidence or a clarifying question for ambiguous older references.

Select a compaction model using the same fixture pack and actual provider costs; this council does not pick a model based on another product's internal ranking. Measure useful-task success and cost including failed attempts and summaries. SDK adoption or semantic retrieval should require a measured advantage at those same tasks and budgets.

### The One Thing to Do First

Write a replayable WebBuilder context fixture pack and its expected-context contract before changing run_editor. Start with ten conversations covering early palette constraints, verified-email access, reversed decisions, named files, renamed files, ambiguous references, failed builds, server restart, project isolation and deletion. Include held-out wording variants. This is the first implementation deliverable, not an instruction to run paid evaluations now.

## Proposed acceptance criteria

Proposed acceptance, not measured results: no cross-project leakage, no resurrection of explicitly superseded requirements and no invented paths in the fixture pack; preserve all designated critical constraints in each repeated evaluation; retrieve the required current files and source messages; keep context inside its configured token budget; recover the same context after a restart; show no task-success regression against the same-model baseline. Record misses as well as averages. Run at least two model repetitions once explicitly authorized, and report the sample size. These gates do not establish general accuracy outside the evaluated tasks. Keep live persistence and E2B/GCS verification as separate prerequisites.

## Evidence references

- [OpenHands conversation persistence](https://docs.openhands.dev/sdk/guides/convo-persistence)
- [OpenHands context condenser](https://docs.openhands.dev/sdk/guides/context-condenser)
- [OpenHands optional persistent memory](https://docs.openhands.dev/sdk/guides/persistent-memory)
- [OpenHands April 2025 condensation experiment](https://www.openhands.dev/blog/openhands-context-condensensation-for-more-efficient-ai-agents)
- [Dyad compaction evaluation, merged PR 4128](https://github.com/dyad-sh/dyad/pull/4128)
- [Dyad Smart Context (Pro)](https://www.dyad.sh/docs/guides/ai-models/pro-modes)

Local evidence: `agent/runner.py:41` (fresh run context and stop budgets), `agent/service.py:248` (latest prompt passed to runner), `docs/persistence-setup.md` (actual browser proof and remaining limitations), `docs/architecture/persistence-proposal.md` and the 2026-09-13 persistence council (earlier storage decision). No application implementation, benchmarks, tests, cloud changes or pushes were performed by this council.

