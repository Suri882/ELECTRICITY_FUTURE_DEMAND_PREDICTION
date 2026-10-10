from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models.user import User
from backend.models.electricity_record import ElectricityRecord
from backend.models.prediction import Prediction
from backend.models.simulation import SimulationRecord
from backend.services.carbon_service import carbon_service
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/carbon", tags=["Carbon Emission Intelligence"])

class GridFactorUpdateRequest(BaseModel):
    grid_emission_factor: float

@router.get("/summary")
def get_carbon_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == current_user.id)
        .order_by(ElectricityRecord.date.asc())
        .all()
    )

    factor = current_user.grid_emission_factor or 0.82
    actual_kwh = float(records[-1].units_consumed) if records else 420.0

    # Predicted consumption
    latest_pred = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    predicted_kwh = float(latest_pred.predicted_demand) if latest_pred else (actual_kwh * 1.05)

    # Latest saved simulation or simulated 15% reduction
    latest_sim = (
        db.query(SimulationRecord)
        .filter(SimulationRecord.user_id == current_user.id)
        .order_by(SimulationRecord.created_at.desc())
        .first()
    )
    simulated_kwh = float(latest_sim.simulated_kwh) if latest_sim else (actual_kwh * 0.88)

    records_data = [
        {"date": r.date, "units_consumed": r.units_consumed}
        for r in records
    ]

    return carbon_service.compute_emissions(
        actual_kwh=actual_kwh,
        predicted_kwh=predicted_kwh,
        simulated_kwh=simulated_kwh,
        grid_emission_factor=factor,
        history_records=records_data
    )

@router.put("/emission-factor")
def update_emission_factor(
    req: GridFactorUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.grid_emission_factor <= 0 or req.grid_emission_factor > 2.5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Grid emission factor must be between 0.01 and 2.50 kg CO2e/kWh."
        )

    current_user.grid_emission_factor = req.grid_emission_factor
    db.commit()

    return {
        "status": "success",
        "message": "Grid emission factor updated successfully.",
        "grid_emission_factor": current_user.grid_emission_factor
    }
