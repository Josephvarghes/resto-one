from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, Order
from app.schemas.schemas import OrderCreateIn, WaiterCallOut
from app.services.auth_service import require_roles
from app.services.order_service import create_order, serialize_order
from app.services.waiter_service import get_pending_waiter_calls, acknowledge_waiter_call

router = APIRouter(prefix="/api/waiter", tags=["Waiter"])


@router.get("/calls", response_model=List[WaiterCallOut])
def get_calls(
    current_user: User = Depends(require_roles(["waiter", "admin"])),
    db: Session = Depends(get_db),
):
    return get_pending_waiter_calls(db)


@router.post("/calls/{call_id}/ack")
async def ack_call(
    call_id: int,
    current_user: User = Depends(require_roles(["waiter", "admin"])),
    db: Session = Depends(get_db),
):
    return await acknowledge_waiter_call(db, call_id)


@router.post("/orders")
async def waiter_place_order(
    order_in: OrderCreateIn,
    current_user: User = Depends(require_roles(["waiter", "admin"])),
    db: Session = Depends(get_db),
):
    order = await create_order(db=db, order_in=order_in, waiter=current_user)
    return {
        "order_id": order.id,
        "status": order.status,
        "table_no": order.table_no,
        "message": "Order created by waiter successfully",
    }


@router.get("/orders")
def get_waiter_orders(
    current_user: User = Depends(require_roles(["waiter", "admin"])),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.status.in_(["placed", "confirmed", "accepted", "preparing", "ready_to_serve", "served"]))
        .order_by(Order.created_at.desc())
        .all()
    )
    return [serialize_order(o) for o in orders]
