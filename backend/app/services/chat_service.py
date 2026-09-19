from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.models.models import ChatSession, ChatMessage, Dish, GuestSession
from app.services.ai_service import generate_chat_reply


def serialize_dish(dish: Optional[Dish]) -> Optional[dict]:
    if not dish:
        return None
    return {
        "id": dish.id,
        "name": dish.name,
        "price": dish.price,
        "image_url": dish.image_url,
        "category": dish.category,
        "is_available": dish.is_available,
        "description": dish.description,
    }


def serialize_chat_message(msg: ChatMessage) -> dict:
    return {
        "id": msg.id,
        "sender": msg.sender,
        "message": msg.message,
        "dish_recommendation_id": msg.dish_recommendation_id,
        "dish_recommendation": serialize_dish(msg.dish_recommendation),
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


def get_or_create_chat_session(db: Session, guest_session: GuestSession) -> ChatSession:
    chat_session = (
        db.query(ChatSession)
        .options(joinedload(ChatSession.messages).joinedload(ChatMessage.dish_recommendation))
        .filter(ChatSession.guest_session_id == guest_session.id)
        .first()
    )
    if not chat_session:
        chat_session = ChatSession(guest_session_id=guest_session.id)
        db.add(chat_session)
        db.flush()

        # Initial greeting from AI
        greeting = ChatMessage(
            chat_session_id=chat_session.id,
            sender="ai",
            message="Hi! Looking for something spicy, light, or a full meal today? I'm here to help you choose the perfect plate.",
        )
        db.add(greeting)
        db.commit()
        db.refresh(chat_session)

    return chat_session


def post_user_message(db: Session, guest_session: GuestSession, user_text: str) -> dict:
    chat_session = get_or_create_chat_session(db, guest_session)

    # Save user message
    user_msg = ChatMessage(
        chat_session_id=chat_session.id,
        sender="user",
        message=user_text.strip(),
    )
    db.add(user_msg)
    db.commit()

    # Load history
    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_session_id == chat_session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    history_dicts = [{"sender": m.sender, "message": m.message} for m in history]

    # Load available dishes
    dishes = db.query(Dish).filter(Dish.is_available == True).all()  # noqa: E712
    dish_list = [
        {
            "id": d.id,
            "name": d.name,
            "price": d.price,
            "category": d.category,
            "description": d.description,
        }
        for d in dishes
    ]

    # Call AI
    ai_reply_text, rec_dish_id = generate_chat_reply(history_dicts, dish_list)

    ai_msg = ChatMessage(
        chat_session_id=chat_session.id,
        sender="ai",
        message=ai_reply_text,
        dish_recommendation_id=rec_dish_id,
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    # Return serialized ai_msg
    return serialize_chat_message(ai_msg)


def get_chat_history(db: Session, guest_session: GuestSession) -> list[dict]:
    chat_session = get_or_create_chat_session(db, guest_session)
    messages = (
        db.query(ChatMessage)
        .options(joinedload(ChatMessage.dish_recommendation))
        .filter(ChatMessage.chat_session_id == chat_session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [serialize_chat_message(m) for m in messages]
