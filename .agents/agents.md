# Project: Restaurant Guest Experience Platform

Multi-role restaurant ordering system. Roles: guest (no auth), waiter, kitchen staff,
billing staff, admin (all authed via JWT).

## Golden rules for any agent working in this repo
1. Guests never require login — always identify them by session token, never by name.
2. Every order has ONE status field with a fixed enum (see architecture.md). Never invent new statuses.
3. All cross-role live updates go through WebSocket, not polling.
4. Backend: FastAPI + SQLAlchemy + SQLite, managed with Poetry. Frontend: React + Vite.
5. Keep routers thin — business logic goes in services/.
6. Run pre-commit before considering any task done.
7. AI provider is **Groq** (`openai/gpt-oss-120b`, free tier; do NOT use `llama-3.3-70b-versatile` — Groq deprecated free access to it on Aug 16, 2026), accessed via the `groq` SDK — never swap in OpenAI/Anthropic SDKs unless explicitly asked. API key comes from `GROQ_API_KEY` env var, never hardcoded.

See: architecture.md, conventions.md, db_schema.md, roadmap.md
