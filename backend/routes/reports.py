import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.user import User
from backend.models.report import Report
from backend.models.electricity_record import ElectricityRecord
from backend.models.prediction import Prediction
from backend.models.anomaly import Anomaly
from backend.models.recommendation import Recommendation
from backend.models.alert import AlertType, AlertSeverity
from backend.services.report_service import report_generator
from backend.services.efficiency_service import efficiency_calculator
from backend.services.cost_service import cost_service
from backend.services.notification_service import notification_service
from backend.utils.dependencies import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/reports", tags=["Reports"])

class ReportItem(BaseModel):
    id: int
    user_id: int
    report_type: str
    file_name: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/generate", response_model=ReportItem)
def generate_energy_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == current_user.id)
        .order_by(ElectricityRecord.date.asc())
        .all()
    )

    if not records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate an audit report without consumption records. Please log electricity data first."
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

    latest_pred = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    pred_data = {
        "predicted_demand": latest_pred.predicted_demand,
        "demand_level": latest_pred.demand_level.value,
        "prediction_quality": latest_pred.prediction_quality,
        "mae": latest_pred.mae,
        "rmse": latest_pred.rmse,
        "r2_score": latest_pred.r2_score,
        "model_name": latest_pred.model_name,
        "percentage_change": 0.0,
        "explanation": f"Forecasted {latest_pred.predicted_demand} units."
    } if latest_pred else None

    anomalies = (
        db.query(Anomaly)
        .filter(Anomaly.user_id == current_user.id)
        .order_by(Anomaly.created_at.desc())
        .all()
    )
    anom_data = [
        {
            "anomaly_score": a.anomaly_score,
            "severity": a.severity.value,
            "explanation": a.explanation
        }
        for a in anomalies
    ]

    recs = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
        .all()
    )
    recs_data = [
        {
            "title": r.title,
            "reason": r.reason,
            "action": r.action,
            "priority": r.priority.value,
            "expected_benefit": r.expected_benefit
        }
        for r in recs
    ]

    eff_res = efficiency_calculator.calculate(
        records=records_data,
        monthly_budget=current_user.monthly_budget,
        anomalies_count=len(anomalies)
    )

    cost_res = cost_service.analyze_cost(records_data, current_user.monthly_budget)

    # Generate PDF
    pdf_path = report_generator.generate_pdf(
        user=current_user,
        records=records_data,
        latest_prediction=pred_data,
        efficiency=eff_res.model_dump(),
        cost_analysis=cost_res.model_dump(),
        anomalies=anom_data,
        recommendations=recs_data
    )

    # Save record
    report = Report(
        user_id=current_user.id,
        report_type="Energy Audit & Demand Prediction Report",
        file_path=pdf_path
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Send Notification
    notification_service.send_notification(
        db=db,
        user_id=current_user.id,
        alert_type=AlertType.REPORT,
        title="📊 Your energy intelligence report is ready",
        message="A comprehensive audit document has been compiled and is ready for download.",
        severity=AlertSeverity.Info
    )

    return ReportItem(
        id=report.id,
        user_id=report.user_id,
        report_type=report.report_type,
        file_name=os.path.basename(report.file_path),
        created_at=report.created_at
    )

@router.get("", response_model=List[ReportItem])
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = (
        db.query(Report)
        .filter(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
        .all()
    )
    return [
        ReportItem(
            id=r.id,
            user_id=r.user_id,
            report_type=r.report_type,
            file_name=os.path.basename(r.file_path),
            created_at=r.created_at
        )
        for r in reports
    ]

@router.get("/download/{report_id}")
def download_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == current_user.id)
        .first()
    )
    if not report or not os.path.exists(report.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested report file does not exist on disk."
        )

    return FileResponse(
        path=report.file_path,
        media_type="application/pdf",
        filename=os.path.basename(report.file_path)
    )

@router.get("/export/csv")
def export_csv_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import io
    import csv
    from fastapi.responses import Response

    records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == current_user.id)
        .order_by(ElectricityRecord.date.asc())
        .all()
    )

    preds = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.asc())
        .all()
    )

    factor = current_user.grid_emission_factor or 0.82

    output = io.StringIO()
    writer = csv.writer(output)

    # 1. Consumption section
    writer.writerow(["--- HISTORICAL CONSUMPTION RECORDS ---"])
    writer.writerow(["Date", "Units Consumed (kWh)", "Bill Amount (INR)", "Days", "Peak Usage (kWh)", "Carbon Emissions (kg CO2e)"])
    for r in records:
        carb = round(r.units_consumed * factor, 2)
        writer.writerow([r.date, r.units_consumed, r.bill_amount, r.number_of_days, r.peak_usage, carb])

    writer.writerow([])
    # 2. Predictions section
    writer.writerow(["--- AI DEMAND PREDICTIONS ---"])
    writer.writerow(["Generated At", "Target Date", "Horizon", "Predicted Demand (kWh)", "Demand Level", "Model Name", "MAE", "RMSE", "R2 Score"])
    for p in preds:
        writer.writerow([
            p.created_at.strftime("%Y-%m-%d %H:%M"),
            p.prediction_date,
            getattr(p, 'forecast_period', '30d'),
            p.predicted_demand,
            p.demand_level.value if hasattr(p.demand_level, 'value') else str(p.demand_level),
            p.model_name,
            p.mae,
            p.rmse,
            p.r2_score
        ])

    csv_bytes = output.getvalue().encode("utf-8-sig")
    filename = f"energy_audit_{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/history-unified")
def get_unified_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from backend.models.simulation import SimulationRecord

    preds = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .limit(20)
        .all()
    )

    sims = (
        db.query(SimulationRecord)
        .filter(SimulationRecord.user_id == current_user.id)
        .order_by(SimulationRecord.created_at.desc())
        .limit(20)
        .all()
    )

    recs = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
        .limit(20)
        .all()
    )

    items = []
    for p in preds:
        items.append({
            "type": "Prediction Run",
            "timestamp": p.created_at,
            "title": f"Forecast: {p.predicted_demand} kWh ({p.forecast_period or '30d'})",
            "details": f"Model: {p.model_name} (MAE: {p.mae}, R²: {p.r2_score}). Target: {p.prediction_date}.",
            "tag": p.demand_level.value if hasattr(p.demand_level, 'value') else str(p.demand_level)
        })

    for s in sims:
        items.append({
            "type": "Simulation Scenario",
            "timestamp": s.created_at,
            "title": f"What-If: {s.scenario_name}",
            "details": f"Saved {s.kwh_saved} kWh, ₹{s.cost_saved} bill saving, avoided {s.emissions_saved_kg} kg CO2e.",
            "tag": f"-{s.peak_reduction_pct}% Cut"
        })

    for r in recs:
        items.append({
            "type": "Optimization Directive",
            "timestamp": r.created_at,
            "title": r.title,
            "details": r.action,
            "tag": r.priority.value if hasattr(r.priority, 'value') else str(r.priority)
        })

    items.sort(key=lambda x: x["timestamp"], reverse=True)
    return items
