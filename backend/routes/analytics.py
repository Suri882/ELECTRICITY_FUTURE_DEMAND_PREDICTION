from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import numpy as np
from backend.database import get_db
from backend.models.user import User
from backend.models.electricity_record import ElectricityRecord
from backend.models.prediction import Prediction
from backend.models.anomaly import Anomaly
from backend.schemas.analytics_schema import (
    SummaryCardsResponse,
    EfficiencyScoreResponse,
    CostAnalysisResponse,
    PeakDemandAnalysisResponse,
    PeakDemandPeriod,
    HistoricalChartPoint,
    PredictedVsActualPoint,
    MonthlyBillPoint,
    AnalyticsDashboardData
)
from backend.services.efficiency_service import efficiency_calculator
from backend.services.cost_service import cost_service
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary", response_model=SummaryCardsResponse)
def get_dashboard_summary(
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
        return SummaryCardsResponse(
            has_data=False,
            records_count=0
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

    latest_rec = records[-1]
    current_units = latest_rec.units_consumed

    # Get latest prediction
    latest_pred = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .first()
    )

    # Anomaly count
    anomalies_count = (
        db.query(Anomaly)
        .filter(Anomaly.user_id == current_user.id)
        .count()
    )

    # Calculate real efficiency score
    eff_res = efficiency_calculator.calculate(
        records=records_data,
        monthly_budget=current_user.monthly_budget,
        anomalies_count=anomalies_count
    )

    all_units = [r.units_consumed for r in records]
    avg_units = sum(all_units) / len(all_units)

    pred_units = latest_pred.predicted_demand if latest_pred else None
    pred_level = latest_pred.demand_level.value if latest_pred else None
    pct_change = round(((pred_units - avg_units) / (avg_units + 1e-5)) * 100, 1) if pred_units is not None else None

    return SummaryCardsResponse(
        has_data=True,
        current_consumption=current_units,
        predicted_demand=pred_units,
        demand_level=pred_level,
        efficiency_score=eff_res.overall_score,
        previous_average=round(avg_units, 2),
        percentage_change=pct_change,
        records_count=len(records)
    )


@router.get("/efficiency", response_model=EfficiencyScoreResponse)
def get_efficiency_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == current_user.id)
        .order_by(ElectricityRecord.date.asc())
        .all()
    )
    records_data = [
        {
            "units_consumed": r.units_consumed,
            "bill_amount": r.bill_amount,
            "number_of_days": r.number_of_days,
            "peak_usage": r.peak_usage
        }
        for r in records
    ]
    anomalies_count = db.query(Anomaly).filter(Anomaly.user_id == current_user.id).count()

    return efficiency_calculator.calculate(
        records=records_data,
        monthly_budget=current_user.monthly_budget,
        anomalies_count=anomalies_count
    )


@router.get("/cost", response_model=CostAnalysisResponse)
def get_cost_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ElectricityRecord)
        .filter(ElectricityRecord.user_id == current_user.id)
        .order_by(ElectricityRecord.date.asc())
        .all()
    )
    records_data = [
        {
            "units_consumed": r.units_consumed,
            "bill_amount": r.bill_amount
        }
        for r in records
    ]
    return cost_service.analyze_cost(records_data, current_user.monthly_budget)


@router.get("/peak", response_model=Optional[PeakDemandAnalysisResponse])
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
    if not records:
        return None

    units_list = [r.units_consumed for r in records]
    peak_list = [r.peak_usage for r in records]

    max_peak = max(peak_list)
    avg_demand = sum(units_list) / len(units_list)
    total_peak = sum(peak_list)
    total_units = sum(units_list)
    overall_peak_pct = round((total_peak / (total_units + 1e-5)) * 100, 1)

    peak_periods = []
    for r in records[-8:]:
        ratio = round((r.peak_usage / (r.units_consumed + 1e-5)) * 100, 1)
        peak_periods.append(
            PeakDemandPeriod(
                date=r.date.strftime("%b %d, %Y"),
                units_consumed=r.units_consumed,
                peak_usage=r.peak_usage,
                peak_ratio_percent=ratio
            )
        )

    if max_peak > (avg_demand * 0.4):
        comp = f"Peak consumption spiked up to {max_peak:.1f} units, which is {((max_peak/avg_demand)*100):.0f}% of typical total load."
    else:
        comp = f"Peak usage remains safely distributed below 40% of baseline consumption."

    return PeakDemandAnalysisResponse(
        peak_demand=round(max_peak, 2),
        average_demand=round(avg_demand, 2),
        peak_percentage=overall_peak_pct,
        peak_periods=peak_periods,
        historical_peak_comparison=comp
    )


@router.get("/dashboard-full", response_model=AnalyticsDashboardData)
def get_full_analytics_dashboard(
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
        return AnalyticsDashboardData(
            summary=SummaryCardsResponse(has_data=False, records_count=0),
            historical_consumption=[],
            predicted_vs_actual=[],
            monthly_bill=[]
        )

    summary = get_dashboard_summary(current_user, db)
    cost = get_cost_analysis(current_user, db)
    efficiency = get_efficiency_breakdown(current_user, db)
    peak = get_peak_demand_analysis(current_user, db)

    # Historical time series points
    historical_points = [
        HistoricalChartPoint(
            date=r.date.strftime("%b %y"),
            units_consumed=r.units_consumed,
            bill_amount=r.bill_amount,
            peak_usage=r.peak_usage
        )
        for r in records
    ]

    # Predicted vs actual points
    predictions = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.prediction_date.asc())
        .all()
    )
    pred_map = {p.prediction_date.strftime("%Y-%m"): p.predicted_demand for p in predictions}

    pred_vs_actual = []
    for r in records:
        month_key = r.date.strftime("%Y-%m")
        pred_vs_actual.append(
            PredictedVsActualPoint(
                date=r.date.strftime("%b %y"),
                actual=r.units_consumed,
                predicted=pred_map.get(month_key, None)
            )
        )

    # Monthly bill points
    monthly_bills = [
        MonthlyBillPoint(
            month=r.date.strftime("%b %y"),
            bill_amount=r.bill_amount,
            units_consumed=r.units_consumed,
            budget=current_user.monthly_budget
        )
        for r in records
    ]

    return AnalyticsDashboardData(
        summary=summary,
        historical_consumption=historical_points,
        predicted_vs_actual=pred_vs_actual,
        monthly_bill=monthly_bills,
        peak_analysis=peak,
        efficiency_breakdown=efficiency,
        cost_analysis=cost
    )
