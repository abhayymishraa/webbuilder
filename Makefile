.PHONY: backend frontend

backend:
	uv run --env-file .env python -m db.migrate
	uv run --env-file .env python -m agent.init_storage
	uv run --env-file .env uvicorn main:app --reload --port 8000

frontend:
	npm --prefix frontend run dev -- --port 3000
