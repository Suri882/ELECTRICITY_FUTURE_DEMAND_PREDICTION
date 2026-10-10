from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from backend.database import get_db
from backend.models.user import User, UserRole
from backend.models.electricity_record import ElectricityRecord
from backend.models.prediction import Prediction
from backend.models.alert import Alert
from backend.schemas.admin_schema import (
    AdminStatsResponse,
    AdminUserItem,
    SystemActivityPoint,
    AdminDashboardData
)
from backend.services.efficiency_service import efficiency_calculator
from backend.utils.dependencies import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])

@router.get("/dashboard", response_model=AdminDashboardData)
def get_admin_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_records = db.query(ElectricityRecord).count()
    total_predictions = db.query(Prediction).count()
    total_alerts = db.query(Alert).count()

    # Active users: users who logged at least 1 record in the past 60 days (or overall)
    active_users = db.query(func.count(func.distinct(ElectricityRecord.user_id))).scalar() or 0

    # User items with record counts
    users = db.query(User).order_by(User.created_at.desc()).all()
    user_items = []
    efficiency_scores = []

    for u in users:
        rec_count = db.query(ElectricityRecord).filter(ElectricityRecord.user_id == u.id).count()
        pred_count = db.query(Prediction).filter(Prediction.user_id == u.id).count()
        
        # Calculate individual efficiency if records exist
        if rec_count > 0:
            user_recs = db.query(ElectricityRecord).filter(ElectricityRecord.user_id == u.id).all()
            recs_dict = [{"units_consumed": r.units_consumed, "bill_amount": r.bill_amount, "peak_usage": r.peak_usage, "number_of_days": r.number_of_days} for r in user_recs]
            eff = efficiency_calculator.calculate(recs_dict, u.monthly_budget, 0)
            efficiency_scores.append(eff.overall_score)

        user_items.append(
            AdminUserItem(
                id=u.id,
                name=u.name,
                email=u.email,
                phone=u.phone,
                role=u.role,
                consumer_type=u.consumer_type,
                location=u.location,
                monthly_budget=u.monthly_budget,
                records_count=rec_count,
                predictions_count=pred_count,
                created_at=u.created_at
            )
        )

    avg_eff = round(sum(efficiency_scores) / len(efficiency_scores), 1) if efficiency_scores else 0.0

    # Activity trends over the last 6 months or cycles
    today = datetime.utcnow()
    activity_points = []
    for i in range(5, -1, -1):
        target_month_dt = today - timedelta(days=i*30)
        month_label = target_month_dt.strftime("%b %y")
        start_dt = target_month_dt.replace(day=1, hour=0, minute=0, second=0)
        # Next month approximation
        end_dt = start_dt + timedelta(days=32)

        records_logged = db.query(ElectricityRecord).filter(ElectricityRecord.created_at >= start_dt, ElectricityRecord.created_at < end_dt).count()
        predictions_run = db.query(Prediction).filter(Prediction.created_at >= start_dt, Prediction.created_at < end_dt).count()
        alerts_triggered = db.query(Alert).filter(Alert.created_at >= start_dt, Alert.created_at < end_dt).count()

        activity_points.append(
            SystemActivityPoint(
                date=month_label,
                records_logged=records_logged,
                predictions_run=predictions_run,
                alerts_triggered=alerts_triggered
            )
        )

    return AdminDashboardData(
        stats=AdminStatsResponse(
            total_users=total_users,
            active_users=active_users,
            total_consumption_records=total_records,
            total_predictions=total_predictions,
            total_alerts=total_alerts,
            average_efficiency_score=avg_eff
        ),
        users=user_items,
        activity_trends=activity_points
    )


@router.get("/users", response_model=List[AdminUserItem])
def search_and_list_users(
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (User.name.ilike(search_filter)) | (User.email.ilike(search_filter)) | (User.phone.ilike(search_filter))
        )
    users = query.order_by(User.created_at.desc()).all()

    items = []
    for u in users:
        rec_count = db.query(ElectricityRecord).filter(ElectricityRecord.user_id == u.id).count()
        pred_count = db.query(Prediction).filter(Prediction.user_id == u.id).count()
        items.append(
            AdminUserItem(
                id=u.id,
                name=u.name,
                email=u.email,
                phone=u.phone,
                role=u.role,
                consumer_type=u.consumer_type,
                location=u.location,
                monthly_budget=u.monthly_budget,
                records_count=rec_count,
                predictions_count=pred_count,
                created_at=u.created_at
            )
        )
    return items


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot delete their own active account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    db.delete(user)
    db.commit()
    return {"message": f"User {user.email} and all associated records deleted."}
