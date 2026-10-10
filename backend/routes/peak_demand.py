from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models.user import User
from backend.models.electricity_record import ElectricityRecord
from backend.ml.predictor import demand_predictor
from backend.services.peak_demand_service import peak_demand_service
from backend.services.weather_service import weather_service
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/peak-demand", tags=["Peak Demand Intelligence"])

class ThresholdUpdateRequest(BaseModel):
    low: float
    medium: float
    high: float

@router.get("")
def get_peak_demand_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == current_user.id)
        .order_by(ElectricityRecord.date.asc())
        .all()
    )

    threshold_low = current_user.demand_threshold_low or 250.0
    threshold_med = current_user.demand_threshold_medium or 450.0
    threshold_high = current_user.demand_threshold_high or 700.0

    if len(records) < 3:
        return peak_demand_service._empty_peak_response()

    records_data = [
        {
            "id": r.id,
            "date": r.date,
            "units_consumed": r.units_consumed,
            "bill_amount": r.bill_amount,
            "number_of_days": r.number_of_days,
            "peak_usage": r.peak_usage
        }
        for r in records
    ]

    # Predict 24h curve
    lat = current_user.weather_latitude or 12.9716
    lon = current_user.weather_longitude or 77.5946
    weather_info = weather_service.fetch_live_weather(lat=lat, lon=lon, city=current_user.weather_city or "Bengaluru")
    curr_temp = weather_info["current"]["temperature"]

    pred_res = demand_predictor.train_and_predict(
        records_data,
        forecast_period="24h",
        current_temp=curr_temp
    )

    points_24h = pred_res.get("forecast_points", [])
    analysis = peak_demand_service.analyze_peak_profile(
        predicted_24h_points=points_24h,
        threshold_low=threshold_low,
        threshold_medium=threshold_med,
        threshold_high=threshold_high
    )

    analysis["hourly_points"] = points_24h
    analysis["actual_historical_avg_peak"] = round(sum(r.peak_usage for r in records) / len(records), 2)
    return analysis

@router.put("/thresholds")
def update_thresholds(
    req: ThresholdUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.low <= 0 or req.medium <= req.low or req.high <= req.medium:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thresholds must satisfy: 0 < Low < Medium < High"
        )

    current_user.demand_threshold_low = req.low
    current_user.demand_threshold_medium = req.medium
    current_user.demand_threshold_high = req.high
    db.commit()

    return {
        "status": "success",
        "message": "Peak demand thresholds updated successfully.",
        "thresholds": {
            "low": current_user.demand_threshold_low,
            "medium": current_user.demand_threshold_medium,
            "high": current_user.demand_threshold_high
        }
    }
