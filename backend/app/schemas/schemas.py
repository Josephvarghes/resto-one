from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# --- Auth Schemas ---
class LoginIn(BaseModel):
    name: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    role: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    role: str
    created_at: datetime


# --- Session Schemas ---
class SessionCreateIn(BaseModel):
    table_no: int = Field(default=1, ge=1, le=50)


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    session_token: str
    table_no: int
    created_at: datetime


# --- Dish Schemas ---
class DishOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    price: float
    image_url: Optional[str] = None
    category: str
    is_available: bool
    description: Optional[str] = None


# --- Order Schemas ---
class OrderItemIn(BaseModel):
    dish_id: int
    quantity: int = Field(default=1, ge=1)
    note: Optional[str] = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    dish_id: int
    quantity: int
    note: Optional[str] = None
    price_at_order: float
    dish: Optional[DishOut] = None


class OrderCreateIn(BaseModel):
    table_no: Optional[int] = None
    items: List[OrderItemIn]


class OrderDelayIn(BaseModel):
    minutes: int = Field(ge=1, le=120)
    reason: str


class OrderStatusUpdateIn(BaseModel):
    status: str  # placed, confirmed, accepted, preparing, ready_to_serve, served, paid


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    guest_session_id: Optional[int] = None
    waiter_id: Optional[int] = None
    table_no: int
    status: str
    is_delayed: bool
    delay_reason: Optional[str] = None
    delay_minutes: int
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut] = []
    total_amount: Optional[float] = None


# --- Chat Schemas ---
class ChatMessageIn(BaseModel):
    message: str


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sender: str
    message: str
    dish_recommendation_id: Optional[int] = None
    dish_recommendation: Optional[DishOut] = None
    created_at: datetime


class ChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    guest_session_id: int
    created_at: datetime
    messages: List[ChatMessageOut] = []


# --- Waiter Call Schemas ---
class WaiterCallIn(BaseModel):
    table_no: int


class WaiterCallOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    table_no: int
    guest_session_id: Optional[int] = None
    status: str
    created_at: datetime


# --- Admin Schemas ---
class DishSalesStat(BaseModel):
    dish_id: int
    name: str
    quantity: int
    revenue: float


class AdminAnalyticsOut(BaseModel):
    range: str
    total_orders: int
    total_revenue: float
    avg_order_value: float
    delayed_orders_count: int
    avg_prep_time_minutes: float
    top_selling_dishes: List[DishSalesStat]
    orders_by_status: dict


class AdminInsightOut(BaseModel):
    insights: List[str]
    generated_at: datetime
    cached: bool
