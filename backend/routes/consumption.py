from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from backend.database import get_db
from backend.models.user import User
from backend.models.electricity_record import ElectricityRecord
from backend.models.anomaly import Anomaly
from backend.models.alert import AlertType, AlertSeverity
from backend.schemas.consumption_schema import (
    ConsumptionCreate,
    ConsumptionResponse,
    CSVUploadSummary
)
from backend.services.csv_processor import csv_processor
from backend.ml.anomalies import anomaly_detector
from backend.services.notification_service import notification_service
from backend.services.recommendation_service import recommendation_engine
from backend.models.recommendation import Recommendation
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/consumption", tags=["Consumption"])

def _run_post_ingestion_analysis(db: Session, user: User, record: ElectricityRecord):
    """
    Evaluates new consumption telemetry for statistical anomalies, budget breaches,
    and updates dynamic recommendations.
    """
    all_records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == user.id)
        .order_by(ElectricityRecord.date.asc())
        .all()
    )
    records_dict = [
        {
            "id": r.id,
            "date": r.date,
            "units_consumed": r.units_consumed,
            "bill_amount": r.bill_amount,
            "number_of_days": r.number_of_days,
            "peak_usage": r.peak_usage
        }
        for r in all_records
    ]

    current_dict = {
        "id": record.id,
        "date": record.date,
        "units_consumed": record.units_consumed,
        "bill_amount": record.bill_amount,
        "number_of_days": record.number_of_days,
        "peak_usage": record.peak_usage
    }

    # 1. Anomaly Detection
    score, severity, explanation = anomaly_detector.analyze_record(current_dict, records_dict)
    if severity.value != "Normal":
        # Check if anomaly already stored for this record
        existing_anom = db.query(Anomaly).filter(Anomaly.record_id == record.id).first()
        if not existing_anom:
            anomaly = Anomaly(
                user_id=user.id,
                record_id=record.id,
                anomaly_score=score,
                severity=severity,
                explanation=explanation
            )
            db.add(anomaly)
            db.commit()

            # Trigger in-app & push alert
            alert_sev = AlertSeverity.Critical if severity.value == "Highly Unusual" else AlertSeverity.Warning
            notification_service.send_notification(
                db=db,
                user_id=user.id,
                alert_type=AlertType.ANOMALY,
                title="🚨 Unusual electricity consumption detected",
                message=explanation,
                severity=alert_sev
            )

    # 2. Budget Alert Check
    if user.monthly_budget > 0 and record.bill_amount > user.monthly_budget:
        notification_service.send_notification(
            db=db,
            user_id=user.id,
            alert_type=AlertType.BUDGET,
            title="💰 Electricity budget limit exceeded",
            message=f"Billed amount of ₹{record.bill_amount:,.2f} on {record.date} exceeded your set budget of ₹{user.monthly_budget:,.2f}.",
            severity=AlertSeverity.Warning
        )

    # 3. Synchronize Recommendations
    recs = recommendation_engine.generate_recommendations(
        records=records_dict,
        latest_prediction=None,
        anomalies=[{"explanation": explanation}] if severity.value != "Normal" else None,
        monthly_budget=user.monthly_budget,
        consumer_type=user.consumer_type.value if hasattr(user.consumer_type, 'value') else str(user.consumer_type)
    )

    # Clean old recommendations and store updated set
    db.query(Recommendation).filter(Recommendation.user_id == user.id).delete()
    for r in recs:
        rec_obj = Recommendation(
            user_id=user.id,
            title=r["title"],
            reason=r["reason"],
            action=r["action"],
            priority=r["priority"],
            expected_benefit=r["expected_benefit"]
        )
        db.add(rec_obj)
    db.commit()


@router.post("", response_model=ConsumptionResponse, status_code=status.HTTP_201_CREATED)
def add_consumption_record(
    req: ConsumptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check date collision
    existing = db.query(ElectricityRecord).filter(
        ElectricityRecord.user_id == current_user.id,
        ElectricityRecord.date == req.date
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A consumption entry for date {req.date} already exists. Please edit or delete the existing record."
        )

    if req.peak_usage > req.units_consumed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Peak usage ({req.peak_usage} units) cannot exceed total units consumed ({req.units_consumed} units)."
        )

    record = ElectricityRecord(
        user_id=current_user.id,
        date=req.date,
        units_consumed=round(req.units_consumed, 2),
        bill_amount=round(req.bill_amount, 2),
        number_of_days=req.number_of_days,
        peak_usage=round(req.peak_usage, 2)
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Run background checks
    try:
        _run_post_ingestion_analysis(db, current_user, record)
    except Exception:
        pass

    return ConsumptionResponse.model_validate(record)


@router.get("", response_model=List[ConsumptionResponse])
def get_consumption_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == current_user.id)
        .order_by(ElectricityRecord.date.desc())
        .all()
    )
    return [ConsumptionResponse.model_validate(r) for r in records]


@router.get("/{record_id}", response_model=ConsumptionResponse)
def get_consumption_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.id == record_id, ElectricityRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consumption record not found."
        )
    return ConsumptionResponse.model_validate(record)


@router.delete("/{record_id}")
def delete_consumption_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.id == record_id, ElectricityRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consumption record not found."
        )
    db.delete(record)
    db.commit()
    return {"message": "Electricity record deleted successfully."}


@router.post("/upload-csv", response_model=CSVUploadSummary)
async def upload_consumption_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a standard .csv file."
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded CSV file is empty."
        )

    # Get user's existing recorded dates
    existing_records = (
        db.query(ElectricityRecord.date)
        .filter(ElectricityRecord.user_id == current_user.id)
        .all()
    )
    existing_dates = [r[0] for r in existing_records]

    valid_rows, summary = csv_processor.process_csv_content(content, existing_dates)

    if valid_rows:
        new_records = []
        for row in valid_rows:
            rec = ElectricityRecord(
                user_id=current_user.id,
                date=row["date"],
                units_consumed=row["units_consumed"],
                bill_amount=row["bill_amount"],
                number_of_days=row["number_of_days"],
                peak_usage=row["peak_usage"]
            )
            new_records.append(rec)
            db.add(rec)
        db.commit()

        # Run analysis on the latest imported record
        try:
            latest_saved = sorted(new_records, key=lambda x: x.date)[-1]
            _run_post_ingestion_analysis(db, current_user, latest_saved)
        except Exception:
            pass

    return summary
