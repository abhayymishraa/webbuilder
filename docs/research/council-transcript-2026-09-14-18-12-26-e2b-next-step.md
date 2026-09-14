# E2B next-step council

Date: 2026-09-14 18:12:26 UTC

## Method and limitations

Five advisor perspectives and five critique perspectives were simulated sequentially by the main assistant, following the repository's instruction to run subagent work in the main thread. No independent agents or distinct models were used. A–E labels were randomized before the critique round, but the same assistant knew the mapping; this was not a truly blinded review. Agreement is a reasoning aid, not independent validation.

Research decision only. No application code changed; no checks, generation calls, E2B calls, template builds or deployment were executed. Existing combined changes remain unverified. This report reuses the current documented research; it does not assert a new exhaustive documentation audit.

## Original question

“Using Karpathy guidelines, tell me what we should do now according to all this research, then run LLM Council.”

## Initial Karpathy assessment

Karpathy assessment before council: finish and validate the smallest existing change set before expanding scope. Treat browser observation as a candidate improvement, not an automatic bundle of screenshots, clicks and typing. Preserve existing durable ownership/revision safeguards. Define observable outcomes and measure costs before claiming improvement.

## Neutral framed question

What should WebBuilder prioritize next after its E2B and open-source harness research? Rank now, next and defer, with one concrete first action and observable success criteria.

Context: WebBuilder generates React/Vite/Tailwind apps and previews them in E2B. Reported problems include token-budget exhaustion, broken visual output, stale previews and sandbox expiry. Current local uncommitted work adopts E2B 2.49.1 native lifecycle, bounded command handles, compressed file operations and native template building/tagging; it also includes preview inspection and usage instrumentation. The current combined changes have not been verified or deployed. Latest permission leaves checks unrun. There are no measured cost or quality improvements.

The existing inspect_preview uses installed Playwright for bounded text/errors and viewport/revision attribution; it cannot exercise UI interactions or return model-visible screenshots. Adding screenshots needs actual image message support, a capable model, budget limits and privacy controls. Browser actions may trigger external writes even from localhost.

Research at fixed commits inspected OpenHands software-agent-sdk file/terminal/browser/task tools and OpenCode read/edit/grep tools. They suggest patterns, not evidence of WebBuilder benchmark improvement. Native E2B covers execution, filesystem transport, lifecycle, templates, Git and metrics; it does not supply semantic editing, DOM interaction or our ownership/revision policy. Git integration is available but our starter lacks initialized Git history and archives exclude .git. File watchers can miss events. Volumes persist partial edits and would change rollback semantics; current intended durable store is immutable GCS revisions in production and MinIO locally. Some identity/telemetry features require private-beta or Enterprise access.

Options include validating existing changes; bounded browser evidence/actions; on-demand host diagnostics; Git import/export; targeted read/search/edit tools; persistence migration; or no additional features. Previous custom source-navigation tools were explicitly removed by the user, so do not silently restore them. Prefer minimal cost-aware changes. No test suites may be created in this repository. Lint, builds and manual/local/live checks require explicit approval. This council is advisory and cannot authorize implementation, checks, paid calls or deployment.

## Advisor responses

### The Contrarian

The fatal risk is treating a successful SDK migration as a successful product. The current change bundle is unverified, and it spans commands, writes, lifecycle, templates and reporting. Each boundary can fail independently. Adding browser actions now expands the number of explanations for the next broken run.

Now: establish whether the current candidate preserves the last known good project when a write, command or connection fails. Confirm which exact build the preview serves. A process running and an HTTP 200 are inadequate evidence; a stale page can satisfy both.

Next: collect failure-triggered diagnostics through existing E2B metrics and lifecycle APIs only where current evidence cannot explain a failure. Keep those observations outside the normal model prompt.

Defer browser actions, Git and storage migration. Optional screenshots may eventually be useful, but introducing another expensive observation does not establish better decisions. First demonstrate that the failure is visual rather than stale source or exhausted budget.

The first action is to define one acceptance sheet for the existing candidate, including interrupted writes, command disconnects and edit-to-preview identity. Seek approval before executing it. Stop on an integrity failure; do not compensate with more tool calls.

### The First Principles Thinker

The objective is a correct, editable application at an acceptable cost. Tool count and native SDK coverage are intermediate choices. The actual loop is: understand a request, change the right source, observe the resulting application, preserve a recoverable result. Research should improve whichever link currently fails.

Now: separate the reported failures into three categories: execution or persistence failure, insufficient application observation, and budget allocation failure. Existing records may already distinguish them. Do not assume all three share a remedy. Validate the native migration against the first category before expanding the second.

Next: if the served revision is correct but visual defects remain invisible to the agent, add an optional screenshot to the current inspection tool. Start with observation only. Clicking and typing are a separate capability with different side effects and correctness criteria.

Defer Git and storage changes until a specific user workflow requires them. Reintroduce targeted editing only after a new explicit decision and evidence that whole-file traffic dominates costs.

First produce a baseline record for one representative failing workflow and the exact candidate revision. Success means observable source-to-preview agreement and itemized input, cached input, output, elapsed time and termination reason. One record diagnoses; repeated comparisons are needed to establish improvements.

### The Expansionist

The largest upside is giving the agent evidence of the interface it actually produced. A build can succeed while spacing, contrast or an important interaction remains wrong. OpenHands demonstrates that browser state and optional images can form part of an agent loop. That is the useful pattern to borrow, not its entire browser tool catalog.

Now: specify a small visual-observation experiment alongside the existing migration acceptance work. Define the image transport, maximum dimensions, allowed inspection count and source revision attached to each observation. Implementation and execution remain contingent on approval and the migration passing its checks.

Next: introduce one optional screenshot mode in inspect_preview. Compare the same small set of requests with and without the observation. Hold model, template and budgets constant. Record visible defects resolved, extra model input, total cost and completion time. Human assessment must decide whether the resulting interface improved; screenshots alone prove nothing.

Bounded interaction should follow only if specific failures require exercising controls. Defer arbitrary browsing, persistent browser agents, storage migration and Git administration.

First write the experiment's success and stop conditions. Require a demonstrated quality benefit that justifies its measured overhead. Otherwise keep the simpler inspection path. A useful visual loop could improve the product more than adopting several infrastructure features.

### The Outsider

A user sees a finished app or a failed app. They do not see which vendor method handled the files. The immediate credibility problem is whether “complete” means the latest work is visible and usable, and whether “needs attention” explains what survived.

Now: inspect the acceptance criteria through that experience. After editing, opening the project should display that edit. After an interruption, the user should still know which version is saved. After a budget stop, the interface should not imply that unfinished work was fully checked. These outcomes matter more than the breadth of E2B support.

Next: improve the evidence behind those statuses before adding more visible features. Diagnostics should help explain failures; they should not create a confusing stream of provider details in chat. Visual observation becomes useful once the product consistently serves the right version.

Defer Git, volumes and networking administration unless a user needs a workflow they enable. I would not judge priority by repository stars.

The first action is a short acceptance walkthrough written in user language: edit, reopen, interrupt and recover. Map each expected outcome to the source revision and durable state. Run it only with permission. Passing that walkthrough would establish a narrow reliability claim, not universal design quality.

### The Executor

Freeze the feature list for this pass. The fastest path is to finish the native E2B candidate already on disk and leave unrelated work alone. Record the candidate commit or a reproducible patch identity, SDK version and immutable template build reference. Without that, later observations cannot be tied to the code being discussed.

Now: prepare a compact manual acceptance checklist for create and readiness, file update to fresh preview, disconnect without command replay, pause and resume, and failure without publishing an invalid revision. Specify local checks separately from quota-consuming E2B checks. Ask for the required approval only when the exact commands and scope are ready.

Next: run approved checks, repair only demonstrated defects, then request an explicitly authorized staging rollout with a rollback reference. Record latency, termination reason and token usage wherever an actual generation is included. An E2B-only check cannot establish model costs.

After that, choose one addition from observed failures. Default to optional screenshot inspection when visual defects are the demonstrated gap; use host diagnostics when lifecycle failures are unexplained.

Defer storage migration, Git and reinstated editor tools. First create the candidate-specific acceptance sheet. Do not build a permanent benchmark framework or new test suite for this decision.

## Anonymous response mapping

- Response A: The Outsider
- Response B: The Executor
- Response C: The Expansionist
- Response D: The First Principles Thinker
- Response E: The Contrarian

## Simulated peer critique round

### Reviewer perspective 1

Strongest: D. It distinguishes budget exhaustion, stale execution and unseen visual defects instead of prescribing one feature for every failure.
Biggest blind spot: C. A screenshot experiment is premature without confirming the model transport accepts image observations and the task has enough remaining budget to use them.
What all missed: cached-input billing and the application's token admission counter are separate. Cache savings need provider usage evidence; a budget stop needs the counter and termination path. Cheap tokens can still consume a configured token allowance. Diagnose both before promising cost relief.

### Reviewer perspective 2

Strongest: B. It ties verification to a reproducible candidate and separates E2B-only checks from model-cost measurement.
Biggest blind spot: E. Waiting for diagnostics to become necessary can leave the acceptance exercise unable to explain a failure. Reuse already available logs and identifiers from the beginning, adding code only for an observed evidence gap.
What all missed: template/SDK compatibility is not only a Python package version. Record the template build, environment daemon and browser dependencies actually exercised. Never replace the production tag during a diagnostic run.

### Reviewer perspective 3

Strongest: A. Its acceptance criteria match what users experience rather than internal green checks.
Biggest blind spot: B. “Staging rollout” assumes an available isolated staging environment and hides operational work. First establish the real deployment topology, then choose an isolated check without touching production.
What all missed: reopening must be checked through the application's ordinary route, not just a direct sandbox URL. Correct source in one sandbox does not establish that the user sees that sandbox. Attribute the project, run, durable revision, sandbox and displayed preview together.

### Reviewer perspective 4

Strongest: C. It identifies a product-quality opportunity and requires a comparison instead of assuming benefit.
Biggest blind spot: D. A single failing workflow can diagnose a cause but cannot rank failure frequency or prove the right next investment. Examine available recent failures before choosing the representative case.
What all missed: screenshot capture itself can expose project content, and page loading can issue external requests without clicks. Bound inspection origins and data retention, consider allowed destinations, and distinguish a visual check from a guarantee of no external side effects.

### Reviewer perspective 5

Strongest: E. It refuses to trade data integrity for an apparently successful run.
Biggest blind spot: A. A friendly status is not enough if the system has already persisted partial work under a misleading revision. The acceptance record needs an explicit known-good revision before and after the injected failure.
What all missed: verification-only code and infrastructure can become another project. Use a short manual record and disposable scratch data, respecting the no-test-suite rule. Record unsuccessful cases and operator cleanup as well as happy paths. Define the point at which a new feature is abandoned, not merely the point at which it ships.

## Chairman verdict

### Where the Council Agrees

Finish the existing native E2B migration before adding more tools. Keep the small WebBuilder layer that enforces ownership, budgets, output limits and durable revision rules. Native transport does not replace these application guarantees. Preserve immutable GCS/MinIO revisions. Repository popularity and advisor agreement do not establish task success or cost savings.

### Where the Council Clashes

The Expansionist prioritizes visual observation after migration acceptance; the Contrarian prioritizes failure-triggered diagnostics. Resolve this using evidence from actual failures: a correct served revision with unseen visual defects supports optional screenshots; unexplained command/lifecycle failures support on-demand diagnostics. Do not automatically implement both. Planning the visual experiment now is reasonable; implementing it is a separate decision.

### Blind Spots the Council Caught

Treat token-budget termination and cached-input billing as separate measurements. Verify the normal application route, not only the sandbox URL. Record the candidate, template build and project/run/revision/sandbox identities together. Do not assume an isolated staging environment exists. Screenshot transport, content exposure and page-triggered external requests need deliberate handling. These critiques were generated by the same model with letter-labeled answers; they are not truly blinded independent peer reviews.

### The Recommendation

Now: freeze additional feature scope and prepare approval-ready acceptance for the current native migration. Once authorized, check creation/readiness, edit-to-preview freshness, command disconnect without replay, pause/resume and preservation of the known-good revision after partial failure. Repair demonstrated defects only. Next: choose one evidence-driven extension. Prefer optional screenshot observation in inspect_preview when visual feedback is the verified gap, with real image message support and strict budgets. Add click/type actions only later for demonstrated interaction failures. Use native metrics/lifecycle diagnostics on demand when runtime evidence is insufficient. Defer Git until import/export is needed, storage migration until measured storage requirements justify it, and restored search/edit tools until separately requested.

### The One Thing to Do First

Create a candidate-specific acceptance record for one previously failing project, with the current code/patch identity, immutable template reference, expected visible edit and expected saved revision after interruption. Prepare the exact local and E2B commands and their cost/side-effect scope before seeking verification approval. Do not execute them under the current instruction to leave checks unrun.

## Proposed acceptance scope (not executed)

- **Create and readiness:** Correct immutable template reference; expected app process becomes ready; no production tag changed.
- **Edit and reopen:** A distinguishable source change is visible through the normal project route, linked to the expected run, revision and sandbox.
- **Command disconnect:** No automatic replay of a possibly completed command; unknown state is reported and does not publish an invalid revision.
- **Pause and resume:** Existing project resumes with the intended files and a usable preview; record latency and recovery path.
- **Partial failure:** Previously known-good durable revision remains identifiable and recoverable; partial changes are not labeled fully verified.
- **Cost and budget, separately authorized:** A real model run records input/cached input/output, termination reason, token allowance and total latency. E2B-only checks cannot prove model savings.

This is a scope sketch, not authorization or an executable runbook. Exact candidate identity and commands must be prepared from the checkout before approval. No permanent test suite or benchmark framework is proposed.

## Sources

- [Local research and SDK/repository evidence](e2b-capability-map-2026-09-14.md)
- [E2B template readiness](https://docs.e2b.dev/template/start-ready-command)
- [E2B tags and versioning](https://docs.e2b.dev/template/tags)
- [E2B metrics](https://docs.e2b.dev/sandbox/metrics)
- [E2B lifecycle events](https://docs.e2b.dev/sandbox/lifecycle-events-api)
- [OpenHands browser tool implementation (pinned)](https://github.com/OpenHands/software-agent-sdk/blob/ccde94913e4f95bdb6df196853a8c09f8b1ab834/openhands-tools/openhands/tools/browser_use/definition.py)
- [OpenCode tool source (pinned)](https://github.com/anomalyco/opencode/tree/a74c472ffb941e6b027e5348be50cfe2225c6c56/packages/core/src/tool)

