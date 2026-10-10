from typing import Dict, Any, List, Optional
from datetime import datetime, time

class PeakDemandMonitoringService:
    """
    Intelligent Peak-Demand Detection & Load Shifting Advisory Service.
    Analyzes historical patterns and 24-hour / 7-day predicted curves to
    detect surge windows, compare against configurable consumer thresholds,
    and generate practical load-shifting mitigation actions.
    """

    DEFAULT_LOW_THRESHOLD = 250.0      # kWh / month (or equivalent daily ~8.3 kWh)
    DEFAULT_MEDIUM_THRESHOLD = 450.0   # kWh / month (daily ~15.0 kWh)
    DEFAULT_HIGH_THRESHOLD = 700.0     # kWh / month (daily ~23.3 kWh)

    def analyze_peak_profile(
        self,
        predicted_24h_points: List[Dict[str, Any]],
        threshold_low: float = DEFAULT_LOW_THRESHOLD,
        threshold_medium: float = DEFAULT_MEDIUM_THRESHOLD,
        threshold_high: float = DEFAULT_HIGH_THRESHOLD,
        historical_peak_avg: float = 120.0
    ) -> Dict[str, Any]:
        """
        Processes 24-hour forecasted hourly demand and flags peak windows.
        """
        if not predicted_24h_points:
            return self._empty_peak_response()

        # Sort points by predicted load
        sorted_points = sorted(predicted_24h_points, key=lambda x: x.get("predicted_kwh", 0), reverse=True)
        max_point = sorted_points[0]
        peak_kwh = max_point.get("predicted_kwh", 0.0)
        peak_hour = max_point.get("hour", 19)

        # Total 24h projected
        total_24h = sum(p.get("predicted_kwh", 0) for p in predicted_24h_points)
        peak_hours_list = [p for p in predicted_24h_points if p.get("is_peak", False)]
        peak_total_kwh = sum(p.get("predicted_kwh", 0) for p in peak_hours_list)
        peak_ratio = round((peak_total_kwh / (total_24h + 1e-5)) * 100, 1)

        # Scale monthly thresholds to daily scale for 24h evaluation
        daily_low = threshold_low / 30.0
        daily_med = threshold_medium / 30.0
        daily_high = threshold_high / 30.0

        # Determine demand level
        if total_24h < daily_low:
            demand_category = "LOW"
            color_badge = "emerald"
            advance_alert = "Normal Grid Demand: Consumption is well within low efficiency thresholds."
            severity = "Optimal"
        elif total_24h < daily_med:
            demand_category = "MEDIUM"
            color_badge = "cyan"
            advance_alert = "Moderate Demand: Steady usage profile. No immediate throttling needed."
            severity = "Info"
        elif total_24h < daily_high:
            demand_category = "HIGH"
            color_badge = "amber"
            advance_alert = "High Peak Surge Warning: Consumption approaches peak threshold limit."
            severity = "Warning"
        else:
            demand_category = "CRITICAL"
            color_badge = "rose"
            advance_alert = "Severe Peak Alert: Projected load exceeds high tier threshold. Peak tariff surcharges will apply."
            severity = "Critical"

        # Identify window of consecutive high hours
        high_hours = [p["label"] for p in predicted_24h_points if p.get("is_peak", False) or p.get("predicted_kwh", 0) > (total_24h / 24.0 * 1.2)]
        peak_window_str = f"{high_hours[0]} – {high_hours[-1]}" if high_hours else "18:00 – 22:00"

        # Actionable load-shifting recommendations
        load_shifting_tips = [
            {
                "id": "tip-1",
                "appliance": "Washing Machine & Dryer",
                "action": "Shift laundry cycles from 19:00 peak to 10:00–15:00 off-peak solar hours.",
                "potential_saving": "Saves ~1.8 kWh per cycle and reduces peak tariff bill penalty by ~25%."
            },
            {
                "id": "tip-2",
                "appliance": "Electric Water Heater / Geyser",
                "action": "Pre-heat water 30 minutes before 18:00 evening peak, then turn off.",
                "potential_saving": "Cuts 2.5–3.0 kW instant demand surge during maximum tariff window."
            },
            {
                "id": "tip-3",
                "appliance": "Air Conditioning / HVAC",
                "action": "Pre-cool room to 23°C at 17:00, then adjust setpoint to 25°C during 18:00–21:00.",
                "potential_saving": "Reduces compressor run-time by ~35% during critical peak hours."
            },
            {
                "id": "tip-4",
                "appliance": "EV Charging & Water Pumps",
                "action": "Schedule automatic timer for 23:30 to 05:30 night valley hours.",
                "potential_saving": "Zero peak surcharge, maximizing lowest base grid tariff tier."
            }
        ]

        return {
            "forecast_nature": "STATISTICAL FORECAST (Not a live instant meter measurement)",
            "demand_category": demand_category,
            "color_badge": color_badge,
            "severity": severity,
            "advance_alert": advance_alert,
            "total_24h_predicted_kwh": round(total_24h, 2),
            "peak_window": peak_window_str,
            "expected_peak_hour": f"{peak_hour:02d}:00",
            "peak_hour_predicted_kwh": round(peak_kwh, 2),
            "peak_total_kwh": round(peak_total_kwh, 2),
            "peak_ratio_pct": peak_ratio,
            "thresholds_applied": {
                "low": threshold_low,
                "medium": threshold_medium,
                "high": threshold_high,
                "basis": "Monthly kWh basis (Scaled /30 for daily window)"
            },
            "load_shifting_advisories": load_shifting_tips
        }

    def _empty_peak_response(self) -> Dict[str, Any]:
        return {
            "forecast_nature": "NO DATA AVAILABLE",
            "demand_category": "UNKNOWN",
            "color_badge": "slate",
            "severity": "Info",
            "advance_alert": "Add consumption records to compute peak load predictions.",
            "total_24h_predicted_kwh": 0.0,
            "peak_window": "N/A",
            "expected_peak_hour": "N/A",
            "peak_hour_predicted_kwh": 0.0,
            "peak_total_kwh": 0.0,
            "peak_ratio_pct": 0.0,
            "thresholds_applied": {
                "low": self.DEFAULT_LOW_THRESHOLD,
                "medium": self.DEFAULT_MEDIUM_THRESHOLD,
                "high": self.DEFAULT_HIGH_THRESHOLD,
                "basis": "Default thresholds"
            },
            "load_shifting_advisories": []
        }

peak_demand_service = PeakDemandMonitoringService()
