import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from backend.database import get_db
from backend.models.user import User
from backend.models.electricity_record import ElectricityRecord
from backend.models.prediction import Prediction, DemandLevel
from backend.models.alert import AlertType, AlertSeverity
from backend.schemas.prediction_schema import (
    PredictionRequest,
    PredictionResponse,
    ModelComparisonResult
)
from backend.ml.predictor import demand_predictor, MINIMUM_RECORDS_FOR_PREDICTION
from backend.services.weather_service import weather_service
from backend.services.notification_service import notification_service
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])

@router.post("", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def generate_prediction(
    req: PredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == current_user.id)
        .order_by(ElectricityRecord.date.asc())
        .all()
    )

    if len(records) < MINIMUM_RECORDS_FOR_PREDICTION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Not enough historical data to generate a reliable prediction. "
                f"Add more consumption records (minimum {MINIMUM_RECORDS_FOR_PREDICTION} required, you have {len(records)})."
            )
        )

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

    target_date = req.target_date
    forecast_period = req.forecast_period or "30d"

    # Fetch weather context (live or manual)
    lat = current_user.weather_latitude or 12.9716
    lon = current_user.weather_longitude or 77.5946
    city = current_user.weather_city or "Bengaluru"
    weather_info = weather_service.fetch_live_weather(lat=lat, lon=lon, city=city, manual_temp=req.manual_temp)
    current_temp = weather_info["current"]["temperature"]
    weather_cond = weather_info["current"]["condition"]
    weather_daily = weather_info.get("daily_forecast", [])

    try:
        result = demand_predictor.train_and_predict(
            records_data,
            target_date=target_date,
            forecast_period=forecast_period,
            current_temp=current_temp,
            weather_forecast=weather_daily
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Prediction failed: {str(e)}"
        )

    # Save to database
    prediction = Prediction(
        user_id=current_user.id,
        record_id=records[-1].id if records else None,
        predicted_demand=result["predicted_demand"],
        demand_level=result["demand_level"],
        prediction_quality=result["prediction_quality"],
        mae=result["mae"],
        rmse=result["rmse"],
        r2_score=result["r2_score"],
        model_name=result["model_name"],
        prediction_date=result["prediction_date"],
        forecast_period=forecast_period,
        temperature=current_temp,
        weather_condition=weather_cond,
        details_json=json.dumps({
            "forecast_points": result.get("forecast_points", []),
            "model_comparison": result.get("model_comparison", []),
            "validation_notes": result.get("validation_notes", "")
        })
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    # Send Notification if High or Critical demand
    if result["demand_level"] in [DemandLevel.High, DemandLevel.Critical]:
        sev = AlertSeverity.Critical if result["demand_level"] == DemandLevel.Critical else AlertSeverity.Warning
        notification_service.send_notification(
            db=db,
            user_id=current_user.id,
            alert_type=AlertType.HIGH_DEMAND,
            title=f"⚡ High electricity demand expected ({forecast_period})",
            message=result["explanation"],
            severity=sev
        )

    return PredictionResponse(
        id=prediction.id,
        user_id=prediction.user_id,
        record_id=prediction.record_id,
        predicted_demand=prediction.predicted_demand,
        demand_level=prediction.demand_level,
        prediction_quality=prediction.prediction_quality,
        mae=prediction.mae,
        rmse=prediction.rmse,
        r2_score=prediction.r2_score,
        model_name=prediction.model_name,
        prediction_date=prediction.prediction_date,
        forecast_period=forecast_period,
        temperature_used=current_temp,
        created_at=prediction.created_at,
        previous_average=result["previous_average"],
        percentage_change=result["percentage_change"],
        explanation=result["explanation"],
        model_comparison=result.get("model_comparison"),
        forecast_points=result.get("forecast_points"),
        validation_notes=result.get("validation_notes")
    )


@router.get("", response_model=List[PredictionResponse])
def get_prediction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    preds = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    avg_val = db.query(ElectricityRecord.units_consumed).filter(ElectricityRecord.user_id == current_user.id).all()
    avg = sum([x[0] for x in avg_val]) / len(avg_val) if avg_val else 0.0

    responses = []
    for p in preds:
        pct = round(((p.predicted_demand - avg) / (avg + 1e-5)) * 100, 1) if avg > 0 else 0.0
        points = []
        comparison = []
        val_notes = None
        if p.details_json:
            try:
                parsed = json.loads(p.details_json)
                points = parsed.get("forecast_points", [])
                comparison = parsed.get("model_comparison", [])
                val_notes = parsed.get("validation_notes")
            except Exception:
                pass

        responses.append(
            PredictionResponse(
                id=p.id,
                user_id=p.user_id,
                record_id=p.record_id,
                predicted_demand=p.predicted_demand,
                demand_level=p.demand_level,
                prediction_quality=p.prediction_quality or "Good",
                mae=p.mae,
                rmse=p.rmse,
                r2_score=p.r2_score,
                model_name=p.model_name or "Ridge Regression",
                prediction_date=p.prediction_date,
                forecast_period=p.forecast_period or "30d",
                temperature_used=p.temperature,
                created_at=p.created_at,
                previous_average=round(avg, 2),
                percentage_change=pct,
                explanation=f"Forecast of {p.predicted_demand} kWh ({p.demand_level.value} level).",
                model_comparison=comparison,
                forecast_points=points,
                validation_notes=val_notes
            )
        )
    return responses


@router.get("/latest", response_model=Optional[PredictionResponse])
def get_latest_prediction(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    if not latest:
        return None

    avg_val = db.query(ElectricityRecord.units_consumed).filter(ElectricityRecord.user_id == current_user.id).all()
    avg = sum([x[0] for x in avg_val]) / len(avg_val) if avg_val else 0.0
    pct = round(((latest.predicted_demand - avg) / (avg + 1e-5)) * 100, 1) if avg > 0 else 0.0

    points = []
    comparison = []
    val_notes = None
    if latest.details_json:
        try:
            parsed = json.loads(latest.details_json)
            points = parsed.get("forecast_points", [])
            comparison = parsed.get("model_comparison", [])
            val_notes = parsed.get("validation_notes")
        except Exception:
            pass

    return PredictionResponse(
        id=latest.id,
        user_id=latest.user_id,
        record_id=latest.record_id,
        predicted_demand=latest.predicted_demand,
        demand_level=latest.demand_level,
        prediction_quality=latest.prediction_quality or "Good",
        mae=latest.mae,
        rmse=latest.rmse,
        r2_score=latest.r2_score,
        model_name=latest.model_name or "Ridge Regression",
        prediction_date=latest.prediction_date,
        forecast_period=latest.forecast_period or "30d",
        temperature_used=latest.temperature,
        created_at=latest.created_at,
        previous_average=round(avg, 2),
        percentage_change=pct,
        explanation=f"Forecasted demand is {latest.predicted_demand} kWh ({latest.demand_level.value} level).",
        model_comparison=comparison,
        forecast_points=points,
        validation_notes=val_notes
    )
