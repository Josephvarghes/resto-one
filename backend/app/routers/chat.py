from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import GuestSession
from app.schemas.schemas import ChatMessageIn, ChatMessageOut
from app.services.auth_service import require_guest_session
from app.services.chat_service import post_user_message, get_chat_history

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/message", response_model=ChatMessageOut)
def send_message(
    payload: ChatMessageIn,
    guest_session: GuestSession = Depends(require_guest_session),
    db: Session = Depends(get_db),
):
    return post_user_message(db, guest_session, payload.message)


@router.get("/history", response_model=List[ChatMessageOut])
def history(
    guest_session: GuestSession = Depends(require_guest_session),
    db: Session = Depends(get_db),
):
    return get_chat_history(db, guest_session)
