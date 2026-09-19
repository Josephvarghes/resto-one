from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.models import Order, OrderItem, Dish, GuestSession, User
from app.schemas.schemas import OrderCreateIn, OrderDelayIn
from app.ws.connection_manager import ws_manager


def serialize_order(order: Order) -> dict:
    total = sum(item.price_at_order * item.quantity for item in order.items)
    return {
        "id": order.id,
        "guest_session_id": order.guest_session_id,
        "waiter_id": order.waiter_id,
        "waiter_name": order.waiter.name if order.waiter else None,
        "table_no": order.table_no,
        "status": order.status,
        "is_delayed": order.is_delayed,
        "delay_reason": order.delay_reason,
        "delay_minutes": order.delay_minutes,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "total_amount": round(total, 2),
        "items": [
            {
                "id": item.id,
                "dish_id": item.dish_id,
                "dish_name": item.dish.name if item.dish else "Unknown",
                "quantity": item.quantity,
                "note": item.note,
                "price_at_order": item.price_at_order,
                "item_total": round(item.price_at_order * item.quantity, 2),
            }
            for item in order.items
        ],
    }


async def create_order(
    db: Session,
    order_in: OrderCreateIn,
    guest_session: Optional[GuestSession] = None,
    waiter: Optional[User] = None,
) -> Order:
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item",
        )

    table_no = order_in.table_no
    if table_no is None:
        if guest_session:
            table_no = guest_session.table_no
        else:
            table_no = 1

    order = Order(
        guest_session_id=guest_session.id if guest_session else None,
        waiter_id=waiter.id if waiter else None,
        table_no=table_no,
        status="placed",
        is_delayed=False,
    )
    db.add(order)
    db.flush()

    dish_ids = [item.dish_id for item in order_in.items]
    dishes = {d.id: d for d in db.query(Dish).filter(Dish.id.in_(dish_ids)).all()}

    for item_data in order_in.items:
        dish = dishes.get(item_data.dish_id)
        if not dish:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dish ID {item_data.dish_id} not found",
            )
        if not dish.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dish '{dish.name}' is currently unavailable",
            )
        order_item = OrderItem(
            order_id=order.id,
            dish_id=dish.id,
            quantity=item_data.quantity,
            note=item_data.note,
            price_at_order=dish.price,
        )
        db.add(order_item)

    db.commit()
    db.refresh(order)

    # Broadcast via WebSockets
    serialized = serialize_order(order)
    await ws_manager.broadcast("kitchen", {"event": "order_created", "order": serialized})
    await ws_manager.broadcast("waiter", {"event": "order_created", "order": serialized})
    await ws_manager.broadcast("billing", {"event": "order_created", "order": serialized})
    await ws_manager.broadcast("admin", {"event": "order_created", "order": serialized})
    if guest_session and guest_session.session_token:
        await ws_manager.broadcast(
            f"guest:{guest_session.session_token}",
            {"event": "order_created", "order": serialized},
        )

    return order


def get_guest_orders(db: Session, guest_session_id: int) -> List[dict]:
    orders = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.dish), joinedload(Order.waiter))
        .filter(Order.guest_session_id == guest_session_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [serialize_order(o) for o in orders]


def get_kitchen_queue(db: Session) -> List[dict]:
    # Active orders for kitchen: placed, confirmed, accepted, preparing
    orders = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.dish), joinedload(Order.waiter))
        .filter(Order.status.in_(["placed", "confirmed", "accepted", "preparing"]))
        .order_by(Order.created_at.asc())
        .all()
    )
    return [serialize_order(o) for o in orders]


async def update_kitchen_order_status(
    db: Session, order_id: int, new_status: str
) -> dict:
    valid_statuses = ["placed", "confirmed", "accepted", "preparing", "ready_to_serve", "served", "paid"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {new_status}. Must be one of {valid_statuses}",
        )
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.dish), joinedload(Order.waiter), joinedload(Order.guest_session))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = new_status
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)

    serialized = serialize_order(order)
    channels = ["kitchen", "waiter", "billing", "admin"]
    if order.guest_session and order.guest_session.session_token:
        channels.append(f"guest:{order.guest_session.session_token}")

    await ws_manager.broadcast_to_multiple(channels, {"event": "order_status_updated", "order": serialized})
    return serialized


async def set_kitchen_delay(
    db: Session, order_id: int, delay_in: OrderDelayIn
) -> dict:
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.dish), joinedload(Order.waiter), joinedload(Order.guest_session))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.is_delayed = True
    order.delay_minutes = delay_in.minutes
    order.delay_reason = delay_in.reason
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)

    serialized = serialize_order(order)
    channels = ["kitchen", "waiter", "billing", "admin"]
    if order.guest_session and order.guest_session.session_token:
        channels.append(f"guest:{order.guest_session.session_token}")

    await ws_manager.broadcast_to_multiple(channels, {"event": "order_delayed", "order": serialized})
    return serialized


def get_billing_orders(db: Session, paid: bool = False) -> List[dict]:
    query = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.dish), joinedload(Order.waiter))
    )
    if paid:
        query = query.filter(Order.status == "paid")
    else:
        query = query.filter(Order.status != "paid")

    orders = query.order_by(Order.created_at.desc()).all()
    return [serialize_order(o) for o in orders]
