# WebBuilder — Ember

The user selected Ember on 12 September 2026. This replaces the earlier landing-only blue direction. Scope now includes the landing page, authentication, saved projects, new-project briefs, conversation, build activity, app preview, and source files.

## Visual system

Ember carries the selected Atelier composition into the application: a spacious split landing hero, a project gallery, and a conversation beside the canvas. The orange/black reference anchors both themes.

| Role | Dark | Light |
| --- | --- | --- |
| Canvas | `#000000` | `#FFFFFF` |
| Surface | `#14100E` | `#FFFFFF` |
| Field / secondary surface | `#241B17` | `#F8F1EC` |
| Text | `#FFFFFF` | `#000000` |
| Subdued text | `#BDA89D` | `#725548` |
| Action fill | `#FF6129` | `#FF6129` |
| Text on action | `#000000` | `#000000` |
| Accent text / focus | `#FF7145` | `#B33005` |
| Border | `#46362F` | `#DDC3B6` |

`#FC3B00` supplies the illustration's stronger orange. Use the bright oranges for actions and the darker derived orange for small text on light surfaces. Semantic tokens live in `frontend/app/globals.css`; shared component styles live in `frontend/app/ember.css`. Marketing composition is scoped in `page-styles.css`.

Typography is `Helvetica Neue, Helvetica, Arial, sans-serif`, matching the font explicitly named in the selected reference. Use the installed system face; no commercial webfont is bundled. Devices without Helvetica use Arial. Source code uses system monospace. Removed the previous three Google font loaders because this selected direction does not use them.

Headlines: 44–70px, weight 500, line height 1.03, tracking -0.055em. Section titles: 30–46px. Body: 14–17px with generous line height. Inputs use 16px on narrow screens. Surface radius: 14px; controls: 8px. Default theme is dark; the theme toggle persists its choice in localStorage.

## Product surfaces

| Route | Source of behavior |
| --- | --- |
| `/` | Server-rendered Ember landing with a draft composer, a labeled portfolio demo, and shared architecture/assembly illustrations |
| `/signin`, `/signup` | Existing `authApi` endpoints and credential handling, restyled forms |
| `/projects` | Existing authenticated `chatApi.listProjects`, with search, loading, failure/retry and empty states |
| `/chat` | Existing `chatApi.createChat`; three optional starter briefs prefill the form and wait for submission |
| `/chat/[id]` | Existing run POST, cancellation POST, WebSocket snapshot/replay and message consolidation |
| Preview / Files | Existing live sandbox URL, authenticated file listing/content and ZIP download APIs |

A fixed starter ID can survive the sign-in detour in sessionStorage. The brief is not sent until the user presses Start building. Projects are backend records, not the prototype's fixtures. Archive, settings writes, fake balances and simulated generation were not transferred.

The homepage also stores a free-text draft in tab-scoped sessionStorage, then opens
the existing workspace/sign-in flow. It is restored in `/chat`, preserved after a
failed chat creation, and removed after successful creation. An explicit gallery
starter takes precedence over an older draft. No arbitrary redirect URL or backend
call was added to the landing composer.

## Homepage component promotion

The selected illustrations live in `frontend/components/ember/landing`.
Standalone prototype routes, their navigation, and the unused sieve demo have been removed.
The homepage order is architecture, starter-concept carousel, source ownership, FAQ,
prompt, footer. The starter gallery and links to its removed `#examples` anchor
have been removed. The `#how-it-works` anchor is preserved. The architecture is the homepage h1 and fills
at least the opening viewport below the navigation. Its larger illustration scales
with the viewport; short screens can extend the section instead of clipping it.
The prompt sits immediately above the footer at `#create`, with an h2.
The footer uses a compact version of the supplied horizon composition: a centered
headline, with the brand and navigation at the bottom. Repeated capability badges
and all footer CTA buttons have been removed. The quieter grid and shallow orange
horizon are static CSS decoration. Both themes use the existing semantic tokens.
The landing content uses a shared 1,220px outer width, a 28–36px supporting heading
scale, and 56px desktop / 40px mobile section spacing. Illustrations are smaller; demo buttons use secondary styling. The full-screen opening and
the prompt's position immediately above the footer are preserved. No new motion
is added for this density pass. Browser verification remains pending.
Headlines wrap naturally and top-level section dividers are removed. Functional
input, preview, and FAQ boundaries remain.

The homepage carousel replaces the sieve at `#filter`, preserving existing incoming
links. It follows the supplied case-study composition but labels its three previews
as starter concepts. There are no invented client results or performance metrics.
Only the two navigation arrows and the current brief link are actionable; position
markers are passive. Keyboard browsing is immediate and there is no autoplay.
Pointer browsing crossfades opacity over 160ms using `--ease-out`; reduced motion
uses 80ms. Three grid-stacked slides retain the largest content height, with only
the active slide exposed to focus and accessibility APIs. CSS transitions retarget
rapid changes rather than queuing exits. The arrow's visual face scales to .97 over
120ms while its 44px hit area stays fixed; reduced motion uses opacity .8 over 100ms.
Native FAQ openings get a 140ms answer fade (80ms reduced motion) only for pointer
activation. Keyboard activation cancels the fade. Checks for these cues remain unrun.
The cube explains Layout, Style, Content, and
Interactions beside the source ownership message. On the homepage, native CSS view
timelines map scroll progress to the pieces' transforms: assembled at viewport
entry, expanded at viewport center. Scrolling back reverses the movement; stopping
scrolling holds the current pose. Stationary labels fade in during the latter half.
There is no autoplay, pointer tracking, or new button. Reduced motion and unsupported
browsers show the expanded diagram immediately. No scroll listeners or observers
are needed. This animation is not yet browser-verified. The opening diagram has numbered stage selectors and a compact animation pause control.
Homepage sections inherit Ember's theme tokens and Helvetica typography. The
composer carries the selected orange glow, with a visible multiline label, an
explicit workspace action, and a reduced-motion fallback. No new dependencies were
added. The old reading-list demonstration and its unused styles were removed.

Verification of this homepage revision is pending. Prior prototype checks are not
evidence of current homepage rendering or end-to-end authentication/generation.

### Responsive layout

Preserve the existing Ember aesthetic and explanatory scroll motion. Layout variance
stays at 6, motion at 4, and visual density at 3; this pass changes sizing and reflow.
Use fluid 16–48px gutters, zero-minimum grid tracks, wrapping controls, and explicit
SVG aspect ratios. Stack the prompt and carousel at 960px, and the FAQ and ownership
section at 767px. Navigation touch targets are at least 44px. Preview typography
responds to the preview container rather than the entire viewport. Short landscape
phones retain a readable illustration beside the hero copy. Content can extend the
hero beyond its viewport minimum rather than being clipped to a fixed screen height.
The cube keeps its CSS scroll timeline and static reduced-motion/unsupported-browser
fallback. This pass adds no runtime resize handlers or dependencies. Mobile, tablet,
desktop, zoom, and orientation checks remain unrun at the user's request.

### Architecture signal motion

The opening illustration uses automatic explanatory motion: a 10-second orange
orbit around the build loop and subtle 6-second floating plates. The orbit is linear;
the plate easing is the Animate skill's cubic-bezier(.77, 0, .175, 1). Only transforms
animate, with a synchronized inverse rotation preserving the marker's circular shape.
The numbered stages select the highlighted layer and explanation. A keyboard/touch
pause control suspends all motion without resetting its phase. IntersectionObserver
and page visibility suspend playback offscreen and in hidden tabs; they never set
animation progress. Both subscriptions are cleaned up on unmount. Reduced motion
keeps the diagram static and hides the unnecessary pause control. Browser/feel checks remain unrun.

The hero also supports mouse drag rotation through `ArchitectureTilt`. Motion spring
values (mass 1, stiffness 100, damping 10) drive one perspective transform without
per-frame React state. Target tilt is limited to 16 degrees vertically and 24 degrees
horizontally; release retains velocity while returning toward zero. Pointer capture
keeps drags working outside the drawing, and cancellation resets the pose. Arrow
keys inspect fixed angles immediately; Escape resets. Touch gestures retain native
scrolling. Pausing, hiding the hero, or enabling reduced motion disables rotation and
resets the view. The existing SVG is tilted as a plane; this is not a volumetric 3D
model. Motion is the added dependency; no toast UI is needed. Browser checks remain unrun.

The projects drawer and gallery share `ProjectCollection`, so both use the same data and error states. The desktop sidebar links only to real destinations. Mobile switches between chat and workspace; desktop supports a mouse/keyboard resizer. The preview offers desktop, tablet and mobile widths, reload, and a new-tab link. Viewport presets cap the canvas width; they do not emulate a device or force a wider viewport than the available panel.

## Beautiful UI provenance

The conversation frame and composer were adapted from the MIT Beautiful UI `ChatComposer` used in the selected prototype. Its header / scroll area / composer structure was translated to local semantic classes and connected to the real page handlers. The canned replies, phase timers, component playground, palette picker, and demo engine were not imported. No new runtime dependency was necessary.

- Source: https://github.com/slev12397/beautiful-ui
- Reference revision: `ff0f74d62d8be9d89bcb735b3632e31a6ccf88dc`
- Retained license: `frontend/components/ember/BEAUTIFUL-UI-LICENSE`

## Motion and accessibility

The applied skills were prototype promotion, design-taste-frontend, emil-design-eng, and animate. The motion gate allows a brief marketing entrance and pointer press feedback. Workspace tabs, keyboard actions, resizing and streamed messages are immediate.

| Before | After | Why |
| --- | --- | --- |
| Long prototype comparisons and simulated services | One selected Ember style over real routes | Promote the chosen design without a parallel application engine |
| White actions and unrelated cool grays | Shared orange actions and warm semantic neutrals | Consistent light and dark presentation |
| Placeholder Pricing/Product/Docs links and unsupported popularity copy | Actual project navigation and product-specific copy | Every destination and claim should mean something |
| Animated panel width and smooth scrolling on every message | Immediate resizing and message positioning | Keep frequently used functional UI responsive |
| 500ms project drawer entrance | 200ms entrance, 150ms exit; reduced-motion fallback | Keep occasional navigation brief |
| One-line composer | Labeled multiline input, Shift+Enter, IME-safe submission and explicit Stop | Preserve typing and cancellation affordances |

The landing entrance uses opacity and 8px translation over 280ms with `cubic-bezier(.23,1,.32,1)`, plus 50ms illustration offset. Pointer press feedback lasts 140ms. Reduced motion removes movement; keyboard press scaling is suppressed. Focus is visible. Errors are announced. Radix retains drawer focus and Escape handling.

## Implementation status

The source changes are local and uncommitted. The user explicitly requested implementation only and declined verification for this integration. No tests, type-check, production build, browser walkthrough, model generation or deployment was run. Do not describe the integration as verified or live.

The comparison server on port 3001 was stopped after selection. Its complete source was archived outside the repository at `/tmp/webbuilder-design-archive-20260912-ember`. No prototype harness or demo engine is included in the application. The archive can be restored if another design exploration is requested.

Deferred validation: auth success/failure, starter continuation through login, saved-project loading/search/retry, send/stop/reconnect, activity display, preview widths, file and ZIP downloads, mobile navigation, keyboard focus, reduced motion, light/dark contrast and a production build.
