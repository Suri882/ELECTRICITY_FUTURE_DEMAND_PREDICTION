from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.models.alert import AlertType, AlertSeverity

class AlertResponse(BaseModel):
    id: int
    user_id: int
    alert_type: AlertType
    title: str
    message: str
    severity: AlertSeverity
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationTokenCreate(BaseModel):
    device_token: str
    platform: str = "web"
