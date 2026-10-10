from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from backend.models.user import UserRole, ConsumerType

class AdminUserItem(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: UserRole
    consumer_type: ConsumerType
    location: Optional[str] = None
    monthly_budget: float
    records_count: int
    predictions_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_consumption_records: int
    total_predictions: int
    total_alerts: int
    average_efficiency_score: float

class SystemActivityPoint(BaseModel):
    date: str
    records_logged: int
    predictions_run: int
    alerts_triggered: int

class AdminDashboardData(BaseModel):
    stats: AdminStatsResponse
    users: List[AdminUserItem]
    activity_trends: List[SystemActivityPoint]
