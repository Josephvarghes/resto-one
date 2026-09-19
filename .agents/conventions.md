# Conventions

## Backend conventions
- snake_case for Python, PascalCase for models, Pydantic schemas suffixed `In`/`Out`.
- One router per role/domain, one service per domain.
- All DB writes go through services, never directly in routers.
- Handle exceptions gracefully with HTTP status codes.
- Fast, secure password hashing using passlib / bcrypt.
- Fixed order status enum: `placed`, `confirmed`, `accepted`, `preparing`, `ready_to_serve`, `served`, `paid`.

## Frontend conventions
- One component per file, PascalCase filenames.
- Cart state lives in a single Zustand store (`useCartStore`).
- Guest session lives in `useSessionStore`.
- Staff authentication state lives in `useAuthStore`.
- All API calls go through `src/api/`, never inline fetch in components.
- WebSocket events handled through `useWebSocket` hook.
- Modern luxury design system in `src/index.css` using custom properties, responsive design, dark slate aesthetics, and gold/amber highlights.
