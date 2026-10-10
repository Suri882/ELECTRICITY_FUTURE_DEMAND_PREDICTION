import numpy as np
from typing import List, Dict, Any
from backend.schemas.analytics_schema import EfficiencyScoreResponse, ScoreFactorDetail

class EfficiencyScoreCalculator:
    """
    Computes a transparent, deterministic 0–100 Energy Efficiency Score
    across 5 objective dimensions:
    1. Consumption Trend (weight: 25)
    2. Demand Growth (weight: 20)
    3. Peak Usage Ratio (weight: 25)
    4. Budget Performance (weight: 15)
    5. Anomaly Frequency (weight: 15)
    """

    def calculate(
        self,
        records: List[Dict[str, Any]],
        monthly_budget: float = 0.0,
        anomalies_count: int = 0
    ) -> EfficiencyScoreResponse:
        if not records:
            return EfficiencyScoreResponse(
                overall_score=0,
                category="Needs Improvement",
                factors=[],
                summary="No consumption data available to compute energy efficiency score."
            )

        # 1. Consumption Trend Score (weight 25)
        # Evaluates whether the last record is lower or higher than historical average
        units_list = [float(r["units_consumed"]) for r in records]
        avg_units = float(np.mean(units_list))
        latest_units = units_list[-1]
        
        ratio_to_avg = latest_units / (avg_units + 1e-5)
        if ratio_to_avg <= 0.85:
            trend_score = 25.0
            trend_desc = "Consumption is lower than historical baseline (+25 pts)."
        elif ratio_to_avg <= 1.05:
            trend_score = 20.0
            trend_desc = "Consumption is steady around average (+20 pts)."
        elif ratio_to_avg <= 1.25:
            trend_score = 12.0
            trend_desc = "Consumption is trending moderately higher (+12 pts)."
        else:
            trend_score = 5.0
            trend_desc = "Consumption is significantly above historical baseline (+5 pts)."

        # 2. Demand Growth Score (weight 20)
        # Compares last 2 records
        if len(records) >= 2:
            prev_units = units_list[-2]
            growth_pct = ((latest_units - prev_units) / (prev_units + 1e-5)) * 100
            if growth_pct <= -5:
                growth_score = 20.0
                growth_desc = f"Demand contracted by {abs(growth_pct):.1f}% since previous cycle (+20 pts)."
            elif growth_pct <= 5:
                growth_score = 16.0
                growth_desc = f"Demand remained steady within ±5% (+16 pts)."
            elif growth_pct <= 20:
                growth_score = 10.0
                growth_desc = f"Demand grew by {growth_pct:.1f}% (+10 pts)."
            else:
                growth_score = 4.0
                growth_desc = f"Sharp demand surge of +{growth_pct:.1f}% (+4 pts)."
        else:
            growth_score = 15.0
            growth_desc = "Initial record baseline recorded (+15 pts)."

        # 3. Peak Usage Ratio Score (weight 25)
        latest_record = records[-1]
        peak_units = float(latest_record.get("peak_usage", 0.0))
        peak_ratio = (peak_units / latest_units) if latest_units > 0 else 0.0
        
        if peak_ratio <= 0.15:
            peak_score = 25.0
            peak_desc = f"Excellent off-peak distribution ({peak_ratio*100:.1f}% in peak hours, +25 pts)."
        elif peak_ratio <= 0.30:
            peak_score = 20.0
            peak_desc = f"Good peak usage balance ({peak_ratio*100:.1f}% peak load, +20 pts)."
        elif peak_ratio <= 0.45:
            peak_score = 12.0
            peak_desc = f"Elevated peak load ({peak_ratio*100:.1f}% in peak hours, +12 pts)."
        else:
            peak_score = 5.0
            peak_desc = f"Heavy peak concentration ({peak_ratio*100:.1f}% in peak hours, +5 pts)."

        # 4. Budget Performance Score (weight 15)
        latest_bill = float(latest_record.get("bill_amount", 0.0))
        if monthly_budget > 0:
            budget_ratio = latest_bill / monthly_budget
            if budget_ratio <= 0.80:
                budget_score = 15.0
                budget_desc = f"Comfortably under budget ({budget_ratio*100:.0f}% spent, +15 pts)."
            elif budget_ratio <= 1.00:
                budget_score = 12.0
                budget_desc = f"Within monthly budget target ({budget_ratio*100:.0f}% spent, +12 pts)."
            elif budget_ratio <= 1.20:
                budget_score = 6.0
                budget_desc = f"Slightly exceeded budget ({budget_ratio*100:.0f}% spent, +6 pts)."
            else:
                budget_score = 2.0
                budget_desc = f"Significantly exceeded monthly budget (+2 pts)."
        else:
            budget_score = 10.0
            budget_desc = "No budget threshold set; default benchmark applied (+10 pts)."

        # 5. Anomaly Frequency Score (weight 15)
        recent_records_count = min(len(records), 6)
        anomaly_ratio = (anomalies_count / recent_records_count) if recent_records_count > 0 else 0
        if anomaly_ratio == 0:
            anomaly_score = 15.0
            anomaly_desc = "Zero unusual consumption events recorded (+15 pts)."
        elif anomaly_ratio <= 0.2:
            anomaly_score = 10.0
            anomaly_desc = "Low anomaly occurrence (+10 pts)."
        elif anomaly_ratio <= 0.4:
            anomaly_score = 5.0
            anomaly_desc = "Moderate anomaly frequency (+5 pts)."
        else:
            anomaly_score = 1.0
            anomaly_desc = "High anomaly rate detected (+1 pt)."

        # Aggregate total score
        total_score = int(round(trend_score + growth_score + peak_score + budget_score + anomaly_score))
        total_score = max(0, min(100, total_score))

        # Categorization
        if total_score >= 80:
            category = "Excellent"
            summary = "Outstanding energy efficiency! Your load distribution and budget discipline are optimal."
        elif total_score >= 60:
            category = "Good"
            summary = "Solid efficiency profile. Further peak load reduction will elevate performance."
        elif total_score >= 40:
            category = "Moderate"
            summary = "Moderate efficiency. Shifting usage away from peak hours and curbing rising demand will help."
        else:
            category = "Needs Improvement"
            summary = "Efficiency score needs improvement. Recent surges and high peak hours load require optimization."

        factors = [
            ScoreFactorDetail(name="Consumption Trend", weight=25, score=trend_score, description=trend_desc),
            ScoreFactorDetail(name="Demand Growth", weight=20, score=growth_score, description=growth_desc),
            ScoreFactorDetail(name="Peak Load Ratio", weight=25, score=peak_score, description=peak_desc),
            ScoreFactorDetail(name="Budget Performance", weight=15, score=budget_score, description=budget_desc),
            ScoreFactorDetail(name="Anomaly Frequency", weight=15, score=anomaly_score, description=anomaly_desc),
        ]

        return EfficiencyScoreResponse(
            overall_score=total_score,
            category=category,
            factors=factors,
            summary=summary
        )

efficiency_calculator = EfficiencyScoreCalculator()
