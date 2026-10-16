# CLAUDE.md

RestoOne — multi-role, real-time restaurant ordering platform. Roles: **guest** (no login), **waiter**, **kitchen**, **billing**, **admin** (staff authenticate with JWT).

- Backend: FastAPI + SQLAlchemy 2 + SQLite, Poetry, native WebSockets, Groq AI. Deployed on Render (`https://resto-one-backend.onrender.com`).
- Frontend: React 18 + Vite 5 + Zustand + axios + lucide-react, plain CSS. Deployed on Vercel (SPA rewrite in `frontend/vercel.json`).
- `project_plan.md` is the original design doc (historical; code is the source of truth).

## Commands

```bash
# Backend (from backend/)
poetry install
poetry run uvicorn app.main:app --reload --port 8000   # docs at /docs
poetry run python -m app.seed                          # optional: startup already seeds
poetry run pytest                                      # needs pytest + httpx installed (see Known gaps)

# Frontend (from frontend/)
npm install
npm run dev      # http://localhost:5173, proxies /api and /ws to :8000
npm run build
```

Copy `backend/.env.example` to `backend/.env`. Without a real `GROQ_API_KEY`, AI features fall back to built-in heuristics, so the app works offline.

Demo staff logins (seeded): `admin/admin123`, `waiter/waiter123`, `kitchen/kitchen123`, `billing/billing123`.

## Layout

```
backend/app/
  main.py               app factory; lifespan runs create_all() + seed_database() on every start
  core/config.py        pydantic-settings (reads backend/.env)
  core/security.py      bcrypt hashing, JWT encode/decode
  db/session.py         engine, SessionLocal, Base, get_db
  models/models.py      SQLAlchemy models
  schemas/schemas.py    Pydantic v2 schemas (suffix In/Out)
  routers/              one per role/domain: auth, guest, waiter, kitchen, billing, admin, chat, ws
  services/             all business logic + DB writes; also fires WebSocket broadcasts
  ws/connection_manager.py   in-memory channel -> sockets map (single process only)
  seed.py               idempotent seed of users + menu
backend/tests/          pytest; in-memory SQLite + dependency override of get_db (conftest.py)

frontend/src/
  App.jsx               view switching via `currentView` state (no router), global toasts
  api/index.js          the only place HTTP calls live; injects X-Session-Token and Bearer token
  hooks/useWebSocket.js reconnecting WS hook with 25s ping
  store/                useCartStore, useSessionStore (guest token), useAuthStore (staff JWT)
  pages/                LandingPage, OrderStatusPage, KitchenBoard, BillingBoard, WaiterDashboard, AdminDashboard
  components/           one component per file, PascalCase
  index.css             design system (CSS custom properties, dark slate + gold)
```

## Domain rules (do not break)

1. **Guests never log in.** They're identified only by the `X-Session-Token` header (`g_<12 hex>`), created by `POST /api/session` with a `table_no`. Never key anything off a guest's name.
2. **Order status is one fixed enum**, in this order:
   `placed → confirmed → accepted → preparing → ready_to_serve → served → paid`.
   Don't add new statuses. Kitchen "done" jumps straight to `ready_to_serve`. Delay is a separate flag (`is_delayed`, `delay_minutes`, `delay_reason`), not a status.
3. **Cross-role live updates go over WebSocket, not polling.** Endpoint `/ws/{channel}`. Channels: `kitchen`, `waiter`, `billing`, `admin`, `guest:{session_token}`. Events: `order_created`, `order_status_updated`, `order_delayed`, `waiter_called`, and `connected`/`pong` from the server. When a service changes an order, broadcast to every affected channel, including the guest's own channel (see `order_service.py`).
4. **Keep routers thin.** Validation, DB writes and broadcasts belong in `services/`.
5. **Role guards** use `Depends(require_roles([...]))` from `services/auth_service.py`. Admin is allowed on the kitchen and billing endpoints too.
6. **Prices are snapshotted** into `order_items.price_at_order`. Totals are always computed from that, never from the current dish price.

## AI (Groq)

- Use the `groq` SDK, model from `settings.GROQ_MODEL` (default `openai/gpt-oss-120b`). **Don't use `llama-3.3-70b-versatile`**: Groq ended free-tier access to it on 2026-08-16. Don't switch to the OpenAI or Anthropic SDKs unless asked.
- Read the key only from the `GROQ_API_KEY` env var. Never hardcode it.
- `services/ai_service.py` (guest concierge) asks for strict JSON `{reply, dish_recommendation: {dish_id}|null}`, retries once on 429, validates `dish_id` against the menu, and falls back to `_fallback_concierge`. Keep replies short (max ~30 words).
- `services/insight_service.py` produces 3 admin insights, cached in memory; `?force=true` regenerates them.
- Any new AI call must have a non-AI fallback, so the app and tests still work without a key.

## Conventions

- Python: snake_case, PascalCase models, schemas suffixed `In`/`Out`, raise `HTTPException` with proper codes.
- Frontend: every HTTP call goes through `src/api/`, with no inline fetch/axios in components. The one exception is `ServerWakeOverlay.jsx`, which health-checks the root URL. Use `useWebSocket` for all socket subscriptions. Cart, session and auth state live only in their Zustand stores.
- Styling: reuse the CSS variables in `index.css` (`--accent-gold`, `--text-muted`, etc.). Many components use inline styles; follow the surrounding file.
- Pre-commit is configured (`.pre-commit-config.yaml`): black + ruff on `backend/`, eslint + prettier on `frontend/`.

## Environment / deployment notes

- API base URL: `VITE_API_URL`, else `/api` in dev (Vite proxy), else the Render URL in prod. WS URL is derived from `VITE_WS_URL`/`VITE_API_URL` the same way.
- Render's free tier sleeps. `.github/workflows/render-keepalive.yml` pings it every 14 min from 02:00 to 14:59 UTC, and `ServerWakeOverlay` shows a wake-up screen while it cold-starts.
- SQLite on Render is **ephemeral**: data resets on every redeploy or restart, and startup re-seeds.
- `ws_manager` is in-process memory, so running more than one worker or instance breaks real-time fan-out.

## Known gaps (check before assuming something works)

- `pytest`/`httpx` aren't declared in `pyproject.toml` (no dev group), so run `poetry add --group dev pytest httpx` before running tests.
- The frontend has no ESLint/Prettier config and no `lint` script, so the pre-commit eslint hook fails as-is.
- `/ws/{channel}` ignores its `token` param. Any client can subscribe to `kitchen`/`admin`/`billing` or any `guest:*` channel.
- Status transitions aren't validated. `POST /api/billing/orders/{id}/status` accepts any enum value, including moving backwards.
- `CORS_ORIGINS=["*"]` is set together with `allow_credentials=True`, and `SECRET_KEY` has a hardcoded default.
