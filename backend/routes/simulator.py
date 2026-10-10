from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from backend.database import get_db
from backend.models.user import User
from backend.models.electricity_record import ElectricityRecord
from backend.models.simulation import SimulationRecord
from backend.services.simulator_service import simulator_service
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/simulator", tags=["What-If Energy Simulator"])

class SimulateRequest(BaseModel):
    peak_reduction_pct: float = 10.0
    peak_shift_pct: float = 15.0
    custom_baseline_kwh: Optional[float] = None
    custom_base_tariff: Optional[float] = None
    custom_peak_multiplier: Optional[float] = None
    custom_grid_factor: Optional[float] = None

class SaveScenarioRequest(BaseModel):
    scenario_name: str
    peak_reduction_pct: float
    peak_shift_pct: float
    baseline_kwh: float
    simulated_kwh: float
    kwh_saved: float
    baseline_cost: float
    simulated_cost: float
    cost_saved: float
    emissions_saved_kg: float
    notes: Optional[str] = None

@router.post("/simulate")
def run_simulation(
    req: SimulateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == current_user.id)
        .order_by(ElectricityRecord.date.asc())
        .all()
    )

    baseline_kwh = req.custom_baseline_kwh
    baseline_peak = None

    if baseline_kwh is None:
        if records:
            last = records[-1]
            baseline_kwh = float(last.units_consumed)
            baseline_peak = float(last.peak_usage)
        else:
            baseline_kwh = 420.0
            baseline_peak = 120.0

    base_tariff = req.custom_base_tariff if req.custom_base_tariff is not None else (current_user.base_tariff_rate or 7.50)
    peak_mult = req.custom_peak_multiplier if req.custom_peak_multiplier is not None else (current_user.peak_tariff_multiplier or 1.40)
    grid_factor = req.custom_grid_factor if req.custom_grid_factor is not None else (current_user.grid_emission_factor or 0.82)
    fixed = current_user.fixed_charges if current_user.fixed_charges is not None else 120.0
    tax = current_user.tax_percentage if current_user.tax_percentage is not None else 5.0

    return simulator_service.simulate(
        baseline_monthly_kwh=baseline_kwh,
        baseline_peak_kwh=baseline_peak,
        peak_reduction_pct=req.peak_reduction_pct,
        peak_shift_pct=req.peak_shift_pct,
        base_tariff=base_tariff,
        peak_multiplier=peak_mult,
        fixed_charges=fixed,
        tax_pct=tax,
        grid_emission_factor=grid_factor
    )

@router.post("/save", status_code=status.HTTP_201_CREATED)
def save_scenario(
    req: SaveScenarioRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = SimulationRecord(
        user_id=current_user.id,
        scenario_name=req.scenario_name,
        peak_reduction_pct=req.peak_reduction_pct,
        peak_shift_pct=req.peak_shift_pct,
        baseline_kwh=req.baseline_kwh,
        simulated_kwh=req.simulated_kwh,
        kwh_saved=req.kwh_saved,
        baseline_cost=req.baseline_cost,
        simulated_cost=req.simulated_cost,
        cost_saved=req.cost_saved,
        emissions_saved_kg=req.emissions_saved_kg,
        notes=req.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "status": "success",
        "message": "What-If simulation scenario saved successfully.",
        "id": record.id,
        "scenario_name": record.scenario_name,
        "created_at": record.created_at
    }

@router.get("/history")
def get_saved_scenarios(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scenarios = (
        db.query(SimulationRecord)
        .filter(SimulationRecord.user_id == current_user.id)
        .order_by(SimulationRecord.created_at.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "scenario_name": s.scenario_name,
            "peak_reduction_pct": s.peak_reduction_pct,
            "peak_shift_pct": s.peak_shift_pct,
            "baseline_kwh": s.baseline_kwh,
            "simulated_kwh": s.simulated_kwh,
            "kwh_saved": s.kwh_saved,
            "baseline_cost": s.baseline_cost,
            "simulated_cost": s.simulated_cost,
            "cost_saved": s.cost_saved,
            "emissions_saved_kg": s.emissions_saved_kg,
            "notes": s.notes,
            "created_at": s.created_at
        }
        for s in scenarios
    ]

@router.delete("/{scenario_id}")
def delete_scenario(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    s = (
        db.query(SimulationRecord)
        .filter(SimulationRecord.id == scenario_id, SimulationRecord.user_id == current_user.id)
        .first()
    )
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found.")
    db.delete(s)
    db.commit()
    return {"status": "success", "message": "Scenario deleted."}
