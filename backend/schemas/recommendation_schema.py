from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.models.recommendation import RecommendationPriority

class RecommendationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    reason: str
    action: str
    priority: RecommendationPriority
    expected_benefit: str
    created_at: datetime

    class Config:
        from_attributes = True
