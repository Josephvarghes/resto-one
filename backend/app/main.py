from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.seed import seed_database
from app.routers import (
    auth,
    guest,
    waiter,
    kitchen,
    billing,
    admin,
    chat,
    ws,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup tables and initial seed data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multi-role restaurant experience platform with real-time WebSockets and AI recommendations.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(guest.router)
app.include_router(waiter.router)
app.include_router(kitchen.router)
app.include_router(billing.router)
app.include_router(admin.router)
app.include_router(chat.router)
app.include_router(ws.router)


@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "status": "operational",
        "roles": ["guest", "waiter", "kitchen", "billing", "admin"],
        "docs_url": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "healthy"}
