from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.models.anomaly import AnomalySeverity

class AnomalyResponse(BaseModel):
    id: int
    user_id: int
    record_id: Optional[int] = None
    anomaly_score: float
    severity: AnomalySeverity
    explanation: str
    created_at: datetime
    record_date: Optional[str] = None
    record_units: Optional[float] = None

    class Config:
        from_attributes = True
