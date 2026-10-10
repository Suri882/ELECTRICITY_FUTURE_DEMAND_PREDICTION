from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models.user import User
from backend.models.electricity_record import ElectricityRecord
from backend.models.prediction import Prediction
from backend.services.cost_service import cost_service
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/billing", tags=["Electricity Bill Estimator"])

class BillCalculateRequest(BaseModel):
    consumption_kwh: float
    peak_kwh: Optional[float] = 0.0
    base_tariff: Optional[float] = None
    peak_multiplier: Optional[float] = None
    fixed_charges: Optional[float] = 120.0
    tax_percentage: Optional[float] = None
    period_label: Optional[str] = "Custom Period"

class TariffUpdateRequest(BaseModel):
    base_tariff_rate: float
    peak_tariff_multiplier: float
    fixed_charges: float
    tax_percentage: float

@router.get("/estimate")
def get_bill_estimates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == current_user.id)
        .order_by(ElectricityRecord.date.asc())
        .all()
    )

    base_rate = current_user.base_tariff_rate or 7.50
    peak_mult = current_user.peak_tariff_multiplier or 1.40
    fixed_charges = current_user.fixed_charges if current_user.fixed_charges is not None else 120.0
    tax_pct = current_user.tax_percentage if current_user.tax_percentage is not None else 5.0

    last_record = records[-1] if records else None
    prev_record = records[-2] if len(records) >= 2 else None

    # Current cycle estimate
    current_kwh = float(last_record.units_consumed) if last_record else 400.0
    current_peak = float(last_record.peak_usage) if last_record else (current_kwh * 0.25)
    previous_bill = float(prev_record.bill_amount) if prev_record else (float(last_record.bill_amount) if last_record else None)

    current_estimate = cost_service.generate_bill_estimate(
        consumption_kwh=current_kwh,
        peak_kwh=current_peak,
        base_rate=base_rate,
        peak_multiplier=peak_mult,
        fixed_charges=fixed_charges,
        tax_pct=tax_pct,
        period_label="Latest Recorded Cycle",
        previous_bill=previous_bill
    )

    # Latest ML prediction estimate
    latest_pred = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    predicted_kwh = float(latest_pred.predicted_demand) if latest_pred else (current_kwh * 1.05)
    predicted_peak = predicted_kwh * (current_peak / (current_kwh + 1e-5))

    predicted_estimate = cost_service.generate_bill_estimate(
        consumption_kwh=predicted_kwh,
        peak_kwh=predicted_peak,
        base_rate=base_rate,
        peak_multiplier=peak_mult,
        fixed_charges=fixed_charges,
        tax_pct=tax_pct,
        period_label=f"Predicted Horizon ({latest_pred.forecast_period if latest_pred else '30d'})",
        previous_bill=current_estimate["total_estimated_bill"]
    )

    # 24h & 7d prorated estimates
    daily_kwh = current_kwh / 30.0
    estimate_24h = cost_service.generate_bill_estimate(
        consumption_kwh=daily_kwh,
        peak_kwh=daily_kwh * 0.3,
        base_rate=base_rate,
        peak_multiplier=peak_mult,
        fixed_charges=fixed_charges / 30.0,
        tax_pct=tax_pct,
        period_label="Next 24 Hours (Estimated)"
    )

    estimate_7d = cost_service.generate_bill_estimate(
        consumption_kwh=daily_kwh * 7.0,
        peak_kwh=daily_kwh * 7.0 * 0.28,
        base_rate=base_rate,
        peak_multiplier=peak_mult,
        fixed_charges=(fixed_charges / 30.0) * 7.0,
        tax_pct=tax_pct,
        period_label="Next 7 Days (Estimated)"
    )

    return {
        "user_tariffs": {
            "base_tariff_rate": base_rate,
            "peak_tariff_multiplier": peak_mult,
            "fixed_charges": fixed_charges,
            "tax_percentage": tax_pct
        },
        "current_cycle_estimate": current_estimate,
        "predicted_cycle_estimate": predicted_estimate,
        "short_term_estimates": {
            "next_24h": estimate_24h,
            "next_7d": estimate_7d
        }
    }

@router.post("/calculate")
def calculate_custom_bill(
    req: BillCalculateRequest,
    current_user: User = Depends(get_current_user)
):
    base_rate = req.base_tariff if req.base_tariff is not None else (current_user.base_tariff_rate or 7.50)
    peak_mult = req.peak_multiplier if req.peak_multiplier is not None else (current_user.peak_tariff_multiplier or 1.40)
    fixed = req.fixed_charges if req.fixed_charges is not None else (current_user.fixed_charges or 120.0)
    tax = req.tax_percentage if req.tax_percentage is not None else (current_user.tax_percentage or 5.0)

    return cost_service.generate_bill_estimate(
        consumption_kwh=req.consumption_kwh,
        peak_kwh=req.peak_kwh or 0.0,
        base_rate=base_rate,
        peak_multiplier=peak_mult,
        fixed_charges=fixed,
        tax_pct=tax,
        period_label=req.period_label or "Custom Simulation"
    )

@router.put("/tariffs")
def update_user_tariffs(
    req: TariffUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.base_tariff_rate <= 0 or req.peak_tariff_multiplier < 1.0 or req.tax_percentage < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tariff values: Base rate must be positive, peak multiplier >= 1.0, tax >= 0%."
        )

    current_user.base_tariff_rate = req.base_tariff_rate
    current_user.peak_tariff_multiplier = req.peak_tariff_multiplier
    current_user.fixed_charges = req.fixed_charges
    current_user.tax_percentage = req.tax_percentage
    db.commit()

    return {
        "status": "success",
        "message": "Tariff settings updated successfully.",
        "tariffs": {
            "base_tariff_rate": current_user.base_tariff_rate,
            "peak_tariff_multiplier": current_user.peak_tariff_multiplier,
            "fixed_charges": current_user.fixed_charges,
            "tax_percentage": current_user.tax_percentage
        }
    }
