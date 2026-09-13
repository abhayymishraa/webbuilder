# WebBuilder

Generate and edit React applications with an AI agent. The Next.js frontend uses a
FastAPI backend for authentication, chat history, and WebSocket progress. One bounded
OpenAI coding loop edits files in E2B. The backend runs production-build and browser
checks, allows two targeted repairs, and persists a final outcome. Stop and reconnect
operate on a run independently of its WebSocket connection.

See [orchestration, limits, and verification](docs/architecture/orchestration.md),
the [original audit](docs/research/2026-09-12-orchestration-audit.md), and the
[LLM Council decision](docs/council/council-transcript-2026-09-12-orchestration.md).

Project history retrieval and optional summaries are described in
[context and memory](docs/context-memory.md). Retrieval uses the existing database;
automatic compaction is disabled pending quality evaluation.

## Production

- Frontend: https://webbuilder.abhayymishraa.us (Vercel)
- Backend: https://webbuilder-api.abhayymishraa.us (Oracle)
- Database: PostgreSQL on Neon
- Default model: `gpt-5.6-luna`, configurable with `OPENAI_MODEL`

See [deployment configuration and rollback](deploy/README.md). Pushes to `main`
deploy the frontend through Vercel and backend changes through GitHub Actions.
The VM runs only the backend container, persistent project files, and Caddy.

## Local development

Docker Compose runs only PostgreSQL and local MinIO. The frontend and backend run on your machine.
Requires Docker Compose v2, Python 3.12+, uv, Node.js 22+, and make.

For a fresh checkout, copy `.env.example` to `.env` and
`frontend/.env.example` to `frontend/.env.local`. Fill the OpenAI and E2B
credentials and a random `SECRET_KEY` of at least 32 characters in `.env`.
Keep `DATABASE_URL` aligned with the `POSTGRES_*` values. Local frontend URLs
and `ALLOWED_ORIGINS` are already configured in these files.
Install dependencies once with `uv sync` and `npm --prefix frontend ci`.

Run these commands from the repository root:

```bash
# Dependencies: PostgreSQL on :5432 and MinIO on :9000/:9001.
docker compose up -d --build --wait
```

```bash
# Backend: localhost:8000 (in its own terminal).
make backend
```

```bash
# Frontend: localhost:3000 (in its own terminal).
make frontend
```

`make backend` runs the database migration and initializes the private local
MinIO bucket before starting Uvicorn with reload. This is a
fresh local database; it does not contain your production accounts or projects.
Open http://localhost:3000 and create a local account. AI generation still uses
the configured OpenAI and E2B services.

Use the `webbuilder-react-verified` E2B template (`xjklh0xbjh3wpgu0w306` for
the existing deployment account), or build your own from `sandbox/Dockerfile`.
The older template lacks Playwright under `/opt/webbuilder-checks` and cannot
run this backend's browser checks. The runner checks browser tooling before
calling the model and stops with a setup error if it is unavailable.
After changing `.env`, stop and restart `make backend`; Uvicorn source reload
does not reload the environment inherited from `uv run`.

Stop each app with Ctrl+C. Stop dependencies with `docker compose down`; their
named volumes preserve data. Run `docker compose logs -f postgres` for database logs.
The production stack remains in `deploy/compose.yaml`. See
[project persistence setup](docs/persistence-setup.md) for GCS, retention, recovery
and verification status. Set a private `MINIO_SECRET_KEY` when creating `.env`.

## E2B template

The sandbox contains Node, React, React Router, React Icons, Vite, Tailwind CSS,
Python for binary-safe archives, and Playwright with headless Chromium. Its server starts on port 5173. No OpenAI or database
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
