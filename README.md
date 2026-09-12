# WebBuilder

Generate and edit React applications with an AI agent. The Next.js frontend uses a
FastAPI backend for authentication, chat history, and WebSocket progress. One bounded
OpenAI coding loop edits files in E2B. The backend runs production-build and browser
checks, allows two targeted repairs, and persists a final outcome. Stop and reconnect
operate on a run independently of its WebSocket connection.

See [orchestration, limits, and verification](docs/architecture/orchestration.md),
the [original audit](docs/research/2026-09-12-orchestration-audit.md), and the
[LLM Council decision](docs/council/council-transcript-2026-09-12-orchestration.md).

## Production

- Frontend: https://webbuilder.abhayymishraa.us (Vercel)
- Backend: https://webbuilder-api.abhayymishraa.us (Oracle)
- Database: PostgreSQL on Neon
- Default model: `gpt-5.6-luna`, configurable with `OPENAI_MODEL`

See [deployment configuration and rollback](deploy/README.md). Pushes to `main`
deploy the frontend through Vercel and backend changes through GitHub Actions.
The VM runs only the backend container, persistent project files, and Caddy.

## Local development

Requires Python 3.12+, uv, Node.js 22+, and PostgreSQL. Keep credentials in an
ignored `.env` file or a private file outside this repository:

```bash
cp deploy/runtime.env.example .env
# Fill in DATABASE_URL, OPENAI_API_KEY, E2B_API_KEY, E2B_TEMPLATE_ID,
# SECRET_KEY, and ALLOWED_ORIGINS before running the following commands.
uv sync
uv run --env-file .env python -m db.migrate
uv run --env-file .env uvicorn main:app --reload
```

`SECRET_KEY` must be a random secret with at least 32 characters in production.
The database driver accepts Neon's standard PostgreSQL URL, including
`sslmode=require&channel_binding=require`, and verifies the TLS certificate.
`db.migrate` creates missing tables, including `runs`, without dropping data; changes to
existing columns require an explicit migration before deploying changed models.

Configure `frontend/.env.local`:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Then start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Set backend `ALLOWED_ORIGINS=http://localhost:3000` for local development.

## E2B template

The sandbox contains Node, React, React Router, React Icons, Vite, Tailwind CSS,
and Playwright with headless Chromium. Its server starts on port 5173. No OpenAI or database
credentials are copied into the sandbox template.

With the E2B CLI authenticated, build from its separate directory:

```bash
e2b template create webbuilder-react-verified --path sandbox --dockerfile Dockerfile \
  --cmd 'cd /home/user/react-app && npm run dev -- --host 0.0.0.0 --port 5173 --strictPort' \
  --ready-cmd 'curl -fsS http://127.0.0.1:5173/ >/dev/null' \
  --cpu-count 1 --memory-mb 1024
```

Set `E2B_TEMPLATE_ID` to the resulting template ID. Existing templates remain
available; building this template does not delete them.
The verified template built on 12 September 2026 is `xjklh0xbjh3wpgu0w306`.
Older templates without Chromium cannot pass the new browser gate.

OpenAI and E2B usage have their own billing or free-credit limits. Free frontend
and VM hosting do not make AI generation free.

## Regression checks

```bash
uv run python -m unittest discover -s tests -v
cd frontend
npm test
npm run build
```

Frontend tests require Node 22.6+ with TypeScript stripping. Database integration
tests are opt-in; see the architecture document for an isolated database setup.
