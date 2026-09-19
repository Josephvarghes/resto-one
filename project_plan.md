# Restaurant Guest Experience Platform — Project Plan

A multi-role restaurant system: **Guest, Waiter, Kitchen Staff, Billing Staff, Admin.**
Backend: FastAPI + SQLite + Poetry. Frontend: React. Real-time via WebSockets.
This plan is written so it can be dropped into an AI-IDE (Antigravity) as project context — Section 5 gives you the actual `.agents/` files to create first, since that's what the IDE agent will read before touching code.

---

## 1. Roles & Core Rule

| Role | Auth? | Lands on |
|---|---|---|
| Guest | No login, but tracked via session (UUID in cookie/localStorage) | Dish landing page |
| Waiter | Login (name+password) | Same landing page as guest, plus waiter tools |
| Kitchen Staff | Login | Kitchen queue page |
| Billing Staff | Login | Billing board page |
| Admin | Login | Analytics dashboard |

**Simple example:** A guest opens the link, gets `guest_session_id = "g_7f3a1c"` stored in a cookie. Every dish they add to cart, every chat message, and every order is tagged with `g_7f3a1c` — no name or phone needed, but their whole session is traceable end-to-end.

---

## 2. Tech Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy, SQLite (swappable to Postgres later), Poetry, WebSockets (FastAPI native), Pydantic v2 for schemas.
- **Frontend:** React (Vite), React Router, Zustand or Context for cart/session state, Axios/fetch, a WebSocket client hook.
- **AI:** Groq API (free tier) for guest chat recommendations and admin insights — `groq` Python SDK, OpenAI-compatible chat-completions interface, model `openai/gpt-oss-120b` (free tier; `qwen/qwen3.6-27b` or `openai/gpt-oss-20b` as lighter alternatives). Note: Groq deprecated free-tier access to `llama-3.3-70b-versatile` on Aug 16, 2026 — don't use that model name. Free tier caps: ~30 requests/min, daily token cap per model — fine for a demo/MVP, worth adding simple retry/backoff on 429s.
- **Auth:** JWT (staff only). Guests use a signed session token, no password.
- **Tooling:** pre-commit (black, ruff, isort for backend; eslint, prettier for frontend), Husky + lint-staged on the frontend side.
- **Realtime:** WebSocket channels per concern (see Section 8).

---

## 3. High-Level Architecture

```
restaurant-platform/
├── backend/                 # FastAPI app (Poetry project)
├── frontend/                # React app
├── .agents/                 # AI IDE context (read this first)
├── .pre-commit-config.yaml
└── docker-compose.yml       # (optional, later)
```

Request flow, simple example:
Guest adds "Paneer Tikka" to cart → `POST /api/orders` → row created in `orders` + `order_items` with status `placed` → WebSocket event pushed to `kitchen` channel → kitchen staff sees it appear live, no refresh needed.

---

## 4. Repository / Folder Structure

```
backend/
  app/
    main.py
    core/            # config, security, ws_manager
    db/               # session, base, migrations (alembic later)
    models/            # SQLAlchemy models
    schemas/            # Pydantic schemas
    routers/
      guest.py, waiter.py, kitchen.py, billing.py, admin.py, auth.py, chat.py, ws.py
    services/
      order_service.py, chat_service.py, ai_service.py, insight_service.py
    ws/
      connection_manager.py
  tests/
  pyproject.toml

frontend/
  src/
    pages/
      LandingPage.jsx, CartPage.jsx, ChatWindow.jsx, OrderHistoryPage.jsx
      WaiterLogin.jsx, KitchenBoard.jsx, BillingBoard.jsx, AdminDashboard.jsx
    components/
      DishCard.jsx, BellButton.jsx, ChatBubble.jsx, OrderCard.jsx, StatusBadge.jsx
    store/            # cart store, session store, auth store
    hooks/            # useWebSocket, useSession
    api/               # axios instance + per-domain api calls
  package.json
```

---

## 5. `.agents/` Folder — AI IDE Context (create this FIRST)

Antigravity (and similar agentic IDEs) read `.agents/` to understand the project before generating code. Create these files at repo root:

**`.agents/agents.md`** (top-level entry point)
```markdown
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
```

**`.agents/architecture.md`** — paste Sections 3, 6, 7, 8 of this plan.

**`.agents/conventions.md`**
```markdown
## Backend conventions
- snake_case for Python, PascalCase for models, Pydantic schemas suffixed `In`/`Out`.
- One router per role/domain, one service per domain.
- All DB writes go through services, never directly in routers.

## Frontend conventions
- One component per file, PascalCase filenames.
- Cart state lives in a single Zustand store (`useCartStore`).
- All API calls go through `src/api/`, never inline fetch in components.
- WebSocket events handled through a single `useWebSocket` hook per page.
```

**`.agents/db_schema.md`** — paste Section 6.

**`.agents/roadmap.md`** — paste Section 12 (phases), and check items off as they're built.

---

## 6. Database Schema (SQLite)

```
users            (id, name, password_hash, role[waiter|kitchen|billing|admin], created_at)
guest_sessions   (id, session_token, table_no, created_at, last_active)
dishes           (id, name, price, image_url, category, is_available, description)
orders           (id, guest_session_id NULL, waiter_id NULL, table_no,
                   status ENUM[placed, confirmed, accepted, preparing,
                               ready_to_serve, served, paid],
                   is_delayed, delay_reason, delay_minutes, created_at, updated_at)
order_items      (id, order_id, dish_id, quantity, note, price_at_order)
chat_sessions    (id, guest_session_id, created_at)
chat_messages    (id, chat_session_id, sender[user|ai], message, created_at)
waiter_calls     (id, table_no, guest_session_id, status[pending|acknowledged], created_at)
```

**Status enum note:** the spec listed *confirmed → transit → prepared → ready to serve → served → paid*. We map that to `placed → confirmed → accepted → preparing → ready_to_serve → served → paid`, with `preparing`≈"transit" and kitchen's "mark as done" moving it straight to `ready_to_serve` (skipping a separate "prepared" state to avoid a redundant click). Adjust in `.agents/db_schema.md` if you want them kept separate.

**Simple example:** Order #58 → `order_items`: 1x Paneer Tikka (₹220), 2x Naan (₹40 each). `orders.status = 'accepted'` the moment kitchen taps Accept; kitchen taps "Mark Done" → status flips to `ready_to_serve` and the card disappears from the kitchen board, matching your spec.

---

## 7. API Design (REST)

**Public / Guest (no auth, session-token header `X-Session-Token`)**
- `POST /api/session` → creates guest session, returns token
- `GET /api/dishes` → list with availability
- `POST /api/waiter-call` → `{table_no}` → pushes to waiter WS channel
- `POST /api/cart/items`, `PATCH /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`
- `POST /api/orders` → places order from cart
- `GET /api/orders/history` → this session's orders with live status
- `POST /api/chat/message` → `{message}` → returns AI reply + optional dish recommendation cards

**Auth**
- `POST /api/auth/login` → `{name, password}` → JWT (staff only)

**Waiter** (JWT, role=waiter) — reuses guest dish/cart/order endpoints + gets `waiter_call` WS events

**Kitchen** (JWT, role=kitchen)
- `GET /api/kitchen/queue`
- `POST /api/kitchen/orders/{id}/accept`
- `POST /api/kitchen/orders/{id}/done`
- `POST /api/kitchen/orders/{id}/delay` → `{minutes, reason}`

**Billing** (JWT, role=billing)
- `GET /api/billing/orders?paid=false`
- `POST /api/billing/orders/{id}/status` → `{status: "served"|"paid"}`

**Admin** (JWT, role=admin)
- `GET /api/admin/analytics?range=daily|weekly|monthly`
- `GET /api/admin/insights` → 3 AI-generated insights, computed on login and cached

**Simple example — placing an order:**
```
POST /api/orders
Headers: X-Session-Token: g_7f3a1c
Body:    { "items": [{"dish_id": 12, "quantity": 2}] }

Response 201:
{ "order_id": 58, "status": "placed", "total": 440 }
```

---

## 8. Real-Time Strategy (WebSockets)

Single WS endpoint `/ws/{channel}?token=...`, channels:
- `guest:{session_token}` — order status pushes back to that guest
- `waiter` — waiter-call notifications (toast)
- `kitchen` — new/accepted/delayed orders
- `billing` — orders ready to be marked served/paid
- `admin` — optional live analytics ticks

`ConnectionManager` in `backend/app/ws/connection_manager.py` keeps a dict of channel → set of sockets, and broadcasts on every status change from `order_service.py`.

**Simple example:** Kitchen accepts order #58 → service updates DB → `connection_manager.broadcast("guest:g_7f3a1c", {"order_id":58,"status":"accepted"})` → guest's Order History page updates instantly, no refresh.

---

## 9. Auth Strategy

- **Guests:** no password. `POST /api/session` issues a signed opaque token (e.g. JWT with no `role`, just `session_id`), stored client-side, sent as a header. No login screen ever shown.
- **Staff:** `name + password` → bcrypt-hashed in DB → JWT with `role` claim → role-based route guards on both backend (`Depends(require_role("kitchen"))`) and frontend (protected routes).

---

## 10. AI Chat Feature (Guest)

- On chat open: AI sends a greeting first (e.g. "Hi! Looking for something spicy, light, or a full meal today?").
- Goal: understand preference and recommend a dish **within 4 exchanges**, keeping chat_session context (stored in `chat_messages`, replayed into the Groq call each turn as the `messages` array).
- Runs on Groq's free `openai/gpt-oss-120b` via the `groq` Python SDK (drop-in similar to the OpenAI SDK).
- Ask the model to reply in **strict JSON** (`{"reply": "...", "dish_recommendation": {"dish_id": 12} | null}`) so the backend can parse it reliably — validate/retry once if parsing fails.
- When AI recommends, backend returns a structured `dish_recommendation` block alongside the text reply so the frontend renders an actual `DishCard` (not just text) with an "Add to cart" button.

**Minimal backend call:**
```python
from groq import Groq
client = Groq(api_key=settings.GROQ_API_KEY)

resp = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=chat_history,   # [{"role": "system", ...}, {"role": "user", ...}, ...]
    temperature=0.4,
    response_format={"type": "json_object"},
)
reply_json = json.loads(resp.choices[0].message.content)
```

**Simple example exchange:**
```
AI: Hi! Craving something spicy, light, or a full meal today?
User: something spicy but not too heavy
AI: Got it — how about a starter, not a main?
User: yes starter
AI: Perfect, I'd suggest our Chilli Paneer 🌶️ — crispy, spicy, great as a starter.
     [Dish Card: Chilli Paneer — ₹190 — Add to Cart]
```

---

## 11. Admin AI Insights

- On every admin login, `insight_service.py` pulls last 24h/7d aggregates (top dishes, avg prep time, delayed orders, revenue trend) and asks Groq (`openai/gpt-oss-120b`) to produce exactly **3 short insights**, cached for e.g. 15 minutes so it's not recomputed on every page refresh and to stay well inside the free-tier rate limit.

**Simple example output:**
```
1. "Paneer Tikka is your top seller today (32 orders) — consider pre-prepping."
2. "Average kitchen delay rose to 9 min after 8 PM — likely a staffing gap."
3. "Table 4 has the highest repeat-order rate this week."
```

---

## 12. Development Phases (Roadmap)

1. **Foundation** — repo scaffold, `.agents/` files, Poetry + Vite setup, pre-commit hooks, SQLite models & migrations.
2. **Guest core** — session creation, dish landing page, cart (add/edit), place order, order history (polling first, WS later).
3. **Realtime layer** — WebSocket manager, wire order status + waiter-call live updates.
4. **Waiter** — login/auth, reuse guest UI, waiter-call toast notifications.
5. **Kitchen** — login, kitchen queue page, accept/done/delay actions.
6. **Billing** — login, order cards, served/paid status, paid/unpaid sections.
7. **Guest AI chat** — greeting, 4-turn preference flow, dish recommendation cards.
8. **Admin dashboard** — analytics charts, daily/weekly/monthly filters, 3 AI insights on login.
9. **Polish** — error states, empty states, loading states, responsive check, seed data/demo script.

---

## 13. Pre-commit Setup

`.pre-commit-config.yaml` (root):
```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.4.2
    hooks: [{id: black, files: ^backend/}]
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.5.0
    hooks: [{id: ruff, files: ^backend/}]
  - repo: local
    hooks:
      - id: frontend-lint
        name: eslint
        entry: bash -c 'cd frontend && npx eslint src'
        language: system
        files: ^frontend/
      - id: frontend-format
        name: prettier
        entry: bash -c 'cd frontend && npx prettier --check src'
        language: system
        files: ^frontend/
```

---

## 14. Scalability Notes

- SQLite is fine for MVP/demo; swap to Postgres by changing the SQLAlchemy URL only (models already ORM-based, no raw SQL).
- Keep `services/` decoupled from `routers/` so business logic can later move behind a message queue (e.g. order events → Redis pub/sub) without touching route handlers.
- WebSocket `ConnectionManager` is in-memory per process — fine for one server; if you scale to multiple backend instances later, back it with Redis pub/sub.

---

**Next step:** create the `.agents/` files first (Section 5), then scaffold `backend/` and `frontend/` per Section 4 — that gives the AI IDE everything it needs to generate consistent code from Phase 1 onward.
