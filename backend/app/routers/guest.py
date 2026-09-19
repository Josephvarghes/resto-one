import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import GuestSession, Dish
from app.schemas.schemas import (
    SessionCreateIn,
    SessionOut,
    DishOut,
    OrderCreateIn,
    WaiterCallIn,
)
from app.services.auth_service import get_guest_session, require_guest_session
from app.services.order_service import create_order, get_guest_orders
from app.services.waiter_service import create_waiter_call

router = APIRouter(prefix="/api", tags=["Guest"])


@router.post("/session", response_model=SessionOut)
def create_guest_session(
    payload: SessionCreateIn,
    x_session_token: Optional[str] = Header(None, alias="X-Session-Token"),
    db: Session = Depends(get_db),
):
    # If a valid token is provided and exists, update its table_no
    if x_session_token:
        existing = db.query(GuestSession).filter(GuestSession.session_token == x_session_token).first()
        if existing:
            existing.table_no = payload.table_no
            db.commit()
            db.refresh(existing)
            return existing

    # Create new session
    token = f"g_{uuid.uuid4().hex[:12]}"
    session = GuestSession(session_token=token, table_no=payload.table_no)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/dishes", response_model=List[DishOut])
def get_dishes(
    category: Optional[str] = None,
    available_only: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(Dish)
    if available_only:
        query = query.filter(Dish.is_available == True)  # noqa: E712
    if category:
        query = query.filter(Dish.category.ilike(f"%{category}%"))
    return query.order_by(Dish.category, Dish.name).all()


@router.post("/orders")
async def place_order(
    order_in: OrderCreateIn,
    guest_session: GuestSession = Depends(require_guest_session),
    db: Session = Depends(get_db),
):
    order = await create_order(db=db, order_in=order_in, guest_session=guest_session)
    return {
        "order_id": order.id,
        "status": order.status,
        "table_no": order.table_no,
        "message": "Order placed successfully",
    }


@router.get("/orders/history")
def get_order_history(
    guest_session: GuestSession = Depends(require_guest_session),
    db: Session = Depends(get_db),
):
    return get_guest_orders(db, guest_session.id)


@router.post("/waiter-call")
async def call_waiter(
    payload: WaiterCallIn,
    guest_session: Optional[GuestSession] = Depends(get_guest_session),
    db: Session = Depends(get_db),
):
    call = await create_waiter_call(
        db=db,
        table_no=payload.table_no,
        guest_session_id=guest_session.id if guest_session else None,
    )
    return {"message": "Waiter notified", "call": call}
