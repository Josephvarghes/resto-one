# RestoOne — Restaurant Guest Experience Platform

A multi-role real-time restaurant ordering and management system.

## Roles Supported
- **Guest**: Browse menu, call waiter, order food, live order tracking, and AI dining concierge recommendations.
- **Waiter**: Live table call notifications and floor order punching.
- **Kitchen**: Live order queue, ticket preparation timer, accept, mark done, and delay alerts.
- **Billing**: Live receipts, mark served, and bill settlement.
- **Admin**: Revenue analytics, ticket metrics, and AI operational insights.

---

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy, SQLite, WebSockets, Poetry, Groq AI (`openai/gpt-oss-120b`).
- **Frontend**: React, Vite, Zustand, Vanilla CSS luxury design system.

---

## Quick Start

### 1. Backend Setup
```bash
cd backend
poetry install
poetry run python -m app.seed
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Backend API will run at `http://localhost:8000` (Docs at `http://localhost:8000/docs`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will run at `http://localhost:5173`.

---

## Demo Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Kitchen | `kitchen` | `kitchen123` |
| Waiter | `waiter` | `waiter123` |
| Billing | `billing` | `billing123` |

*Guests do not require credentials — their session is automatically tracked via table session tokens.*
