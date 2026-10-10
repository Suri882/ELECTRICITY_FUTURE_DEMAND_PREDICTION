from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.user import User
from backend.models.alert import Alert
from backend.models.notification_token import NotificationToken
from backend.schemas.alert_schema import AlertResponse, NotificationTokenCreate
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Notifications"])

@router.get("", response_model=List[AlertResponse])
def get_user_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alerts = (
        db.query(Alert)
        .filter(Alert.user_id == current_user.id)
        .order_by(Alert.created_at.desc())
        .all()
    )
    return [AlertResponse.model_validate(a) for a in alerts]

@router.put("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_as_read(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id, Alert.user_id == current_user.id)
        .first()
    )
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert notification not found."
        )
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return AlertResponse.model_validate(alert)

@router.put("/mark-all-read")
def mark_all_alerts_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Alert).filter(
        Alert.user_id == current_user.id,
        Alert.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read."}

@router.post("/token")
def register_device_token(
    req: NotificationTokenCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(NotificationToken).filter(
        NotificationToken.user_id == current_user.id,
        NotificationToken.device_token == req.device_token
    ).first()

    if not existing:
        token = NotificationToken(
            user_id=current_user.id,
            device_token=req.device_token,
            platform=req.platform
        )
        db.add(token)
        db.commit()

    return {"message": "Notification token registered successfully."}
