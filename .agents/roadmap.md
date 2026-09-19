# Roadmap & Progress Checklist

- [x] **Phase 1: Foundation & AI IDE Context**
  - [x] Create `.agents/` folder and context documents (`agents.md`, `architecture.md`, `conventions.md`, `db_schema.md`, `roadmap.md`)
  - [x] Pre-commit configuration (`.pre-commit-config.yaml`)
  - [x] Backend Poetry setup & dependencies
  - [x] Frontend Vite React setup

- [x] **Phase 2: Database & Backend Services**
  - [x] SQLAlchemy models & database engine setup
  - [x] Core security, JWT auth, and guest session tracking
  - [x] WebSocket ConnectionManager with multi-channel broadcasting
  - [x] Order service with status state-machine and kitchen delay tracking
  - [x] Chat service with Groq API integration (`openai/gpt-oss-120b`) and fallback
  - [x] Insight service with aggregations and cached insights
  - [x] Seed script with test users and realistic gourmet menu items

- [x] **Phase 3: Backend REST & WebSocket Endpoints**
  - [x] `/api/auth` (login, me)
  - [x] `/api/session`, `/api/dishes`, `/api/orders`, `/api/waiter-call`
  - [x] `/api/kitchen/queue`, `/api/kitchen/orders/{id}/*`
  - [x] `/api/billing/orders`, `/api/billing/orders/{id}/status`
  - [x] `/api/waiter/calls`, `/api/waiter/calls/{id}/ack`
  - [x] `/api/admin/analytics`, `/api/admin/insights`
  - [x] `/api/chat/message`, `/api/chat/history`
  - [x] `/ws/{channel}` real-time endpoint

- [x] **Phase 4: Frontend Design System & State Management**
  - [x] Pure CSS luxury dark dining design system in `src/index.css`
  - [x] Zustand stores (`useCartStore`, `useSessionStore`, `useAuthStore`)
  - [x] API integration client (`src/api/index.js`)
  - [x] Custom `useWebSocket` hook with reconnection and channel subscriptions

- [x] **Phase 5: Frontend Role Pages & Components**
  - [x] Navigation bar & Role switch / login modal
  - [x] Guest Landing Page (dish browsing, categories, filtering, add to cart)
  - [x] Cart Page / Drawer with checkout & table assignment
  - [x] Order Status Page with real-time stepper and delay warnings
  - [x] Waiter Call float button & acknowledgement flow
  - [x] AI Dining Concierge chat window with interactive recommendation cards
  - [x] Kitchen Queue Board with accept, done, and delay modal
  - [x] Billing Board with itemized receipts, served and payment triggers
  - [x] Admin Analytics Dashboard with metrics, date ranges, and AI insights

- [x] **Phase 6: Verification & End-to-End Testing**
  - [x] Verify multi-client real-time synchronization
  - [x] Build verification & smoke tests
