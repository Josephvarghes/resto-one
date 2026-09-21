import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.core.security import get_password_hash
from app.models.models import User, Dish, GuestSession

# In-memory SQLite database isolated for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    # Seed test users
    users = [
        User(name="admin", password_hash=get_password_hash("admin123"), role="admin"),
        User(name="waiter", password_hash=get_password_hash("waiter123"), role="waiter"),
        User(name="kitchen", password_hash=get_password_hash("kitchen123"), role="kitchen"),
        User(name="billing", password_hash=get_password_hash("billing123"), role="billing"),
    ]
    session.add_all(users)

    # Seed test dishes
    dishes = [
        Dish(name="Paneer Tikka Royale", price=260.0, category="Starters", is_available=True, description="Spicy charred paneer"),
        Dish(name="Dal Makhani Grand Cru", price=320.0, category="Mains", is_available=True, description="Rich slow cooked lentils"),
        Dish(name="Butter Naan", price=90.0, category="Breads", is_available=True, description="Clay oven naan"),
        Dish(name="Belgian Chocolate Fondant", price=260.0, category="Desserts", is_available=True, description="Molten chocolate cake"),
        Dish(name="Kaffir Lime Cooler", price=160.0, category="Beverages", is_available=True, description="Fresh lime and mint"),
    ]
    session.add_all(dishes)
    session.commit()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Helper to generate bearer tokens for all roles"""
    tokens = {}
    for role, user_name in [("admin", "admin"), ("waiter", "waiter"), ("kitchen", "kitchen"), ("billing", "billing")]:
        res = client.post("/api/auth/login", json={"name": user_name, "password": f"{user_name}123"})
        tokens[role] = {"Authorization": f"Bearer {res.json()['access_token']}"}
    return tokens
