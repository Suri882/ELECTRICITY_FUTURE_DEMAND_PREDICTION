from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class SimulationRecord(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_name = Column(String(120), nullable=False)
    peak_reduction_pct = Column(Float, default=0.0)
    peak_shift_pct = Column(Float, default=0.0)
    baseline_kwh = Column(Float, nullable=False)
    simulated_kwh = Column(Float, nullable=False)
    kwh_saved = Column(Float, nullable=False)
    baseline_cost = Column(Float, nullable=False)
    simulated_cost = Column(Float, nullable=False)
    cost_saved = Column(Float, nullable=False)
    emissions_saved_kg = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="simulations")
