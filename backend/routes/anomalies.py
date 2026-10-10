from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.user import User
from backend.models.anomaly import Anomaly
from backend.models.electricity_record import ElectricityRecord
from backend.schemas.anomaly_schema import AnomalyResponse
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])

@router.get("", response_model=List[AnomalyResponse])
def get_user_anomalies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    anomalies = (
        db.query(Anomaly, ElectricityRecord)
        .outerjoin(ElectricityRecord, Anomaly.record_id == ElectricityRecord.id)
        .filter(Anomaly.user_id == current_user.id)
        .order_by(Anomaly.created_at.desc())
        .all()
    )

    results = []
    for anom, rec in anomalies:
        results.append(
            AnomalyResponse(
                id=anom.id,
                user_id=anom.user_id,
                record_id=anom.record_id,
                anomaly_score=anom.anomaly_score,
                severity=anom.severity,
                explanation=anom.explanation,
                created_at=anom.created_at,
                record_date=rec.date.strftime("%Y-%m-%d") if rec else None,
                record_units=rec.units_consumed if rec else None
            )
        )
    return results
