from datetime import datetime, date
from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class ElectricityRecord(Base):
    __tablename__ = "electricity_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    units_consumed = Column(Float, nullable=False)
    bill_amount = Column(Float, nullable=False)
    number_of_days = Column(Integer, nullable=False, default=30)
    peak_usage = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="electricity_records")
    predictions = relationship("Prediction", back_populates="record")
    anomalies = relationship("Anomaly", back_populates="record")
