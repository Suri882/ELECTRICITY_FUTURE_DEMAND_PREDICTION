import json
import os
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from backend.database import get_db
from backend.models.user import User
from backend.models.project import (
    Project, PlanningScenario, EquipmentItem, ConstructionEquipmentItem
)
from backend.schemas.project_schema import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListItem,
    PlanningScenarioCreate, PlanningScenarioUpdate, PlanningScenarioResponse,
    EquipmentItemCreate, EquipmentItemUpdate, EquipmentItemResponse,
    ConstructionEquipmentItemCreate, ConstructionEquipmentItemResponse
)
from backend.utils.dependencies import get_current_user
from backend.services.facility_catalog_service import facility_catalog
from backend.services.tariff_engine_service import tariff_engine
from backend.services.construction_calc_service import construction_calc
from backend.services.equipment_intelligence_service import equipment_intelligence
from backend.services.solar_storage_service import solar_storage
from backend.services.ev_charging_service import ev_charging_service
from backend.services.recommendations_engine_service import recommendations_engine
from backend.services.scenario_comparison_service import scenario_comparison
from backend.services.electrowise_report_service import electrowise_report_service
from backend.services.demo_project_service import demo_project_service
from backend.services.facility_prediction_service import facility_prediction

router = APIRouter(prefix="/api/projects", tags=["ElectroWise Energy Planning Studio"])

# -------------------------------------------------------------
# Catalog & Reference Endpoints
# -------------------------------------------------------------
@router.get("/catalog", summary="Get Facility Selector Catalog")
def get_catalog():
    return {
        "categories": facility_catalog.get_all_categories(),
        "facility_fields": facility_catalog.FACILITY_SPECIFIC_FIELDS
    }

@router.get("/catalog/benchmark-equipment/{category}", summary="Get Benchmark Equipment for Category")
def get_benchmark_equipment(category: str):
    return facility_catalog.get_benchmark_equipment(category)

@router.get("/tariffs/discoms", summary="Get Verified DISCOM Schedules")
def list_discoms():
    return tariff_engine.list_discoms()

@router.get("/tariffs/discoms/{discom_code}/{category_name}", summary="Get Specific DISCOM Category Rate Structure")
def get_discom_rates(discom_code: str, category_name: str):
    data = tariff_engine.get_discom_category_details(discom_code, category_name)
    if not data:
        raise HTTPException(status_code=404, detail="Tariff plan not found")
    return data


# -------------------------------------------------------------
# Project CRUD Endpoints
# -------------------------------------------------------------
@router.get("", response_model=List[ProjectListItem], summary="List User Projects")
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.updated_at.desc())
        .all()
    )
    result = []
    for p in projects:
        # Compute quick aggregate stats
        sc_count = len(p.scenarios)
        first_sc = p.scenarios[0] if p.scenarios else None
        eq_count = len(first_sc.equipment_items) if first_sc else 0
        
        # Calculate monthly kWh estimate
        monthly_kwh = 0.0
        if first_sc and first_sc.equipment_items:
            for eq in first_sc.equipment_items:
                daily_kwh = (eq.rated_power_w * (eq.operating_load_pct / 100.0) * eq.quantity * eq.daily_hours) / 1000.0
                monthly_kwh += (daily_kwh * eq.monthly_days)
        monthly_kwh = round(monthly_kwh, 1)

        result.append(ProjectListItem(
            id=p.id,
            name=p.name,
            facility_category=p.facility_category,
            facility_subtype=p.facility_subtype,
            project_phase=p.project_phase,
            location=p.location,
            built_up_area=p.built_up_area,
            area_unit=p.area_unit,
            is_demo=p.is_demo,
            created_at=p.created_at,
            updated_at=p.updated_at,
            scenarios_count=sc_count,
            equipment_count=eq_count,
            estimated_monthly_kwh=monthly_kwh if monthly_kwh > 0 else None,
            estimated_monthly_bill=round(monthly_kwh * 7.5, 2) if monthly_kwh > 0 else None
        ))
    return result

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED, summary="Create New Project")
def create_project(
    req: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = Project(
        user_id=current_user.id,
        name=req.name,
        facility_category=req.facility_category,
        facility_subtype=req.facility_subtype,
        project_phase=req.project_phase,
        location=req.location,
        state=req.state,
        country=req.country,
        discom=req.discom,
        tariff_category=req.tariff_category,
        built_up_area=req.built_up_area,
        area_unit=req.area_unit,
        floors_count=req.floors_count,
        occupancy=req.occupancy,
        operating_days_per_month=req.operating_days_per_month,
        daily_operating_hours=req.daily_operating_hours,
        connection_type=req.connection_type,
        budget_range=req.budget_range,
        target_completion_date=req.target_completion_date,
        is_demo=req.is_demo
    )
    db.add(project)
    db.flush()

    # Create Initial Planning Scenario
    scenario = PlanningScenario(
        project_id=project.id,
        name=req.initial_scenario_name or "Baseline Equipment Plan",
        facility_params_json=json.dumps(req.facility_params) if req.facility_params else None,
        is_active=True
    )
    db.add(scenario)
    db.flush()

    # Prepopulate equipment: either user-specified or benchmark library
    eq_to_insert = req.initial_equipment
    if not eq_to_insert:
        benchmark = facility_catalog.get_benchmark_equipment(req.facility_category)
        for b in benchmark:
            db.add(EquipmentItem(
                scenario_id=scenario.id,
                category=b["category"],
                name=b["name"],
                brand_model=b.get("brand_model"),
                quantity=b["quantity"],
                rated_power_w=b["rated_power_w"],
                operating_load_pct=b["operating_load_pct"],
                daily_hours=b["daily_hours"],
                monthly_days=b["monthly_days"],
                efficiency_pct=b["efficiency_pct"],
                unit_purchase_cost=b["unit_purchase_cost"],
                is_energy_efficient=b["is_energy_efficient"],
                efficient_alternative_name=b.get("efficient_alternative_name"),
                efficient_alternative_watts=b.get("efficient_alternative_watts"),
                efficient_alternative_cost=b.get("efficient_alternative_cost")
            ))
    else:
        for eq in eq_to_insert:
            db.add(EquipmentItem(scenario_id=scenario.id, **eq.model_dump()))

    # Prepopulate construction equipment: either user-specified or standard defaults
    const_to_insert = req.initial_construction
    if not const_to_insert:
        defaults = facility_catalog.get_default_construction_equipment()
        for d in defaults:
            db.add(ConstructionEquipmentItem(project_id=project.id, **d))
    else:
        for c in const_to_insert:
            db.add(ConstructionEquipmentItem(project_id=project.id, **c.model_dump()))

    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectResponse, summary="Get Full Project Details")
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=ProjectResponse, summary="Update Project Details")
def update_project(
    project_id: int,
    req: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(project, field, val)

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", summary="Delete Project")
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully", "project_id": project_id}

@router.post("/{project_id}/duplicate", response_model=ProjectResponse, summary="Duplicate Project")
def duplicate_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orig = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not orig:
        raise HTTPException(status_code=404, detail="Original project not found")

    copy_proj = Project(
        user_id=current_user.id,
        name=f"{orig.name} (Copy)",
        facility_category=orig.facility_category,
        facility_subtype=orig.facility_subtype,
        project_phase=orig.project_phase,
        location=orig.location,
        state=orig.state,
        country=orig.country,
        discom=orig.discom,
        tariff_category=orig.tariff_category,
        built_up_area=orig.built_up_area,
        area_unit=orig.area_unit,
        floors_count=orig.floors_count,
        occupancy=orig.occupancy,
        operating_days_per_month=orig.operating_days_per_month,
        daily_operating_hours=orig.daily_operating_hours,
        connection_type=orig.connection_type,
        budget_range=orig.budget_range,
        target_completion_date=orig.target_completion_date,
        is_demo=False
    )
    db.add(copy_proj)
    db.flush()

    # Duplicate scenarios and equipment
    for sc in orig.scenarios:
        copy_sc = PlanningScenario(
            project_id=copy_proj.id,
            name=sc.name,
            description=sc.description,
            facility_params_json=sc.facility_params_json,
            tariff_config_json=sc.tariff_config_json,
            solar_config_json=sc.solar_config_json,
            ev_config_json=sc.ev_config_json,
            is_active=sc.is_active
        )
        db.add(copy_sc)
        db.flush()

        for eq in sc.equipment_items:
            db.add(EquipmentItem(
                scenario_id=copy_sc.id,
                category=eq.category,
                name=eq.name,
                brand_model=eq.brand_model,
                quantity=eq.quantity,
                rated_power_w=eq.rated_power_w,
                operating_load_pct=eq.operating_load_pct,
                daily_hours=eq.daily_hours,
                monthly_days=eq.monthly_days,
                efficiency_pct=eq.efficiency_pct,
                unit_purchase_cost=eq.unit_purchase_cost,
                is_energy_efficient=eq.is_energy_efficient,
                efficient_alternative_name=eq.efficient_alternative_name,
                efficient_alternative_watts=eq.efficient_alternative_watts,
                efficient_alternative_cost=eq.efficient_alternative_cost
            ))

    # Duplicate construction items
    for c in orig.construction_items:
        db.add(ConstructionEquipmentItem(
            project_id=copy_proj.id,
            phase_name=c.phase_name,
            equipment_name=c.equipment_name,
            rated_power_kw=c.rated_power_kw,
            quantity=c.quantity,
            operating_load_pct=c.operating_load_pct,
            hours_per_day=c.hours_per_day,
            days_per_month=c.days_per_month,
            duration_months=c.duration_months,
            efficiency_pct=c.efficiency_pct
        ))

    db.commit()
    db.refresh(copy_proj)
    return copy_proj


# -------------------------------------------------------------
# Scenario & Equipment Endpoints
# -------------------------------------------------------------
@router.post("/{project_id}/scenarios", response_model=PlanningScenarioResponse, summary="Add Scenario to Project")
def add_scenario(
    project_id: int,
    req: PlanningScenarioCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    sc = PlanningScenario(project_id=project.id, **req.model_dump(exclude={"equipment_items"}))
    db.add(sc)
    db.flush()

    if req.equipment_items:
        for eq in req.equipment_items:
            db.add(EquipmentItem(scenario_id=sc.id, **eq.model_dump()))

    db.commit()
    db.refresh(sc)
    return sc

@router.post("/scenarios/{scenario_id}/duplicate", response_model=PlanningScenarioResponse, summary="Duplicate Scenario")
def duplicate_scenario(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orig = db.query(PlanningScenario).join(Project).filter(
        PlanningScenario.id == scenario_id,
        Project.user_id == current_user.id
    ).first()
    if not orig:
        raise HTTPException(status_code=404, detail="Scenario not found")

    copy_sc = PlanningScenario(
        project_id=orig.project_id,
        name=f"{orig.name} (Copy)",
        description=orig.description,
        facility_params_json=orig.facility_params_json,
        tariff_config_json=orig.tariff_config_json,
        solar_config_json=orig.solar_config_json,
        ev_config_json=orig.ev_config_json,
        is_active=True
    )
    db.add(copy_sc)
    db.flush()

    for eq in orig.equipment_items:
        db.add(EquipmentItem(
            scenario_id=copy_sc.id,
            category=eq.category,
            name=eq.name,
            brand_model=eq.brand_model,
            quantity=eq.quantity,
            rated_power_w=eq.rated_power_w,
            operating_load_pct=eq.operating_load_pct,
            daily_hours=eq.daily_hours,
            monthly_days=eq.monthly_days,
            efficiency_pct=eq.efficiency_pct,
            unit_purchase_cost=eq.unit_purchase_cost,
            is_energy_efficient=eq.is_energy_efficient,
            efficient_alternative_name=eq.efficient_alternative_name,
            efficient_alternative_watts=eq.efficient_alternative_watts,
            efficient_alternative_cost=eq.efficient_alternative_cost
        ))

    db.commit()
    db.refresh(copy_sc)
    return copy_sc

@router.delete("/scenarios/{scenario_id}", summary="Delete Scenario")
def delete_scenario(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sc = db.query(PlanningScenario).join(Project).filter(
        PlanningScenario.id == scenario_id,
        Project.user_id == current_user.id
    ).first()
    if not sc:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Prevent deleting if it is the only scenario
    sc_count = db.query(PlanningScenario).filter(PlanningScenario.project_id == sc.project_id).count()
    if sc_count <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the sole scenario of a project. Add another scenario first.")

    db.delete(sc)
    db.commit()
    return {"message": "Scenario deleted", "scenario_id": scenario_id}

# Equipment CRUD
@router.post("/scenarios/{scenario_id}/equipment", response_model=EquipmentItemResponse, summary="Add Equipment Item")
def add_equipment(
    scenario_id: int,
    req: EquipmentItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sc = db.query(PlanningScenario).join(Project).filter(
        PlanningScenario.id == scenario_id,
        Project.user_id == current_user.id
    ).first()
    if not sc:
        raise HTTPException(status_code=404, detail="Scenario not found")

    item = EquipmentItem(scenario_id=sc.id, **req.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/equipment/{item_id}", response_model=EquipmentItemResponse, summary="Update Equipment Item")
def update_equipment(
    item_id: int,
    req: EquipmentItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(EquipmentItem).join(PlanningScenario).join(Project).filter(
        EquipmentItem.id == item_id,
        Project.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")

    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(item, field, val)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/equipment/{item_id}", summary="Delete Equipment Item")
def delete_equipment(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(EquipmentItem).join(PlanningScenario).join(Project).filter(
        EquipmentItem.id == item_id,
        Project.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")

    db.delete(item)
    db.commit()
    return {"message": "Equipment deleted", "item_id": item_id}

@router.post("/equipment/{item_id}/duplicate", response_model=EquipmentItemResponse, summary="Duplicate Equipment Item")
def duplicate_equipment(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orig = db.query(EquipmentItem).join(PlanningScenario).join(Project).filter(
        EquipmentItem.id == item_id,
        Project.user_id == current_user.id
    ).first()
    if not orig:
        raise HTTPException(status_code=404, detail="Equipment item not found")

    copy_item = EquipmentItem(
        scenario_id=orig.scenario_id,
        category=orig.category,
        name=f"{orig.name} (Copy)",
        brand_model=orig.brand_model,
        quantity=orig.quantity,
        rated_power_w=orig.rated_power_w,
        operating_load_pct=orig.operating_load_pct,
        daily_hours=orig.daily_hours,
        monthly_days=orig.monthly_days,
        efficiency_pct=orig.efficiency_pct,
        unit_purchase_cost=orig.unit_purchase_cost,
        is_energy_efficient=orig.is_energy_efficient,
        efficient_alternative_name=orig.efficient_alternative_name,
        efficient_alternative_watts=orig.efficient_alternative_watts,
        efficient_alternative_cost=orig.efficient_alternative_cost
    )
    db.add(copy_item)
    db.commit()
    db.refresh(copy_item)
    return copy_item

# Construction Equipment CRUD
@router.post("/{project_id}/construction", response_model=ConstructionEquipmentItemResponse, summary="Add Construction Machine")
def add_construction_item(
    project_id: int,
    req: ConstructionEquipmentItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    item = ConstructionEquipmentItem(project_id=proj.id, **req.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/construction/{item_id}", summary="Delete Construction Machine")
def delete_construction_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ConstructionEquipmentItem).join(Project).filter(
        ConstructionEquipmentItem.id == item_id,
        Project.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Construction equipment not found")

    db.delete(item)
    db.commit()
    return {"message": "Construction machine removed", "item_id": item_id}


# -------------------------------------------------------------
# Comprehensive Project Calculation Engine & Demand Prediction
# -------------------------------------------------------------
class ConstructionPredictionRequest(BaseModel):
    construction_type: Optional[str] = "Residential House"
    built_up_area: Optional[float] = None
    floors_count: Optional[int] = None
    occupancy: Optional[int] = None
    daily_operating_hours: Optional[float] = None
    operating_days_per_month: Optional[int] = None
    ac_type: Optional[str] = None
    discom: Optional[str] = None
    tariff_category: Optional[str] = None
    appliances: Optional[List[Dict[str, Any]]] = None
    facility_params: Optional[Dict[str, Any]] = None
    custom_tariff: Optional[Dict[str, Any]] = None

@router.post("/predict-demand", summary="Execute Instant Input-Dependent Construction Demand Prediction")
def predict_construction_demand(
    req: ConstructionPredictionRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    try:
        return facility_prediction.predict_demand(req.model_dump())
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction calculation failed: {str(e)}")

class ProjectCalculationRequest(BaseModel):
    scenario_id: Optional[int] = None
    custom_tariff: Optional[Dict[str, Any]] = None
    solar_override: Optional[Dict[str, Any]] = None
    ev_override: Optional[Dict[str, Any]] = None
    built_up_area: Optional[float] = None
    floors_count: Optional[int] = None
    occupancy: Optional[int] = None
    daily_operating_hours: Optional[float] = None
    operating_days_per_month: Optional[int] = None
    ac_type: Optional[str] = None

@router.post("/{project_id}/calculate", summary="Execute Full Project Calculations")
def calculate_project(
    project_id: int,
    req: ProjectCalculationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Select target scenario
    target_scenario = None
    if req.scenario_id:
        target_scenario = db.query(PlanningScenario).filter(
            PlanningScenario.id == req.scenario_id,
            PlanningScenario.project_id == project.id
        ).first()
    if not target_scenario:
        target_scenario = project.scenarios[0] if project.scenarios else None

    if not target_scenario:
        raise HTTPException(status_code=400, detail="Project has no active planning scenarios.")

    # Apply live building overrides if provided
    if req.built_up_area is not None and req.built_up_area > 0:
        project.built_up_area = req.built_up_area
    if req.floors_count is not None and req.floors_count >= 1:
        project.floors_count = req.floors_count
    if req.occupancy is not None and req.occupancy >= 1:
        project.occupancy = req.occupancy
    if req.daily_operating_hours is not None and req.daily_operating_hours > 0:
        project.daily_operating_hours = req.daily_operating_hours
    if req.operating_days_per_month is not None and req.operating_days_per_month >= 1:
        project.operating_days_per_month = req.operating_days_per_month
    db.commit()

    # 1. Analyze Equipment Inventory
    eq_list = [
        {
            "id": eq.id,
            "name": eq.name,
            "category": eq.category,
            "brand_model": eq.brand_model,
            "quantity": eq.quantity,
            "rated_power_w": eq.rated_power_w,
            "operating_load_pct": eq.operating_load_pct,
            "daily_hours": eq.daily_hours,
            "monthly_days": eq.monthly_days,
            "efficiency_pct": eq.efficiency_pct,
            "unit_purchase_cost": eq.unit_purchase_cost,
            "is_energy_efficient": eq.is_energy_efficient,
            "efficient_alternative_name": eq.efficient_alternative_name,
            "efficient_alternative_watts": eq.efficient_alternative_watts,
            "efficient_alternative_cost": eq.efficient_alternative_cost
        }
        for eq in target_scenario.equipment_items
    ]
    eq_analysis = equipment_intelligence.analyze_equipment(eq_list, tariff_rate=7.50)

    # 2. Construction Electricity Analysis
    const_list = [
        {
            "id": c.id,
            "phase_name": c.phase_name,
            "equipment_name": c.equipment_name,
            "rated_power_kw": c.rated_power_kw,
            "quantity": c.quantity,
            "operating_load_pct": c.operating_load_pct,
            "hours_per_day": c.hours_per_day,
            "days_per_month": c.days_per_month,
            "duration_months": c.duration_months,
            "efficiency_pct": c.efficiency_pct
        }
        for c in project.construction_items
    ]
    const_analysis = construction_calc.calculate_construction_energy(const_list)

    # 3. Dynamic Facility Demand Prediction Engine (Area, Floors, Occupancy, Operating Hours & Equipment)
    parsed_facility_params = {}
    if target_scenario.facility_params_json:
        try:
            parsed_facility_params = json.loads(target_scenario.facility_params_json)
        except Exception:
            parsed_facility_params = {}
    if req.ac_type:
        parsed_facility_params["air_conditioning_type"] = req.ac_type

    facility_pred = facility_prediction.predict_demand({
        "construction_type": project.facility_subtype or project.facility_category,
        "built_up_area": project.built_up_area,
        "floors_count": project.floors_count,
        "occupancy": project.occupancy,
        "daily_operating_hours": project.daily_operating_hours,
        "operating_days_per_month": project.operating_days_per_month or 30,
        "ac_type": parsed_facility_params.get("air_conditioning_type") or "Split / Window Inverter ACs",
        "discom": project.discom or "BESCOM",
        "tariff_category": project.tariff_category or "Domestic LT-2",
        "appliances": eq_list,
        "facility_params": parsed_facility_params,
        "custom_tariff": req.custom_tariff
    })

    # Integrate calculated results across the suite
    monthly_kwh = facility_pred["summary"]["monthly_kwh"]
    daily_kwh = facility_pred["summary"]["daily_kwh"]
    avg_demand_kw = facility_pred["summary"]["avg_demand_kw"]
    peak_kw = facility_pred["summary"]["peak_load_kw"]
    connection_capacity_kva = facility_pred["summary"]["connection_capacity_kva"]
    sanctioned_kw = max(5.0, round(peak_kw * 1.15, 1))

    tariff_analysis = facility_pred["tariff_details"]
    tariff_analysis["total_estimated_monthly_bill"] = facility_pred["summary"]["estimated_monthly_bill_inr"]
    tariff_analysis["effective_rate_per_kwh"] = facility_pred["summary"]["effective_tariff_rate_inr"]

    # Re-apply accurate effective tariff rate to equipment analysis
    if tariff_analysis["effective_rate_per_kwh"] > 0:
        eq_analysis = equipment_intelligence.analyze_equipment(
            eq_list,
            tariff_rate=tariff_analysis["effective_rate_per_kwh"]
        )

    # Align equipment summary with unified building load
    eq_analysis["summary"]["total_daily_kwh"] = daily_kwh
    eq_analysis["summary"]["total_monthly_kwh"] = monthly_kwh
    eq_analysis["summary"]["total_annual_kwh"] = facility_pred["summary"]["annual_kwh"]
    eq_analysis["summary"]["total_operational_peak_kw"] = peak_kw
    eq_analysis["summary"]["avg_demand_kw"] = avg_demand_kw
    eq_analysis["summary"]["connection_capacity_kva"] = connection_capacity_kva
    eq_analysis["summary"]["category_breakdown"] = facility_pred["category_breakdown"]

    # 4. Solar & Battery Sizing
    solar_params = req.solar_override or {}
    solar_analysis = solar_storage.calculate_solar_and_storage(
        daily_consumption_kwh=daily_kwh,
        rooftop_area_sq_ft=solar_params.get("rooftop_area_sq_ft", max(600.0, project.built_up_area * 0.4)),
        solar_irradiance_kwh_per_sqm=solar_params.get("solar_irradiance", 5.0),
        critical_load_kw=solar_params.get("critical_load_kw", max(1.5, peak_kw * 0.3)),
        desired_backup_hours=solar_params.get("desired_backup_hours", 4.0),
        grid_tariff_rate=tariff_analysis["effective_rate_per_kwh"]
    )

    # 5. EV Load Calculation
    ev_params = req.ev_override or {}
    chargers_list = ev_params.get("chargers", [
        {"charger_label": "Level-2 AC Wallbox", "power_kw": 7.4, "chargers_count": 1, "daily_charging_hours": 4.0, "vehicles_per_day": 1, "simultaneous_pct": 100.0}
    ])
    ev_analysis = ev_charging_service.calculate_ev_load(
        chargers_config=chargers_list,
        electricity_tariff_rate=tariff_analysis["effective_rate_per_kwh"],
        baseline_facility_peak_kw=peak_kw
    )

    # 6. Actionable Efficiency Recommendations
    recs = facility_pred["recommendations"]

    # 7. Multi-Scenario Comparison across all scenarios in this project
    all_scenarios_data = []
    for sc in project.scenarios:
        sc_eq_list = [
            {
                "rated_power_w": eq.rated_power_w,
                "quantity": eq.quantity,
                "operating_load_pct": eq.operating_load_pct,
                "daily_hours": eq.daily_hours,
                "monthly_days": eq.monthly_days,
                "efficiency_pct": eq.efficiency_pct,
                "unit_purchase_cost": eq.unit_purchase_cost
            }
            for eq in sc.equipment_items
        ]
        sc_eq_sum = equipment_intelligence.analyze_equipment(sc_eq_list, tariff_rate=tariff_analysis["effective_rate_per_kwh"])
        sc_tariff_sum = tariff_engine.calculate_bill(
            consumption_kwh=sc_eq_sum["summary"]["total_monthly_kwh"],
            discom_code=project.discom or "BESCOM",
            category_name=project.tariff_category or "Domestic LT-2",
            sanctioned_load_kw=max(5.0, round(sc_eq_sum["summary"]["total_operational_peak_kw"] * 1.15, 1))
        )
        all_scenarios_data.append({
            "id": sc.id,
            "name": sc.name,
            "is_active": sc.is_active,
            "equipment_summary": sc_eq_sum["summary"],
            "tariff_summary": sc_tariff_sum,
            "solar_summary": solar_analysis["solar_sizing"] if "solar" in sc.name.lower() else {}
        })

    comparison_data = scenario_comparison.compare_scenarios(
        scenarios_data=all_scenarios_data,
        construction_cost=const_analysis["summary"]["total_construction_budget_inr"],
        emission_factor=0.716
    )

    # 8. Multi-Horizon Demand Prediction Integration
    predictions_summary = {
        "prediction_horizon": "Multi-Horizon (24h, 7d, 30d, 12-Month)",
        "model_type": "Calibrated Facility Duty-Cycle Engineering Model",
        "next_24_hours": {
            "total_kwh": daily_kwh,
            "peak_demand_kw": peak_kw,
            "avg_demand_kw": avg_demand_kw,
            "connection_capacity_kva": connection_capacity_kva,
            "peak_window": facility_pred["peak_demand"]["peak_window"],
            "hourly_curve": facility_pred["peak_demand"]["hourly_curve"]
        },
        "next_7_days": {
            "total_kwh": round(daily_kwh * 7.0, 2),
            "estimated_cost_inr": round((daily_kwh * 7.0) * facility_pred["summary"]["effective_tariff_rate_inr"], 2)
        },
        "next_30_days": {
            "total_kwh": monthly_kwh,
            "estimated_cost_inr": facility_pred["summary"]["estimated_monthly_bill_inr"]
        },
        "annual_projection": {
            "total_kwh": facility_pred["summary"]["annual_kwh"],
            "estimated_cost_inr": facility_pred["summary"]["estimated_annual_bill_inr"]
        },
        "high_demand_warning": peak_kw > (sanctioned_kw * 0.90),
        "warning_message": (
            f"Peak demand ({peak_kw:.1f} kW) approaches sanctioned capacity ({sanctioned_kw:.1f} kW). "
            "Consider staggered machinery scheduling or power factor optimization."
            if peak_kw > (sanctioned_kw * 0.90) else None
        ),
        "category_breakdown": facility_pred["category_breakdown"],
        "sensitivity_drivers": facility_pred["sensitivity_drivers"],
        "assumptions": facility_pred["assumptions"],
        "engineering_disclaimer": facility_pred["engineering_disclaimer"]
    }

    # Cache summary metrics on target scenario
    target_scenario.summary_metrics_json = json.dumps({
        "daily_kwh": daily_kwh,
        "monthly_kwh": monthly_kwh,
        "avg_demand_kw": avg_demand_kw,
        "peak_kw": peak_kw,
        "connection_capacity_kva": connection_capacity_kva,
        "monthly_bill": facility_pred["summary"]["estimated_monthly_bill_inr"],
        "effective_rate": facility_pred["summary"]["effective_tariff_rate_inr"],
        "construction_budget": const_analysis["summary"]["total_construction_budget_inr"],
        "purchase_budget": eq_analysis["summary"]["total_purchase_budget_inr"],
        "solar_annual_kwh": solar_analysis["solar_sizing"]["expected_annual_generation_kwh"],
        "annual_co2_tonnes": round((monthly_kwh * 12.0 * 0.716) / 1000.0, 2)
    })
    db.commit()

    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "facility_category": project.facility_category,
            "facility_subtype": project.facility_subtype,
            "project_phase": project.project_phase,
            "location": project.location,
            "built_up_area": project.built_up_area,
            "floors_count": project.floors_count,
            "area_unit": project.area_unit,
            "occupancy": project.occupancy,
            "daily_operating_hours": project.daily_operating_hours,
            "operating_days_per_month": project.operating_days_per_month,
            "connection_type": project.connection_type
        },
        "active_scenario": {
            "id": target_scenario.id,
            "name": target_scenario.name
        },
        "facility_prediction": facility_pred,
        "equipment_analysis": eq_analysis,
        "construction_analysis": const_analysis,
        "tariff_analysis": tariff_analysis,
        "solar_analysis": solar_analysis,
        "ev_analysis": ev_analysis,
        "recommendations": recs,
        "scenario_comparisons": comparison_data,
        "prediction_integration": predictions_summary
    }


# -------------------------------------------------------------
# PDF & CSV Export Endpoints
# -------------------------------------------------------------
@router.post("/{project_id}/report/pdf", summary="Generate ElectroWise PDF Report")
def export_pdf_report(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    target_scenario = project.scenarios[0] if project.scenarios else None
    if not target_scenario:
        raise HTTPException(status_code=400, detail="No scenario to generate report for.")

    # Execute calculations
    eq_list = [
        {
            "name": eq.name,
            "category": eq.category,
            "quantity": eq.quantity,
            "rated_power_w": eq.rated_power_w,
            "daily_hours": eq.daily_hours,
            "monthly_days": eq.monthly_days,
            "efficiency_pct": eq.efficiency_pct,
            "unit_purchase_cost": eq.unit_purchase_cost
        }
        for eq in target_scenario.equipment_items
    ]
    eq_analysis = equipment_intelligence.analyze_equipment(eq_list)
    const_list = [
        {
            "phase_name": c.phase_name,
            "equipment_name": c.equipment_name,
            "rated_power_kw": c.rated_power_kw,
            "quantity": c.quantity,
            "hours_per_day": c.hours_per_day,
            "days_per_month": c.days_per_month,
            "duration_months": c.duration_months
        }
        for c in project.construction_items
    ]
    const_analysis = construction_calc.calculate_construction_energy(const_list)
    tariff_analysis = tariff_engine.calculate_bill(
        consumption_kwh=eq_analysis["summary"]["total_monthly_kwh"],
        discom_code=project.discom or "BESCOM",
        category_name=project.tariff_category or "Domestic LT-2"
    )
    solar_analysis = solar_storage.calculate_solar_and_storage(
        daily_consumption_kwh=eq_analysis["summary"]["total_daily_kwh"],
        rooftop_area_sq_ft=project.built_up_area * 0.4
    )
    recs = recommendations_engine.generate_recommendations(
        equipment_list=eq_list,
        tariff_rate=tariff_analysis["effective_rate_per_kwh"],
        monthly_kwh_total=eq_analysis["summary"]["total_monthly_kwh"]
    )

    pdf_path = electrowise_report_service.generate_project_pdf(
        project_data={
            "name": project.name,
            "facility_category": project.facility_category,
            "facility_subtype": project.facility_subtype,
            "project_phase": project.project_phase,
            "location": project.location,
            "state": project.state,
            "built_up_area": project.built_up_area,
            "area_unit": project.area_unit,
            "floors_count": project.floors_count,
            "occupancy": project.occupancy,
            "connection_type": project.connection_type,
            "discom": project.discom,
            "tariff_category": project.tariff_category
        },
        scenario_data={
            "name": target_scenario.name,
            "equipment_summary": eq_analysis
        },
        construction_calc_data=const_analysis,
        tariff_data=tariff_analysis,
        solar_data=solar_analysis,
        recommendations=recs
    )

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(pdf_path)
    )

@router.get("/{project_id}/export/csv", summary="Export Equipment Inventory as CSV")
def export_csv(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    target_scenario = project.scenarios[0] if project.scenarios else None
    if not target_scenario:
        raise HTTPException(status_code=400, detail="No scenario to export.")

    eq_list = [
        {
            "category": eq.category,
            "name": eq.name,
            "brand_model": eq.brand_model,
            "quantity": eq.quantity,
            "rated_power_w": eq.rated_power_w,
            "operating_load_pct": eq.operating_load_pct,
            "daily_hours": eq.daily_hours,
            "monthly_days": eq.monthly_days,
            "efficiency_pct": eq.efficiency_pct,
            "unit_purchase_cost": eq.unit_purchase_cost,
            "total_purchase_cost": eq.unit_purchase_cost * eq.quantity,
            "daily_kwh": round((eq.rated_power_w * (eq.operating_load_pct / 100.0) * eq.quantity * eq.daily_hours) / 1000.0, 2),
            "monthly_kwh": round(((eq.rated_power_w * (eq.operating_load_pct / 100.0) * eq.quantity * eq.daily_hours) / 1000.0) * eq.monthly_days, 2),
            "annual_kwh": round(((eq.rated_power_w * (eq.operating_load_pct / 100.0) * eq.quantity * eq.daily_hours) / 1000.0) * eq.monthly_days * 12.0, 2),
            "monthly_cost": round((((eq.rated_power_w * (eq.operating_load_pct / 100.0) * eq.quantity * eq.daily_hours) / 1000.0) * eq.monthly_days) * 7.5, 2)
        }
        for eq in target_scenario.equipment_items
    ]

    csv_data = electrowise_report_service.export_equipment_csv(eq_list)
    filename = f"ElectroWise_Equipment_{project.name.replace(' ', '_')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# -------------------------------------------------------------
# Demo Projects Management Endpoints
# -------------------------------------------------------------
@router.post("/demo/seed", summary="Seed ElectroWise Sample Demo Projects")
def seed_demo_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = demo_project_service.seed_demo_projects(db, current_user)
    return {"message": "Demo projects loaded successfully", "count": count}

@router.post("/demo/clear", summary="Clear Demo Projects")
def clear_demo_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = demo_project_service.clear_demo_projects(db, current_user)
    return {"message": "Demo projects removed successfully", "removed_count": count}
