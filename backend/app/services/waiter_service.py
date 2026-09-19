from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.models import WaiterCall
from app.ws.connection_manager import ws_manager


def serialize_waiter_call(call: WaiterCall) -> dict:
    return {
        "id": call.id,
        "table_no": call.table_no,
        "guest_session_id": call.guest_session_id,
        "status": call.status,
        "created_at": call.created_at.isoformat() if call.created_at else None,
    }


async def create_waiter_call(
    db: Session, table_no: int, guest_session_id: Optional[int] = None
) -> dict:
    call = WaiterCall(
        table_no=table_no,
        guest_session_id=guest_session_id,
        status="pending",
    )
    db.add(call)
    db.commit()
    db.refresh(call)

    serialized = serialize_waiter_call(call)
    await ws_manager.broadcast("waiter", {"event": "waiter_called", "call": serialized})
    return serialized


def get_pending_waiter_calls(db: Session) -> List[dict]:
    calls = (
        db.query(WaiterCall)
        .filter(WaiterCall.status == "pending")
        .order_by(WaiterCall.created_at.desc())
        .all()
    )
    return [serialize_waiter_call(c) for c in calls]


async def acknowledge_waiter_call(db: Session, call_id: int) -> dict:
    call = db.query(WaiterCall).filter(WaiterCall.id == call_id).first()
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waiter call not found")

    call.status = "acknowledged"
    db.commit()
    db.refresh(call)

    serialized = serialize_waiter_call(call)
    await ws_manager.broadcast("waiter", {"event": "waiter_call_acknowledged", "call": serialized})
    return serialized
