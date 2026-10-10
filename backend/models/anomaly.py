import enum
from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class AnomalySeverity(str, enum.Enum):
    Normal = "Normal"
    Unusual = "Unusual"
    HighlyUnusual = "Highly Unusual"

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    record_id = Column(Integer, ForeignKey("electricity_records.id", ondelete="SET NULL"), nullable=True)
    anomaly_score = Column(Float, nullable=False)
    severity = Column(Enum(AnomalySeverity), nullable=False)
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="anomalies")
    record = relationship("ElectricityRecord", back_populates="anomalies")
