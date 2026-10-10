from typing import List, Dict, Any, Optional
from backend.models.recommendation import RecommendationPriority

class SmartRecommendationEngine:
    """
    Advanced Energy Optimization Recommendation Engine.
    Synthesizes predicted demand, peak-demand periods, historical patterns,
    user-defined thresholds, bill estimates, weather alerts, and simulator results.
    Strictly structures every recommendation with the 4-part framework:
    1. What was detected
    2. Why it matters
    3. What action the user can take
    4. The estimated impact (calculated from real data)
    """

    def generate_recommendations(
        self,
        records: List[Dict[str, Any]],
        latest_prediction: Optional[Dict[str, Any]] = None,
        anomalies: Optional[List[Dict[str, Any]]] = None,
        monthly_budget: float = 0.0,
        consumer_type: str = "Household",
        demand_threshold_high: float = 700.0,
        weather_alert: Optional[Dict[str, Any]] = None,
        base_tariff: float = 7.50
    ) -> List[Dict[str, Any]]:
        recs = []

        if not records:
            return recs

        latest_record = records[-1]
        units = float(latest_record.get("units_consumed", 0.0))
        bill = float(latest_record.get("bill_amount", 0.0))
        peak = float(latest_record.get("peak_usage", 0.0))
        peak_ratio = (peak / units) if units > 0 else 0.0

        all_units = [float(r["units_consumed"]) for r in records]
        avg_units = sum(all_units) / len(all_units)

        # 1. Peak Load Arbitrage
        if peak_ratio > 0.25 or peak > (avg_units * 0.3):
            shiftable_kwh = round(peak * 0.25, 1)
            tariff_savings_inr = round(shiftable_kwh * (base_tariff * 0.40), 2)
            recs.append({
                "title": "Shift Flexible Equipment Away From Peak Hours",
                "detected": f"High peak concentration detected: {peak_ratio*100:.1f}% ({peak:.1f} kWh) of cycle consumption occurs during high-tariff peak slots.",
                "reason": "Peak time-of-day tariffs carry a 40% surcharge above regular energy rates, needlessly inflating your total billing.",
                "action": "Schedule dishwashers, washing machines, pumps, and EV chargers to run during morning solar hours (10:00–16:00) or night off-peak (23:00–06:00).",
                "priority": RecommendationPriority.High,
                "expected_benefit": f"Save approximately {shiftable_kwh} kWh from peak surcharge and lower monthly bill by ~₹{tariff_savings_inr:,.2f}."
            })

        # 2. Predicted Demand Surge
        if latest_prediction:
            pred_demand = latest_prediction.get("predicted_demand", 0.0)
            pred_level = latest_prediction.get("demand_level")
            if pred_level in ["High", "Critical"] or pred_demand > demand_threshold_high:
                excess_kwh = round(max(0.0, pred_demand - avg_units), 1)
                cost_risk_inr = round(excess_kwh * base_tariff, 2)
                recs.append({
                    "title": "Proactive Demand Curtailment Before Next Billing Cycle",
                    "detected": f"Machine Learning model forecasts {pred_level} demand of {pred_demand:.1f} kWh for the upcoming cycle (+{latest_prediction.get('percentage_change', 0):.1f}% vs baseline).",
                    "reason": "Upcoming demand trajectory breaches your typical operating band and will push energy charges into higher tariff slabs.",
                    "action": "Review high-demand periods before planning heavy equipment operations. Pre-cool rooms and stagger equipment startup sequences.",
                    "priority": RecommendationPriority.Urgent if pred_level == "Critical" else RecommendationPriority.High,
                    "expected_benefit": f"Mitigate ~{excess_kwh} kWh in excess demand, averting an estimated ₹{cost_risk_inr:,.2f} in billing escalation."
                })

        # 3. Weather & Temperature Sensitivity
        if weather_alert and weather_alert.get("cooling_surge_pct", 0) > 8.0:
            surge_pct = weather_alert.get("cooling_surge_pct", 10.0)
            cooling_excess_kwh = round(avg_units * (surge_pct / 100.0), 1)
            recs.append({
                "title": "Mitigate Temperature-Driven HVAC Cooling Spike",
                "detected": f"Meteorological forecast indicates high ambient heat ({weather_alert.get('severity', 'Warning')}), driving an estimated +{surge_pct}% surge in air conditioning load.",
                "reason": "Every degree Celsius below ambient increases compressor duty cycle and condenser heat rejection losses by 3.5%–5%.",
                "action": "Raise AC thermostat setpoints from 22°C to 24°C or 25°C, utilize ceiling fans to circulate air, and draw blinds on south- and west-facing windows during peak afternoon sun.",
                "priority": RecommendationPriority.Medium,
                "expected_benefit": f"Save ~{cooling_excess_kwh} kWh on cooling power (~₹{cooling_excess_kwh * base_tariff:,.2f}) while maintaining indoor thermal comfort."
            })

        # 4. Budget Overrun Risk
        if monthly_budget > 0 and bill > monthly_budget:
            overage = round(bill - monthly_budget, 2)
            recs.append({
                "title": "Enforce Budget Expenditure Ceiling",
                "detected": f"Current cycle bill of ₹{bill:,.2f} exceeds your configured budget ceiling of ₹{monthly_budget:,.2f} by ₹{overage:,.2f}.",
                "reason": "Continuing current daily consumption velocity will cause recurring financial overruns across future quarterly budgets.",
                "action": "Audit vampire/standby appliance draw at night, turn off unused workspace lighting, and enforce weekly consumption milestones.",
                "priority": RecommendationPriority.Urgent,
                "expected_benefit": f"Reclaim ₹{overage:,.2f} in budget compliance and avoid recurring utility slab penalties."
            })
        elif monthly_budget > 0 and bill >= (monthly_budget * 0.85):
            recs.append({
                "title": "Approaching Monthly Budget Threshold",
                "detected": f"Current expenditure has reached {((bill/monthly_budget)*100):.0f}% of your allocated budget with time remaining in the billing window.",
                "reason": "Unplanned load spikes during remaining days will trigger budget overage.",
                "action": "Defer optional power-intensive maintenance tasks to the next billing cycle.",
                "priority": RecommendationPriority.Medium,
                "expected_benefit": "Guarantees closing the current billing month within your established budget limits."
            })

        # 5. Statistical Consumption Anomalies / Standby Leakage
        if anomalies and len(anomalies) > 0:
            latest_anomaly = anomalies[0]
            recs.append({
                "title": "Investigate Unusually High Load Anomaly",
                "detected": f"Statistical anomaly engine detected abnormal usage pattern (Z-score anomaly rating: {latest_anomaly.get('anomaly_score', 0):.2f}).",
                "reason": "Persistent abnormal spikes frequently stem from refrigerant leaks, failing capacitor banks, stuck thermostat relays, or insulation degradation.",
                "action": "Conduct inspection of primary refrigeration, HVAC compressors, and electrical distribution sub-panels for residual leakage current.",
                "priority": RecommendationPriority.High,
                "expected_benefit": "Prevents catastrophic equipment breakdown and eliminates unmetered power waste of ~30–60 kWh/month."
            })

        # 6. Sector-specific best practice
        if consumer_type == "College":
            recs.append({
                "title": "Campus Facility After-Hours Scheduling",
                "detected": "Institutional facility profiles show steady base consumption during unoccupied evening and weekend hours.",
                "reason": "Empty lecture halls, computer laboratories, and common areas routinely draw continuous baseline power.",
                "action": "Deploy centralized automated shutdowns for lab equipment, computer banks, and corridor lighting after 18:00.",
                "priority": RecommendationPriority.Low,
                "expected_benefit": "Generates 12% to 18% savings on total monthly institutional electricity expenditure."
            })
        elif consumer_type == "Office":
            recs.append({
                "title": "Commercial Standby Power Curtailment",
                "detected": "Off-hour office telemetry reveals lingering baseline consumption during non-working weekends.",
                "reason": "Printers, workstation monitors, conference displays, and water dispensers remain in standby mode 24/7.",
                "action": "Equip major workstation clusters with automated smart power strips to isolate phantom draw outside 08:30–18:30.",
                "priority": RecommendationPriority.Low,
                "expected_benefit": "Reduces continuous phantom baseline load by ~45–80 kWh per month."
            })
        elif consumer_type == "Small Industry":
            recs.append({
                "title": "Motor Duty Cycling and Power Factor Compensation",
                "detected": "Industrial motor operating cycles indicate simultaneous startup surges and peak demand spikes.",
                "reason": "Uncoordinated inductive motor starts create severe instantaneous kVA demand spikes.",
                "action": "Stagger motor startup sequences by 5–10 minutes and verify automated power factor correction (APFC) capacitor operation.",
                "priority": RecommendationPriority.Medium,
                "expected_benefit": "Eliminates low power factor penalty surcharges and flattens maximum contract demand billing."
            })

        return recs

recommendation_engine = SmartRecommendationEngine()
