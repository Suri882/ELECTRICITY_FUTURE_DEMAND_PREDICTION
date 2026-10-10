import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from backend.database import Base

class FacilityCategory(str, enum.Enum):
    RESIDENTIAL = "Residential"
    COMMERCIAL = "Commercial"
    PUBLIC_INSTITUTIONAL = "Public and Institutional"
    INDUSTRIAL_INFRASTRUCTURE = "Industrial and Infrastructure"
    CUSTOM = "Custom Facility"

class ProjectPhase(str, enum.Enum):
    PLANNING = "Planning"
    CONSTRUCTION = "Construction"
    EXISTING_FACILITY = "Existing Facility"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(160), nullable=False)
    facility_category = Column(String(80), nullable=False, default=FacilityCategory.RESIDENTIAL.value)
    facility_subtype = Column(String(100), nullable=False, default="Independent house")
    project_phase = Column(String(50), nullable=False, default=ProjectPhase.PLANNING.value)
    
    # Location & Utility
    location = Column(String(160), nullable=True, default="Bengaluru, Karnataka")
    state = Column(String(100), nullable=True, default="Karnataka")
    country = Column(String(100), nullable=True, default="India")
    discom = Column(String(100), nullable=True, default="BESCOM")
    tariff_category = Column(String(100), nullable=True, default="Domestic LT-2")
    
    # Physical & Operational Dimensions
    built_up_area = Column(Float, nullable=False, default=2400.0)
    area_unit = Column(String(20), nullable=False, default="sq_ft")
    floors_count = Column(Integer, nullable=False, default=2)
    occupancy = Column(Integer, nullable=False, default=5)
    operating_days_per_month = Column(Integer, nullable=False, default=30)
    daily_operating_hours = Column(Float, nullable=False, default=24.0)
    connection_type = Column(String(60), nullable=False, default="3-Phase LT")
    budget_range = Column(String(80), nullable=True, default="₹15,000 - ₹25,000 / month")
    target_completion_date = Column(String(40), nullable=True, default="2026-12-31")
    
    # Flags & Timestamps
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scenarios = relationship("PlanningScenario", back_populates="project", cascade="all, delete-orphan", order_by="PlanningScenario.id")
    construction_items = relationship("ConstructionEquipmentItem", back_populates="project", cascade="all, delete-orphan", order_by="ConstructionEquipmentItem.id")


class PlanningScenario(Base):
    __tablename__ = "planning_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False, default="Baseline Scenario")
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Serialized JSON configurations
    facility_params_json = Column(Text, nullable=True)
    tariff_config_json = Column(Text, nullable=True)
    solar_config_json = Column(Text, nullable=True)
    ev_config_json = Column(Text, nullable=True)
    summary_metrics_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="scenarios")
    equipment_items = relationship("EquipmentItem", back_populates="scenario", cascade="all, delete-orphan", order_by="EquipmentItem.id")


class EquipmentItem(Base):
    __tablename__ = "equipment_items"

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("planning_scenarios.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String(80), nullable=False, default="HVAC")
    name = Column(String(160), nullable=False)
    brand_model = Column(String(160), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    rated_power_w = Column(Float, nullable=False, default=1500.0)
    operating_load_pct = Column(Float, nullable=False, default=70.0)
    daily_hours = Column(Float, nullable=False, default=8.0)
    monthly_days = Column(Integer, nullable=False, default=30)
    efficiency_pct = Column(Float, nullable=False, default=90.0)
    unit_purchase_cost = Column(Float, nullable=False, default=0.0)
    
    # Efficiency Intelligence
    is_energy_efficient = Column(Boolean, default=False)
    efficient_alternative_name = Column(String(160), nullable=True)
    efficient_alternative_watts = Column(Float, nullable=True)
    efficient_alternative_cost = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    scenario = relationship("PlanningScenario", back_populates="equipment_items")


class ConstructionEquipmentItem(Base):
    __tablename__ = "construction_equipment_items"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    phase_name = Column(String(100), nullable=False, default="Structural construction")
    equipment_name = Column(String(160), nullable=False)
    rated_power_kw = Column(Float, nullable=False, default=7.5)
    quantity = Column(Integer, nullable=False, default=1)
    operating_load_pct = Column(Float, nullable=False, default=75.0)
    hours_per_day = Column(Float, nullable=False, default=6.0)
    days_per_month = Column(Integer, nullable=False, default=25)
    duration_months = Column(Float, nullable=False, default=3.0)
    efficiency_pct = Column(Float, nullable=False, default=85.0)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="construction_items")
