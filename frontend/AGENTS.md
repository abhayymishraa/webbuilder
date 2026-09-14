<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Styling rules

- Use Tailwind for layout, spacing, typography, responsive rules, and interaction states.
- Put utilities on their element. Use descendant variants only for structured content or deliberate component overrides.
- Reuse `components/ui` controls. Actions use `Button`; styled links use `buttonVariants`; ordinary form fields use `Input`.
- Extend shared variants for repeated styles. Avoid duplicate control styling across pages.
- Keep theme tokens and base styles in `app/globals.css`. Prefer semantic colors: `bg-card`, `text-muted-foreground`, `border-input`.
- Keep complex artwork, keyframes, masks, and scroll timelines in scoped CSS modules. Use `@layer components` when utilities must override them.
- Keep `app/ember.css` focused on artwork and shared motion behavior. Do not restore global page-layout rules.
- Keep Tailwind class names statically discoverable. Do not construct partial class names at runtime.
- Preserve Ember design, keyboard focus, disabled states, and reduced-motion support.
- Prevent horizontal page overflow. Keep chat viewport-sized with internal scrolling; let long content pages scroll naturally.
- After verification approval, check phone, tablet, desktop, short landscape, and both themes. Include menus, dialogs, and loading/error states.
- Claim performance gains only with measurements. Styling cleanup does not fix repeated API calls or downloads.
