import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from backend.database import Base

class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class ConsumerType(str, enum.Enum):
    Household = "Household"
    College = "College"
    Office = "Office"
    SmallIndustry = "Small Industry"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(160), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True, default="")
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    consumer_type = Column(Enum(ConsumerType), default=ConsumerType.Household, nullable=False)
    location = Column(String(120), nullable=True)
    monthly_budget = Column(Float, default=0.0)
    avg_monthly_consumption = Column(Float, default=0.0)
    notification_enabled = Column(Boolean, default=True, nullable=False)
    
    # Energy Intelligence Settings
    demand_threshold_low = Column(Float, default=250.0)
    demand_threshold_medium = Column(Float, default=450.0)
    demand_threshold_high = Column(Float, default=700.0)
    base_tariff_rate = Column(Float, default=7.50)
    peak_tariff_multiplier = Column(Float, default=1.40)
    fixed_charges = Column(Float, default=120.0)
    tax_percentage = Column(Float, default=5.00)
    grid_emission_factor = Column(Float, default=0.82)
    weather_city = Column(String(120), default="Bengaluru")
    weather_latitude = Column(Float, default=12.9716)
    weather_longitude = Column(Float, default=77.5946)
    demo_mode = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    electricity_records = relationship("ElectricityRecord", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    notification_tokens = relationship("NotificationToken", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    simulations = relationship("SimulationRecord", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", backref="user", cascade="all, delete-orphan", order_by="Project.id.desc()")
