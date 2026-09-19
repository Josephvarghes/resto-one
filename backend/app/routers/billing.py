from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import OrderStatusUpdateIn
from app.services.auth_service import require_roles
from app.services.order_service import get_billing_orders, update_kitchen_order_status

router = APIRouter(prefix="/api/billing", tags=["Billing"])


@router.get("/orders")
def get_orders(
    paid: bool = False,
    current_user: User = Depends(require_roles(["billing", "admin"])),
    db: Session = Depends(get_db),
):
    return get_billing_orders(db, paid=paid)


@router.post("/orders/{order_id}/status")
async def update_status(
    order_id: int,
    payload: OrderStatusUpdateIn,
    current_user: User = Depends(require_roles(["billing", "admin"])),
    db: Session = Depends(get_db),
):
    return await update_kitchen_order_status(db, order_id, payload.status)
