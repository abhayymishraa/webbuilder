# LLM Council: WebBuilder orchestration

Five perspectives and five anonymous peer reviews simulated sequentially by the main assistant under the project's no-subagent rule. They are not independent model executions, and agreement is not independent empirical validation.

## Original question

Let's fix with the best approach, use LLM Council and Context7 to validate the answer, and update documentation and recommendations.

## Framed question

Which architecture should replace WebBuilder's unreliable orchestration, and what should be implemented now?

WebBuilder uses Next.js on Vercel, a one-worker FastAPI API on a 1GB Oracle Micro, Neon and E2B. Users generate and edit React JSX applications with a low-cost OpenAI model. An observed run produced 44 persisted tool starts (21 reads), then was cancelled by a five-minute incoming-WebSocket-message timeout while the UI stayed busy. Source defects include a no-op build test, unreliable dependency heuristics, failures labelled successful, tool-name matching instead of call IDs, nested broad editing loops, fragile double-encoded file batches and no persistent run status. Options are patching the existing multi-agent graph, replacing its loop with one bounded coding agent and deterministic checks, or adopting a larger existing agent platform. Preserve saved projects and credentials, minimize runtime and paid calls, support cancellation and reconnect, and avoid infrastructure expansion. Decide the smallest reliable implementation, failure semantics and evidence required. Current repository audit provides these observations; upstream patterns were researched in Dyad, bolt.diy, Open Lovable and OpenHands.

## Contrarian

The fatal risk is declaring the replacement reliable because it looks simpler. A single agent can still return success without changing anything, run destructive commands, hang inside a tool, or leave a half-written application. Replace the false validation first and make the release gate depend on actual evidence. Do not accept a model's finish statement as a successful build.

The runner needs explicit ownership: one active run per project, capped server capacity, and atomic admission before charging credits. Disconnecting a browser must not cancel a job accidentally. Conversely, a Stop button must stop the model and sandbox work, not merely hide the spinner. If the API restarts, mark abandoned runs interrupted instead of pretending to resume them.

Do not build a distributed queue or import a whole coding platform onto this machine. Persist run state in the existing database and retain the single-worker constraint. Bound shell operations and source writes. When cancellation leaves partial changes, disclose that and retain enough files to inspect or repair. The acceptance test is a broken build, cancellation during a command, and reconnection after completion—not another successful counter demo.

## First Principles Thinker

The product is a system that turns an intent into verified file changes. Planning, coding and reviewing are implementation techniques, not mandatory product stages. Our current architecture confuses a model finishing its conversation with the application being correct. The source of truth must be executable checks and a recorded run outcome.

Use one coding conversation that starts with the scaffold facts and relevant source. Give it typed read, write and bounded command tools. When it finishes editing, the host runs the build and checks the running preview. Feed concrete failures back into the same conversation, within one shared budget. An independent reviewer that blindly rereads every file has no special access to truth and duplicates paid work.

Separate execution from observation. The run owns its lifetime; WebSocket clients subscribe to durable events and can reconnect. Define each terminal state once and reuse it across backend and frontend. Every tool call needs identity, input summary, output status and duration. Keep the model configurable, but choose models later using measured successful-task cost. Replacing LangGraph is optional; a transparent loop is preferable here if it reduces hidden nested limits and makes the policies directly testable.

## Expansionist

The opportunity is to make reliability visible to users. A clear activity timeline, working cancellation and a verified preview would distinguish this product more than another elaborate agent persona. Turn each run into a small, inspectable artifact: requested change, affected files, build result, preview result, resource usage and final state. That also creates the data needed to improve prompts and model selection cheaply.

A single bounded editing agent is the right initial core, but design its events so replay and a richer timeline are possible. Use versioned tool results and stable IDs now. Store short diagnostics instead of dumping entire source files into the chat. Users should see Creating files, Checking build, Repairing a specific error and Ready, with technical details available on demand.

Keep the hosted infrastructure. E2B can perform build and browser checks away from the tiny API VM. The tempting expansion is automatic model escalation, project snapshots and benchmark dashboards. Do not ship all of that in this change. First collect truthful outcomes and token usage, then use that evidence to decide whether selective escalation improves successful-task cost. A broad migration to a mature upstream platform would delay this feedback loop.

## Outsider

From the user's perspective, the current page breaks a basic promise: it says work is happening when the server has already stopped. Fix that contract before celebrating fewer tool calls. I need to know whether my request was accepted, whether it is still working, whether I can stop it, and whether the preview was actually checked. I do not need to read an architecture JSON dump.

The interface should display one stable activity row per actual tool operation and one unambiguous result per run. A lost connection should say reconnecting, not failed or finished. Reopening a chat should show the latest recorded state. If a run is interrupted by a deployment, explain that it did not finish and offer a fresh request; do not silently replay changes.

Keeping the same model is fine while these observable defects are repaired. The decision between frameworks is invisible to users. The important evidence is that Stop works, failed commands look failed, credits are not consumed for rejected requests, existing projects remain accessible, and the same run has the same story before and after refresh. Avoid making an installation or a larger paid platform the user's problem.

## Executor

Implement a vertical slice rather than patching every old agent node. Keep authentication, project storage and deployment plumbing. Introduce an additive Run record with bounded event history. Make a single admission function enforce ownership, one run per chat, server capacity and credit consumption in one transaction. Start execution immediately after commit, independently of any browser connection.

Replace the planner-builder-validator graph with one explicit tool loop using the already installed OpenAI integration. Typed batches replace JSON-inside-JSON. Execute writes serially, track repeated unchanged calls, and enforce global turn, call, token and elapsed limits. The host runs a real build and preview check after editing and permits two targeted repair passes.

Update the frontend protocol and Stop button in the same change. Reconnect fetches durable state; event IDs prevent duplication. Termination is persisted before it is reported. Startup marks orphaned runs interrupted. Add focused tests around these contracts with fake model and sandbox adapters so most verification costs nothing. Perform one bounded live run only after the local failure cases pass. Update the E2B template only if browser verification requires a missing dependency, and document rollout and rollback compatibility.

## Anonymous peer review mapping

{"A": "Outsider", "B": "Executor", "C": "Contrarian", "D": "Expansionist", "E": "First Principles Thinker"}

### Review 1

Strongest: B, because it connects admission, execution, persistence and UI into a shippable change. Biggest blind spot: D risks turning this into a telemetry product before the run contract is correct. All five missed the transaction boundary between accepting a run and starting an in-memory task. A crash between those operations must leave a recoverable interrupted record, and deployment must not run two workers that both claim ownership.

### Review 2

Strongest: E, because deterministic evidence is the right definition of success. Biggest blind spot: B underestimates browser-check provisioning and the difference between receiving HTML and executing React. All five missed explicit verification labels: build passed and browser smoke passed are separate facts, and neither establishes that every requested feature works. The UI must not overclaim.

### Review 3

Strongest: A, because it defines an understandable contract for the user. Biggest blind spot: E leaves cancellation semantics underspecified. All five missed what happens to a sandbox command when the Python coroutine is cancelled. Cancellation must terminate the sandbox workload or its process, and the system must explain partial files rather than promising rollback it does not implement.

### Review 4

Strongest: C, because it challenges both the green-path test and silent partial writes. Biggest blind spot: D's stable artifacts could become an unbounded event store. All five missed bounded retention and context growth: truncate tool output safely, limit event count and context tokens, and never inject backend credentials into generated-code execution or copy secrets into logs.

### Review 5

Strongest: B, because it names testable boundaries and sequence. Biggest blind spot: C could overcorrect into restrictions that block legitimate npm installs and application fixes. All five missed backward compatibility: existing chats contain legacy event names and saved file manifests. Keep reading those histories and files, and give the additive database migration a rollout order that works with the previous deployment. Measure actual task outcomes before tuning arbitrary budgets.

## Where the Council Agrees

Use one bounded coding agent with real host-controlled checks. Separate job lifetime from browser lifetime, persist terminal state, identify individual tool calls, preserve existing infrastructure, and test failures before a live happy path. These are convergent simulated perspectives, not independent experimental evidence.

## Where the Council Clashes

The First Principles perspective favors a transparent explicit loop; the Executor emphasizes minimizing churn. Choose a small explicit loop around the existing ChatOpenAI integration because the current graph's nested reviewers obscure budgets. The Expansionist favors richer run artifacts; the Contrarian warns against scope growth. Persist only the state and bounded events needed for recovery, diagnosis and usage now.

## Blind Spots the Council Caught

Admission/start crash windows, external command cancellation, actual browser execution, bounded event storage, legacy histories and partial-write semantics need explicit decisions. Deployment uses one worker; startup marks nonterminal old runs interrupted. Cancellation kills that run's sandbox and reports cancellation, without promising to roll back partial changes. Successful builds require a real preview check; verification limitations stay visible.

## The Recommendation

Implement a single-owner Run service, bounded typed tool loop, deterministic build and browser smoke checks with at most two repairs, and one durable event protocol consumed by the frontend. Keep the current low-cost model configurable. Add an additive schema migration, credit-safe admission, explicit cancellation, reconnect recovery, token/call/time budgets, read deduplication, source-preserving writes, truthful failure reporting and redacted logs. Update docs with defaults and limitations. Do not add a distributed queue or migrate hosting.

## The One Thing to Do First

Define and implement the persisted Run lifecycle and its admission/terminal-state contract; route both initial generation and follow-up edits through it.
