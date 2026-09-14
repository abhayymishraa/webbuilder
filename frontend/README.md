This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Styling conventions

Use Tailwind utilities for layout, spacing, typography, responsive breakpoints,
and interaction states. Put utilities on the element they style when practical;
reserve descendant variants for structured content such as code listings or a
component's deliberate layout overrides.

- `app/globals.css` owns theme tokens and base styles. Use semantic utilities
  such as `bg-card`, `text-muted-foreground`, and `border-input` for product UI.
- `components/ui/button.tsx` owns primary, secondary, icon, tab, and transcript
  utility button variants. Use `Button` for actions and `buttonVariants` for links.
- `components/ui/input.tsx` owns the shared form field appearance, focus state,
  disabled state, and readable mobile input size.
- Scoped CSS modules retain illustration geometry, keyframes, masks, scroll
  timelines, and other effects that are clearer in CSS. Their component layer
  allows intentional Tailwind overrides without specificity escalation.
- `app/ember.css` retains artwork and shared motion behavior. Ordinary page
  layout no longer belongs in a second global stylesheet.

Keep class names statically discoverable by Tailwind. Preserve reduced-motion
handling and keyboard focus when adding variants. A CSS migration alone does
not resolve repeated API requests or prove a network performance improvement.

The September 14 styling migration passed TypeScript and lint on the styling
files. Public layouts were checked at 320, 390, 768, and 1440px widths; mocked
signed-in layouts also covered 844 × 390 landscape. Chat retained a viewport-sized
shell with internal scrolling. Menu, tool-detail, file-tab, theme-toggle, and
prototype-dialog checks passed on phone and desktop. These checks used fake
account/project responses and do not verify live generation or cloud storage.
Verification notes describe earlier revisions, including prototype pages that have since been removed.

## Homepage integration

The homepage opens with the architecture at `#how-it-works`, followed by the
starter-concept carousel at `#filter`, the cube adapted to source ownership, and
the FAQ. The glowing prompt at `#create` sits immediately
above the footer.
`HorizonFooter` adapts the supplied grid/horizon reference to Ember theme tokens,
with a compact heading, bottom navigation, and a static orange rim. It has no
repeated workspace button or animated decoration and adds no dependencies.
The opening section fills at least the viewport below the 76px navigation;
short screens and enlarged text can extend it without clipping content.
Headlines wrap naturally, and section boundaries use spacing instead of divider lines.
Homepage illustrations follow the application's light/dark tokens.
The replaced reading-list demo and its page styles have been removed.

The landing page uses a 1,220px outer content width, 28–36px supporting headings,
56px desktop section padding, and smaller illustrations. The opening architecture
retains its viewport height. Its numbered steps select the highlighted stage and
explanation. The hero automatically animates a 10-second orange orbit and gentle
6-second plate movement using CSS transforms. Pause/resume preserves the current
position; leaving the viewport or hiding the tab also pauses playback. Reduced
motion renders the diagram still. Mouse dragging tilts the diagram with Motion
springs and release momentum; arrow keys rotate immediately and Escape resets.
Touch gestures keep native page scrolling. The spring values update a single
transform without frame-by-frame React state. Motion is the added dependency.
There is no scroll-linked progress for this hero. These changes are unverified in a browser.
The ownership cube follows page scroll: its pieces separate from viewport entry
until the visual reaches the viewport center, and reassemble when scrolling back.
Native CSS view timelines drive transforms and label opacity without scroll listeners
or React renders. Reduced motion and browsers without timeline/range support show
an expanded, static diagram. No new button or dependency is added. `ProjectShowcase`
replaces the sieve with one concept at a time: a decorative app preview, description,
feature labels, and a link to `/chat?starter=<id>`. Previous/next buttons and arrow
keys on the carousel browse the three existing starter briefs. It does not autoplay,
start generation, or claim that these illustrative layouts are shipped case studies.
Pointer changes crossfade carousel slides over 160ms (80ms with reduced motion).
The slides share a grid cell for stable sizing; inactive slides are inert and hidden
from assistive technology. Keyboard changes are immediate. Arrow faces provide
120ms press feedback without shrinking the hit target (100ms opacity feedback for
reduced motion). `FaqItem` preserves native details behavior and fades pointer-opened
answers over 140ms, or 80ms with reduced motion; keyboard openings remain instant.
These interaction cues use the existing easing token and add no dependencies.
The old three-card gallery, footer badges, and repeated footer buttons remain removed.

Homepage spacing scales between 16px and 48px side gutters. At 960px and below,
the starter carousel and prompt section stack before their columns become cramped.
The carousel's decorative type scales against its own preview width. Navigation
uses 44px touch targets, and the prompt footer wraps with a full-width submit button
on narrow phones. The textarea grows with its content where supported, up to 260px,
and retains native scrolling/manual resizing as a fallback. SVGs reserve their aspect
ratios. The hero uses a stable viewport minimum and may grow with its content;
short landscape phones use two columns to keep the illustration readable.
These responsive changes add no JavaScript or dependencies. Type-checks and browser
checks for this revision were explicitly left unrun; cross-device rendering is unverified.

`HeroPrompt` stores up to 2,000 characters in the tab's session storage under
`webbuilder-project-draft`, then opens `/chat`. The existing sign-in/sign-up flow
returns to `/chat`, which restores the draft. It is never placed in a URL or sent to
the backend by the landing form. A successful `createChat` clears the stored draft;
failed creation preserves it. Explicit gallery starters override an older draft.
Starting generation still requires submitting the brief from the workspace.
If the browser blocks session storage, the landing form retains the text and shows
an inline error instead of silently losing the prompt.

Type-checks and browser verification for this integration have not been run.
Earlier prototype checks do not verify the current homepage or authentication handoff.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

The Ember interface uses the system Helvetica Neue / Helvetica / Arial stack, with system monospace for source code. It does not download fonts at runtime.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Ember interface

The main application now uses the selected Ember direction, with a shared dark/light palette and a system Helvetica Neue / Helvetica / Arial stack. The landing page, authentication, `/projects`, `/chat`, and the builder use the same tokens. See [the design specification](../DESIGN.md) for the implementation boundary, source attribution, and deferred checks.

The old design picker and simulated build engine are not part of the production frontend. The real application continues using its configured authentication, chat, run, WebSocket and file APIs. No new environment variable is required.
