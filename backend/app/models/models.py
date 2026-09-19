from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # waiter, kitchen, billing, admin
    created_at = Column(DateTime, default=utcnow)

    orders = relationship("Order", back_populates="waiter")


class GuestSession(Base):
    __tablename__ = "guest_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_token = Column(String(64), unique=True, index=True, nullable=False)
    table_no = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=utcnow)
    last_active = Column(DateTime, default=utcnow, onupdate=utcnow)

    orders = relationship("Order", back_populates="guest_session")
    chat_sessions = relationship("ChatSession", back_populates="guest_session")
    waiter_calls = relationship("WaiterCall", back_populates="guest_session")


class Dish(Base):
    __tablename__ = "dishes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    price = Column(Float, nullable=False)
    image_url = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)  # Starter, Main, Dessert, Drink, etc.
    is_available = Column(Boolean, default=True)
    description = Column(Text, nullable=True)

    order_items = relationship("OrderItem", back_populates="dish")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    guest_session_id = Column(Integer, ForeignKey("guest_sessions.id"), nullable=True)
    waiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    table_no = Column(Integer, nullable=False, index=True)
    status = Column(
        String(30),
        default="placed",
        nullable=False,
        index=True,
    )  # placed, confirmed, accepted, preparing, ready_to_serve, served, paid
    is_delayed = Column(Boolean, default=False)
    delay_reason = Column(Text, nullable=True)
    delay_minutes = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    guest_session = relationship("GuestSession", back_populates="orders")
    waiter = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    dish_id = Column(Integer, ForeignKey("dishes.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    note = Column(Text, nullable=True)
    price_at_order = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    dish = relationship("Dish", back_populates="order_items")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    guest_session_id = Column(Integer, ForeignKey("guest_sessions.id"), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    guest_session = relationship("GuestSession", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="chat_session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    sender = Column(String(10), nullable=False)  # user, ai
    message = Column(Text, nullable=False)
    dish_recommendation_id = Column(Integer, ForeignKey("dishes.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    chat_session = relationship("ChatSession", back_populates="messages")
    dish_recommendation = relationship("Dish")


class WaiterCall(Base):
    __tablename__ = "waiter_calls"

    id = Column(Integer, primary_key=True, index=True)
    table_no = Column(Integer, nullable=False, index=True)
    guest_session_id = Column(Integer, ForeignKey("guest_sessions.id"), nullable=True)
    status = Column(String(20), default="pending", nullable=False)  # pending, acknowledged
    created_at = Column(DateTime, default=utcnow)

    guest_session = relationship("GuestSession", back_populates="waiter_calls")
