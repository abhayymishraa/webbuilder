# E2B starter council

Method: five perspectives and five letter-based peer reviews simulated sequentially by the main agent, following the project tool mapping. These are not independent agents or model votes; anonymity cannot remove the main agent’s prior knowledge.

## Original request
Upgrade E2B template with current stable versions, Tailwind and commonly needed design/animation setup; use council and Karpathy guidelines.

## Framed question
Which stable, preconfigured E2B starter dependencies and conventions should WebBuilder include to improve generated designs without repeated installation, excessive bundle weight, or breaking existing projects?

User requires Tailwind and asks about Framer/Motion and useful prebuilts. Existing template uses Node 22, create-vite 9.2.1, Tailwind 4.3.3 with its Vite plugin, React Router, React Icons, separate Playwright/Chromium, JSX, and port 5173. Some packages and generated scaffolding float. Agent already receives package facts. Saved revisions retain template_id. Current registry reports React 19.3.0, Vite 8.3.0, plugin-react 6.1.1, Tailwind 4.3.3, Motion 13.2.0, Router 7.18.3, React Icons 5.7.0, Playwright 1.63.0, Oxlint 1.82.0. Node latest LTS is 24.21.0. Official current create-vite React starter uses Oxlint. No test files allowed by AGENTS; build/lint/manual browser and E2B smoke authorized. Keep 1 CPU/1024MB unless evidence demands more. Protect archive/preview paths and do not upgrade existing project files silently.

## Contrarian
The premise is partly wrong: Tailwind is already installed and configured. Installing more packages will not make the model preserve the CSS entry point or choose coherent spacing. The actual defects in this starter are uncertainty about the generated files and unpinned dependencies. Remove scaffolding at image-build time. Commit the small application skeleton and lock its dependency graph so two builds start from the same application inputs.

Do not interpret “always latest” as downloading arbitrary new versions every time somebody starts a project. That moves upgrade failures into paid user runs. Resolve stable releases during an intentional template update, keep the exact versions and lockfiles, and publish a new template only after a build and browser smoke.

Motion is reasonable as one installed option, but do not import it into every app or add automatic animation wrappers. Keep React Icons rather than adding a second interchangeable icon library. Defer charts, Three.js, complex component kits and state libraries. Most simple pages need none of those. The acceptance standard should be a reproducible starter with working Tailwind and accessible interaction, not a longer package list. Existing saved projects must continue using their recorded template and dependencies.

## First Principles
The template should eliminate repeated setup decisions, not make design decisions for the user. Its responsibilities are a predictable entry point, installed primitives, a functioning CSS pipeline and a stable preview process. Typography, colors, density and animation remain consequences of the actual prompt and the selected design guidance.

Own package.json, its lockfile, index.html, main.jsx and the Vite configuration. Keep the current React JSX architecture and route entry so the harness does not need new path inference. Define neutral semantic color variables in a Tailwind v4 @theme mapping and put base element defaults inside @layer base. This avoids high-priority global CSS fighting generated utilities. Provide visible keyboard focus and respect reduced motion when animation is requested.

Preinstall one animation package, Motion, because animation is an explicitly requested recurring capability. Do not force its runtime into the initial page. Router and React Icons already belong to this product’s conventions. A class-name merger is only useful after real shared components need merging; it is not a prerequisite for Tailwind.

Precise agent guidance matters as much as the image: preserve @import tailwindcss, use v4 syntax, inspect installed versions, avoid reinstalling existing tools, and use Motion only if present in the current project. This last condition keeps old templates compatible.

## Expansionist
A prepared starter can reduce the agent’s setup work and let it spend more of the run on the requested interface. Motion offers layout, presence and scroll primitives in one ecosystem, making it a stronger default option than separately adding several animation engines. Install it in the image and document its motion/react import path so the agent does not waste calls guessing the old package name.

The larger opportunity is consistent composition. A semantic token layer lets the agent change a palette at one location and reuse background, foreground and accent utilities across a page. An import alias lets future reusable components move without long relative paths. These small conventions can improve generated code without imposing a visible template aesthetic.

A full prebuilt component kit could improve dialogs, menus and forms, but it also introduces a large contract and another styling system. Treat that as a later evidence-driven addition. Start with the primitives already used by WebBuilder, then inspect real generation logs for repeated missing-package installs before enlarging the starter. Do not assume reduced generation latency merely from installation; measure comparable runs after rollout. Keep the initial screen minimal so it remains obvious when no actual user interface has been generated.

## Outsider
A user asking for Tailwind probably means “make the designs come out right without spending the run repairing setup.” The report should state plainly that Tailwind already exists. The proposed change should make that setup dependable and easy for the agent to use, not claim to unlock something entirely absent.

The package names are less useful than their jobs: React renders the app, Vite serves it, Tailwind styles it, the router connects pages, icons provide familiar symbols, and Motion handles requested animation. Anything without a clear role in common projects should stay out. Avoid competing icon and animation packages because they increase the chance that examples use an unavailable import.

Explain the rollout distinction. Updating Dockerfile on a laptop does not update the E2B cloud template. Building a template does not automatically change the running backend’s environment. Existing projects should not suddenly inherit a new set of dependencies when reopened. A successful report must separate source changes, local checks, the cloud template build, smoke-check results, and activation.

The default styling should be neutral and readable. Do not make every generated app orange and black merely because WebBuilder’s own interface uses those colors. Preserve keyboard access and let each project choose its design.

## Executor
Replace npm create vite in the Dockerfile with copies of a checked-in starter manifest and lockfile, followed by npm ci. Keep /home/user/react-app and port 5173 exactly as the runtime expects. Copy source only after dependency installation so source changes do not invalidate the dependency layer. Use a pinned Node LTS image and a separate locked Playwright package under /opt/webbuilder-checks.

Ship Tailwind’s official Vite plugin and CSS import, React Router, React Icons and Motion. Keep the JavaScript starter and the current Vite React plugin. Follow the current published Vite template’s Oxlint setup rather than introducing ESLint independently. Avoid feature-specific packages and generated component directories.

Add explicit main.jsx and index.html; keep Ready to build so the existing host gate can distinguish the starter from a completed generation. Provide a short starter README explaining imports, Tailwind v4 conventions, optional Motion usage and the installed package contract. Add matching conditional guidance to the host prompt so older projects are not told they already have Motion.

Run npm ci, lint and build locally; inspect responsive Tailwind output and an isolated Motion example without generating code. Build a new named E2B template, create one disposable sandbox, confirm its versions and browser tools, then terminate it. Record the resulting ID and activate it locally only after checks pass.

## Anonymous mapping (revealed)
{'A': 'Outsider', 'B': 'Expansionist', 'C': 'Contrarian', 'D': 'Executor', 'E': 'First Principles'}

### Peer review 1
Strongest: D makes the rollout executable and preserves the runtime contract. Biggest blind spot: B suggests alias and tokens without distinguishing optional convention from additional runtime. All responses need to distinguish npm reproducibility from full-image reproducibility: an exact Node tag and lockfiles do not pin Debian packages or the tag digest.

### Peer review 2
Strongest: E identifies model guidance and CSS layering as the actual contract. Biggest blind spot: C risks undersupplying animation despite an explicit recurring request. All responses should preserve the old-template path: new global instructions must be conditional on package.json, because saved revisions keep earlier template IDs.

### Peer review 3
Strongest: A exposes the difference between source, image, activation and deployed behavior. Biggest blind spot: D could read a smoke pass as proof of design quality. All responses need an honest verification boundary: no paid generation means this can validate tooling, not prove prompt adherence or lower generation latency.

### Peer review 4
Strongest: C directly rejects dependency inflation and explains controlled upgrades. Biggest blind spot: B’s design-consistency argument might accidentally hard-code WebBuilder branding. All responses should require neutral tokens, no starter animation, and avoid global style overrides that defeat utilities.

### Peer review 5
Strongest: D has a bounded implementation plan. Biggest blind spot: E’s alias addition can create documentation drift if it is not configured in both Vite and editor tooling. All responses missed operational cleanup detail: only the disposable smoke sandbox should be killed, and no current user sandbox or existing template should be changed.

## Chairman synthesis
## Where the Council Agrees
Own the starter files, pin application dependencies and lockfiles, keep the existing JSX/router/preview contract, and retain Tailwind’s official Vite integration. Add Motion as an installed capability, not a mandatory animation layer. Keep React Icons; defer extra UI kits and feature-specific packages.

## Where the Council Clashes
The Expansionist favors aliases and reusable design conventions; the Contrarian favors the smallest baseline. Adopt neutral theme tokens because they directly improve Tailwind composition. Defer an alias and generic component/helper library until a concrete caller requires them. No speculative cn helper, second icon package, charts or 3D engine.

## Blind Spots the Council Caught
Lockfiles do not make Debian packages or Docker tags immutable. Source changes, local validation, cloud build and backend activation are separate outcomes. Older revisions retain their template IDs, so Motion guidance must be conditional. Tooling checks do not establish generated-design quality or measured speed improvements.

## The Recommendation
Use exact current stable npm releases and Node LTS for a versioned starter. Keep React 19.3.0, Vite 8.3.0, Tailwind 4.3.3, Router 7.18.3, React Icons 5.7.0 and add Motion 13.2.0. Use Oxlint 1.82.0, following the current published Vite starter. Lock Playwright 1.63.0 separately. Commit explicit HTML/JSX entry files and minimal neutral Tailwind tokens/base styles. Strengthen concise host instructions for Tailwind v4 and optional Motion. Publish a new E2B template only after authorized build and browser checks; activate locally after the disposable cloud smoke succeeds. Do not silently migrate existing projects or deploy the backend.

## The One Thing to Do First
Replace dynamic scaffolding with a checked-in package.json and package-lock.json so the starter’s dependency contract becomes reviewable and reproducible.

## Sources
- [Tailwind Vite installation](https://tailwindcss.com/docs/installation/using-vite)
- [Motion installation](https://motion.dev/docs/react-installation)
- [Vite guide](https://vite.dev/guide/)
- [Node releases](https://nodejs.org/en/about/previous-releases)
- [Published create-vite starter](https://registry.npmjs.org/create-vite/9.2.1)
- [Stable package metadata](https://registry.npmjs.org/motion/latest)

Implementation conventions are in sandbox/README.md. Completed checks and activation limits are recorded in docs/e2b-starter-validation-2026-09-14.md.
