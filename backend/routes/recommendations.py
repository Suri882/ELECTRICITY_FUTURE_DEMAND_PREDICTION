from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.user import User
from backend.models.recommendation import Recommendation
from backend.models.electricity_record import ElectricityRecord
from backend.models.prediction import Prediction
from backend.models.anomaly import Anomaly
from backend.schemas.recommendation_schema import RecommendationResponse
from backend.services.recommendation_service import recommendation_engine
from backend.services.weather_service import weather_service
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

def _refresh_recommendations_for_user(user: User, db: Session):
    records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == user.id)
        .order_by(ElectricityRecord.date.asc())
        .all()
    )
    if not records:
        return []

    records_data = [
        {
            "date": r.date,
            "units_consumed": r.units_consumed,
            "bill_amount": r.bill_amount,
            "peak_usage": r.peak_usage
        }
        for r in records
    ]

    latest_pred = (
        db.query(Prediction)
        .filter(Prediction.user_id == user.id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    pred_data = {
        "predicted_demand": latest_pred.predicted_demand,
        "demand_level": latest_pred.demand_level.value,
        "percentage_change": getattr(latest_pred, "percentage_change", 0.0)
    } if latest_pred else None

    anomalies = (
        db.query(Anomaly)
        .filter(Anomaly.user_id == user.id)
        .order_by(Anomaly.created_at.desc())
        .limit(3)
        .all()
    )
    anom_data = [{"anomaly_score": a.anomaly_score, "explanation": a.explanation} for a in anomalies]

    weather_info = weather_service.fetch_live_weather(
        lat=user.weather_latitude or 12.9716,
        lon=user.weather_longitude or 77.5946,
        city=user.weather_city or "Bengaluru"
    )

    generated = recommendation_engine.generate_recommendations(
        records=records_data,
        latest_prediction=pred_data,
        anomalies=anom_data,
        monthly_budget=user.monthly_budget,
        consumer_type=user.consumer_type.value if hasattr(user.consumer_type, "value") else str(user.consumer_type),
        demand_threshold_high=user.demand_threshold_high or 700.0,
        weather_alert=weather_info.get("weather_warning"),
        base_tariff=user.base_tariff_rate or 7.50
    )

    # Clear existing and save new
    db.query(Recommendation).filter(Recommendation.user_id == user.id).delete()
    for g in generated:
        # Save structured reason with 'What was detected'
        full_reason = f"{g.get('detected', '')} {g.get('reason', '')}".strip()
        new_r = Recommendation(
            user_id=user.id,
            title=g["title"],
            reason=full_reason,
            action=g["action"],
            priority=g["priority"],
            expected_benefit=g["expected_benefit"]
        )
        db.add(new_r)
    db.commit()

    return db.query(Recommendation).filter(Recommendation.user_id == user.id).all()

@router.get("", response_model=List[RecommendationResponse])
def get_user_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recs = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
        .all()
    )

    if not recs:
        recs = _refresh_recommendations_for_user(current_user, db)

    return [RecommendationResponse.model_validate(r) for r in recs]

@router.post("/refresh", response_model=List[RecommendationResponse])
def refresh_user_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recs = _refresh_recommendations_for_user(current_user, db)
    return [RecommendationResponse.model_validate(r) for r in recs]
