import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class AlertType(str, enum.Enum):
    HIGH_DEMAND = "HIGH_DEMAND"
    ANOMALY = "ANOMALY"
    BUDGET = "BUDGET"
    RECOMMENDATION = "RECOMMENDATION"
    REPORT = "REPORT"
    SYSTEM = "SYSTEM"

class AlertSeverity(str, enum.Enum):
    Info = "Info"
    Warning = "Warning"
    Critical = "Critical"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(Enum(AlertType), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.Info, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="alerts")
