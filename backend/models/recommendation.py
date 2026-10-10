import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class RecommendationPriority(str, enum.Enum):
    Low = "Low"
    Medium = "Medium"
    High = "High"
    Urgent = "Urgent"

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    reason = Column(Text, nullable=False)
    action = Column(Text, nullable=False)
    priority = Column(Enum(RecommendationPriority), default=RecommendationPriority.Medium, nullable=False)
    expected_benefit = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="recommendations")
