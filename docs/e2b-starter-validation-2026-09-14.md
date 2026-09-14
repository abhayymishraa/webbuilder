# E2B starter validation, 14 September 2026

Template: `webbuilder-react-design-20260914` (`dwel3q1jkunk4chqfw7h`).
Verified build: `a3e5167b-c854-4127-b799-46c139c23837`.

## Completed checks

- Installed the locked starter with Node 24.21.0 and ran lint and production build locally.
- Inspected the local starter in Chromium at 360×800, 768×1024 and 1440×900,
  in light and dark themes: rendered content, no horizontal overflow or uncaught errors.
- Built the E2B image and confirmed its configured Vite startup/readiness command.
- Confirmed exact installed versions in a disposable E2B sandbox; starter lint
  returned zero warnings/errors and production build passed.
- Passed WebBuilder's existing browser-tool preflight with Playwright 1.63.0.
- Replaced only the disposable sandbox's starter with an interactive example
  importing Motion, React Icons and React Router; lint and production build passed.
- Restarted Vite using WebBuilder's existing preview process manager, then passed
  the existing desktop/mobile browser gate.
- Checked the example at widths 390 and 1280 with both themes and both motion
  preferences: responsive Tailwind columns, semantic colors, icon rendering,
  counter interaction, route navigation/reload and no horizontal overflow.
  Normal Motion reached its target; reduced-motion applied the target immediately.
- Terminated every disposable sandbox created for these checks. No user project
  was modified, and no OpenAI generation request was made.

The first image exposed a missing copied `.gitignore`: lint scanned installed
dependencies. The final image copies that file and explicitly excludes
`node_modules` and `dist` in the lint configuration. The complete cloud check
was rerun against the corrected image and passed.

## Activation and limits

The local `.env` and checked-in example select the verified template. Restart
the local backend to load the changed environment; source reload alone is insufficient.
Production's template setting was subsequently updated with explicit user approval.
The API container was recreated on its existing application release
`8e3446c31806cd3b42526191e6c1b18a21c6b307`; the running container confirmed
`E2B_TEMPLATE_ID=dwel3q1jkunk4chqfw7h`. Generation and sandbox lifecycle counts
were zero before the change. Local readiness, proxy HTTPS readiness and public
`https://webbuilder-api.abhayymishraa.us/health/ready` returned `{"status":"ready"}`.
The previous template setting is retained privately on the VM for rollback.
This was a configuration rollout: the uncommitted agent prompt changes were not
deployed, and no production generation was submitted. Follow
the [deployment instructions](../deploy/README.md#upgrade-the-generated-app-template)
for subsequent application releases.
Existing revisions keep their recorded template IDs and dependency files.

These checks establish starter/tooling compatibility, not generated design quality,
generation speed or full application regression coverage. Production confirmation
covers the template environment and service readiness only.
Stable versions are pinned per template release; Node image tags and Debian
packages are not digest-locked. No test suite was added, per repository policy.

See the [starter conventions](../sandbox/README.md) and
[council decision](council/council-report-2026-09-14-11-30-31-e2b-starter.html).
