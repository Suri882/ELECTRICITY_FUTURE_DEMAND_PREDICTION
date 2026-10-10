from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# -------------------------------------------------------------
# Equipment Schemas
# -------------------------------------------------------------
class EquipmentItemBase(BaseModel):
    category: str = "HVAC"
    name: str
    brand_model: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    rated_power_w: float = Field(default=1500.0, ge=0.1)
    operating_load_pct: float = Field(default=70.0, ge=1.0, le=100.0)
    daily_hours: float = Field(default=8.0, ge=0.1, le=24.0)
    monthly_days: int = Field(default=30, ge=1, le=31)
    efficiency_pct: float = Field(default=90.0, ge=10.0, le=100.0)
    unit_purchase_cost: float = Field(default=0.0, ge=0.0)
    is_energy_efficient: bool = False
    efficient_alternative_name: Optional[str] = None
    efficient_alternative_watts: Optional[float] = None
    efficient_alternative_cost: Optional[float] = None

class EquipmentItemCreate(EquipmentItemBase):
    pass

class EquipmentItemUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    brand_model: Optional[str] = None
    quantity: Optional[int] = None
    rated_power_w: Optional[float] = None
    operating_load_pct: Optional[float] = None
    daily_hours: Optional[float] = None
    monthly_days: Optional[int] = None
    efficiency_pct: Optional[float] = None
    unit_purchase_cost: Optional[float] = None
    is_energy_efficient: Optional[bool] = None
    efficient_alternative_name: Optional[str] = None
    efficient_alternative_watts: Optional[float] = None
    efficient_alternative_cost: Optional[float] = None

class EquipmentItemResponse(EquipmentItemBase):
    id: int
    scenario_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# Construction Equipment Schemas
# -------------------------------------------------------------
class ConstructionEquipmentItemBase(BaseModel):
    phase_name: str = "Structural construction"
    equipment_name: str
    rated_power_kw: float = Field(default=7.5, ge=0.1)
    quantity: int = Field(default=1, ge=1)
    operating_load_pct: float = Field(default=70.0, ge=1.0, le=100.0)
    hours_per_day: float = Field(default=6.0, ge=0.1, le=24.0)
    days_per_month: int = Field(default=25, ge=1, le=31)
    duration_months: float = Field(default=3.0, ge=0.1)
    efficiency_pct: float = Field(default=85.0, ge=10.0, le=100.0)

class ConstructionEquipmentItemCreate(ConstructionEquipmentItemBase):
    pass

class ConstructionEquipmentItemResponse(ConstructionEquipmentItemBase):
    id: int
    project_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# Planning Scenario Schemas
# -------------------------------------------------------------
class PlanningScenarioBase(BaseModel):
    name: str = "Baseline Scenario"
    description: Optional[str] = None
    is_active: bool = True
    facility_params_json: Optional[str] = None
    tariff_config_json: Optional[str] = None
    solar_config_json: Optional[str] = None
    ev_config_json: Optional[str] = None

class PlanningScenarioCreate(PlanningScenarioBase):
    equipment_items: Optional[List[EquipmentItemCreate]] = None

class PlanningScenarioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    facility_params_json: Optional[str] = None
    tariff_config_json: Optional[str] = None
    solar_config_json: Optional[str] = None
    ev_config_json: Optional[str] = None

class PlanningScenarioResponse(PlanningScenarioBase):
    id: int
    project_id: int
    summary_metrics_json: Optional[str] = None
    equipment_items: List[EquipmentItemResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# Project Schemas
# -------------------------------------------------------------
class ProjectBase(BaseModel):
    name: str
    facility_category: str = "Residential"
    facility_subtype: str = "Independent house"
    project_phase: str = "Planning"
    location: Optional[str] = "Bengaluru, Karnataka"
    state: Optional[str] = "Karnataka"
    country: Optional[str] = "India"
    discom: Optional[str] = "BESCOM"
    tariff_category: Optional[str] = "Domestic LT-2"
    built_up_area: float = 2400.0
    area_unit: str = "sq_ft"
    floors_count: int = 2
    occupancy: int = 5
    operating_days_per_month: int = 30
    daily_operating_hours: float = 24.0
    connection_type: str = "3-Phase LT"
    budget_range: Optional[str] = None
    target_completion_date: Optional[str] = None
    is_demo: bool = False

class ProjectCreate(ProjectBase):
    initial_scenario_name: Optional[str] = "Baseline Equipment"
    initial_equipment: Optional[List[EquipmentItemCreate]] = None
    initial_construction: Optional[List[ConstructionEquipmentItemCreate]] = None
    facility_params: Optional[Dict[str, Any]] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    facility_category: Optional[str] = None
    facility_subtype: Optional[str] = None
    project_phase: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    discom: Optional[str] = None
    tariff_category: Optional[str] = None
    built_up_area: Optional[float] = None
    area_unit: Optional[str] = None
    floors_count: Optional[int] = None
    occupancy: Optional[int] = None
    operating_days_per_month: Optional[int] = None
    daily_operating_hours: Optional[float] = None
    connection_type: Optional[str] = None
    budget_range: Optional[str] = None
    target_completion_date: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    scenarios: List[PlanningScenarioResponse] = []
    construction_items: List[ConstructionEquipmentItemResponse] = []

    class Config:
        from_attributes = True

class ProjectListItem(BaseModel):
    id: int
    name: str
    facility_category: str
    facility_subtype: str
    project_phase: str
    location: Optional[str] = None
    built_up_area: float
    area_unit: str
    is_demo: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    scenarios_count: int = 0
    equipment_count: int = 0
    estimated_monthly_kwh: Optional[float] = None
    estimated_monthly_bill: Optional[float] = None
