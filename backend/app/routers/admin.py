from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import AdminAnalyticsOut, AdminInsightOut
from app.services.auth_service import require_roles
from app.services.insight_service import get_analytics, get_ai_insights

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/analytics", response_model=AdminAnalyticsOut)
def analytics(
    range: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    return get_analytics(db, range)


@router.get("/insights", response_model=AdminInsightOut)
def insights(
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    return get_ai_insights(db)
