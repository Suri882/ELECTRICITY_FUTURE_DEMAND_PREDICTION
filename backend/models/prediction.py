import enum
from datetime import datetime
from sqlalchemy import Column, Integer, Float, Date, DateTime, String, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class DemandLevel(str, enum.Enum):
    Low = "Low"
    Normal = "Normal"
    High = "High"
    Critical = "Critical"

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    record_id = Column(Integer, ForeignKey("electricity_records.id", ondelete="SET NULL"), nullable=True)
    predicted_demand = Column(Float, nullable=False)
    demand_level = Column(Enum(DemandLevel), nullable=False)
    prediction_quality = Column(String(50), default="Good")
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2_score = Column(Float, nullable=True)
    model_name = Column(String(80), default="Ridge Regression")
    prediction_date = Column(Date, nullable=False, index=True)
    forecast_period = Column(String(20), default="30d")
    temperature = Column(Float, nullable=True)
    weather_condition = Column(String(80), nullable=True)
    details_json = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="predictions")
    record = relationship("ElectricityRecord", back_populates="predictions")
