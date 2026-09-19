from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import OrderDelayIn
from app.services.auth_service import require_roles
from app.services.order_service import (
    get_kitchen_queue,
    update_kitchen_order_status,
    set_kitchen_delay,
)

router = APIRouter(prefix="/api/kitchen", tags=["Kitchen"])


@router.get("/queue")
def get_queue(
    current_user: User = Depends(require_roles(["kitchen", "admin"])),
    db: Session = Depends(get_db),
):
    return get_kitchen_queue(db)


@router.post("/orders/{order_id}/accept")
async def accept_order(
    order_id: int,
    current_user: User = Depends(require_roles(["kitchen", "admin"])),
    db: Session = Depends(get_db),
):
    return await update_kitchen_order_status(db, order_id, "accepted")


@router.post("/orders/{order_id}/done")
async def mark_done(
    order_id: int,
    current_user: User = Depends(require_roles(["kitchen", "admin"])),
    db: Session = Depends(get_db),
):
    # Moves straight to ready_to_serve per project plan
    return await update_kitchen_order_status(db, order_id, "ready_to_serve")


@router.post("/orders/{order_id}/delay")
async def report_delay(
    order_id: int,
    delay_in: OrderDelayIn,
    current_user: User = Depends(require_roles(["kitchen", "admin"])),
    db: Session = Depends(get_db),
):
    return await set_kitchen_delay(db, order_id, delay_in)
