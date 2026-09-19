# Architecture

## 1. High-Level Architecture

```
restaurant-platform/
├── backend/                 # FastAPI app (Poetry project)
├── frontend/                # React app (Vite)
├── .agents/                 # AI IDE context
├── .pre-commit-config.yaml
└── docker-compose.yml       # (optional, later)
```

Request flow, simple example:
Guest adds "Paneer Tikka" to cart → `POST /api/orders` → row created in `orders` + `order_items` with status `placed` → WebSocket event pushed to `kitchen` channel → kitchen staff sees it appear live, no refresh needed.

## 2. Database Schema (SQLite)

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

**Status Lifecycle:**
`placed` → `confirmed` → `accepted` → `preparing` → `ready_to_serve` → `served` → `paid`

## 3. API Design (REST)

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
- `GET /api/auth/me` → current user info

**Waiter** (JWT, role=waiter)
- Reuses guest dish/cart/order endpoints + gets `waiter_call` WS events
- `GET /api/waiter/calls`
- `POST /api/waiter/calls/{id}/ack`

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

## 4. Real-Time Strategy (WebSockets)

Single WS endpoint `/ws/{channel}?token=...`, channels:
- `guest:{session_token}` — order status pushes back to that guest
- `waiter` — waiter-call notifications (toast)
- `kitchen` — new/accepted/delayed orders
- `billing` — orders ready to be marked served/paid
- `admin` — live analytics ticks
