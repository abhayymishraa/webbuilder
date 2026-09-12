# Run orchestration

Decision date: 12 September 2026. Keep Next.js/Vercel, one FastAPI worker on Oracle,
Neon and E2B. Replace the planner/builder/validator graph with one coding conversation
and host-controlled verification. No queue service, extra VM, automatic model
escalation or broad second editing agent is required for the current workload.

The [audit](../research/2026-09-12-orchestration-audit.md) ties the original defects to
source and production logs. The [Council report](../council/council-report-2026-09-12-orchestration.html)
and [transcript](../council/council-transcript-2026-09-12-orchestration.md) explain the
tradeoffs. The five Council perspectives and peer reviews were simulated sequentially
by one assistant, following the repository's no-subagent instruction. They are not
independent model validation; executable regressions provide the implementation evidence.

```mermaid
flowchart TD
    A[Authenticated HTTP request] --> B[Admission and credit transaction]
    B --> C[Persist running record]
    C --> D[One coding conversation in E2B]
    D --> E[Production build and browser smoke]
    E -->|Failure, at most two repairs| D
    E -->|Pass| F[Save source and persist succeeded]
    D -->|Stop, timeout, error or limit| G[Clean up sandbox and persist terminal state]
    C -.-> H[WebSocket observer and reconnect snapshot]
    F -.-> H
    G -.-> H
```

## Execution and stopping

`agent/service.py` owns tasks independently of WebSocket connections. Admission
checks ownership, server capacity and one active request per chat before consuming
a credit. The user row is locked and the credit, request and run are committed in
one transaction. This ownership model requires exactly one API worker.

`agent/runner.py` starts with scaffold facts, relevant files and a file list. It binds
three typed tools: `read_files`, `write_files`, and `execute_command`. Reads are cached
until mutation; writes preserve Unicode and escapes and execute serially. Tool events
carry a model call ID, success/error and duration. The old dependency scanner, nested
editing agents, fake build tool and LangGraph dependency have been removed.

| Control | Default |
| --- | --- |
| Concurrent runs | 2 (`MAX_CONCURRENT_RUNS`) |
| Whole execution deadline | 600 seconds (`RUN_TIMEOUT_SECONDS`) |
| Model turns | 16 (`RUN_MAX_TURNS`) |
| Tool calls | 32 (`RUN_MAX_TOOL_CALLS`) |
| Cumulative provider tokens | 100,000 (`RUN_MAX_TOKENS`) |
| Targeted repair passes | 2, within the same budgets |
| Identical operations | Stop before the third; reads reset after mutation |
| Model request | 90 seconds, one retry, 8,192 output-token cap |
| Tool / build / browser command | 60 / 90 / 45 seconds |
| Sandbox expiry | 20 minutes, extended when reused for a new run |

Measured usage is combined with conservative pre-call context estimates. This is a
cost guard, not a guaranteed dollar cap or tokenizer-exact preflight. Context, file,
batch, file-count and event-count limits bound memory. OpenAI/E2B remain metered.

Terminal states are `succeeded`, `failed`, `cancelled`, `timed_out`, `interrupted`.
Stop cancels the task and kills its sandbox. Ordinary failure attempts a source save
for up to 15 seconds before killing it; Stop/timeout skip that extra save. Cleanup
has a ten-second allowance beyond the execution deadline. If killing fails, the
terminal reason discloses reliance on sandbox expiry. An allocation interrupted before
the provider returns its sandbox ID can likewise survive until expiry. Cancelling a
provider request does not promise refunding tokens already generated.

## Persistence and observation

`runs` is additive: prompt, status, bounded JSON events, metrics, reason and timestamps.
At most 200 activity events plus one terminal event are retained per run. Events stream
immediately and are checkpointed at model/stage boundaries; a crash can lose events
after the last checkpoint. Final state, event log, chat preview URL and final message
commit together before completion is broadcast. Startup and snapshots reconcile
orphaned `running` records to `interrupted`. There is no automatic resume.

The WebSocket history snapshot includes the latest 200 messages and 10 runs.
Older terminal messages remain in chat history, subject to that message window.
Slow observers receive `resync` instead of blocking execution. Stable run/tool IDs
make replay idempotent; late activity cannot restart a completed run's spinner.

| Endpoint | Purpose |
| --- | --- |
| `POST /chat` | Create a project and admit its first run |
| `POST /chats/{id}/runs` | Admit a follow-up request |
| `GET /chats/{id}/runs` | Fetch owned run snapshots |
| `POST /runs/{run_id}/cancel` | Stop an owned active run; safe to repeat |
| `WS /ws/{id}` | First frame `{"type":"auth","token":"BEARER_TOKEN"}`, then observe |

Admission returns `chat_id`, `run_id`, `status: running`, `tokens_remaining`.
WebSocket clients can send `{"type":"resync"}`; prompts are submitted over HTTP.
JWTs are absent from URLs. File, download, status and cancellation routes enforce
ownership. Activity logs contain run IDs, sequence, status and resource counts;
unexpected errors log their exception class without raw provider requests or secrets.
Detailed bounded tool/check diagnostics are available in the owned run snapshot.

Source snapshots use `projects/<chat>/files/<relative path>` with version-2 metadata.
Legacy flat snapshots are readable. Individual files and metadata are replaced
atomically, but a whole snapshot is not a transactional filesystem revision. Partial
save failures can leave a mixed snapshot. Binary assets and oversized source files
are not archived. Downloads currently require an active sandbox. Preview URLs expire
with the sandbox; restoring source for another request creates a new preview.

## Verification and evidence

After the model stops requesting tools, the host executes `npm run build`, then a
bundled Playwright checker at desktop and mobile sizes. It checks HTTP success,
React rendering, absence of Vite overlays and uncaught page errors. Failed checks
feed specific diagnostics into at most two repairs. It does not prove every requested
feature, accessibility, layout quality or protection against adversarial generated code.
Generated package scripts execute inside E2B and are not a security attestation.

Verified locally on 12 September:

- 17 backend regressions: typed files, real failure propagation, repair/repetition
  limits, cancellation before start/during restore, timeout, slow observers, ownership,
  credit preservation, WebSocket reconnect/authentication and restart reconciliation.
- Four frontend event regressions, TypeScript and the Next.js production build.
- Production Docker image build; CI runs the provider-free tests inside that image.
- One real OpenAI/E2B counter request: two model turns, one `write_files` tool call,
  2,791 total provider tokens, about 32.5 seconds, successful build and both browser
  render checks. Final state survived reconnect. The test sandbox was killed afterward.

The live check used the new local API and an isolated database. It does not prove
deployment, general cost improvement, feature correctness or reliability under load.
The original 44-call search-page request and this counter are different tasks and
must not be presented as a comparative benchmark. Next useful evaluation: a fixed
small set of creation, edit and broken-build tasks, scored by feature assertions,
completion rate, latency and actual provider cost before changing models again.

For database regressions, create an isolated PostgreSQL database named `webbuilder_test`:

```bash
export DATABASE_URL=postgresql://postgres:LOCAL_PASSWORD@localhost:15432/webbuilder_test
uv run python -m db.migrate
RUN_DATABASE_TESTS=1 uv run python -m unittest discover -s tests -v
```

Never point integration tests at production. Without the opt-in flag they skip DB
tests and exercise the provider-free runner tests. The deployment workflow mounts
tests temporarily into the runtime image; tests and browser binaries are not shipped
to the Oracle VM. Browser dependencies live only in the E2B template.

## Sources and decisions

The audit links pinned upstream code from Dyad, bolt.diy, Open Lovable and OpenHands.
Their useful patterns are explicit execution identity, cancellation, bounded repair
and stuck detection. We implemented those concepts without copying their larger
hosting systems. Context7 documentation was consulted for
[LangChain tool calls](https://docs.langchain.com/oss/python/langchain/models),
[FastAPI lifecycle](https://fastapi.tiangolo.com/advanced/events/),
[AnyIO cancellation cleanup](https://anyio.readthedocs.io/en/stable/cancellation.html),
and [Playwright browser installation](https://playwright.dev/docs/browsers).
