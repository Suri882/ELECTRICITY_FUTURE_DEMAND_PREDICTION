from typing import Dict, List, Any

class EVChargingService:
    """
    EV Charging Fleet and Infrastructure Load Planner.
    Models energy consumption, electrical peak demand impact,
    grid connection sizing, and smart off-peak charging schedules.
    """

    CHARGER_STANDARDS = {
        "residential_ac_slow": {"label": "3.3 kW AC Slow Charger (16A Single Phase)", "power_kw": 3.3},
        "level2_ac_fast": {"label": "7.4 kW Level-2 AC Wallbox (32A Single Phase)", "power_kw": 7.4},
        "commercial_ac_3phase": {"label": "22 kW AC Fast Charger (3-Phase)", "power_kw": 22.0},
        "dc_fast_commercial": {"label": "60 kW Dual-Gun DC Fast Charger (CCS2)", "power_kw": 60.0},
        "ultra_fast_depot": {"label": "120 kW Ultra-Fast Fleet DC Charger", "power_kw": 120.0}
    }

    def calculate_ev_load(
        self,
        chargers_config: List[Dict[str, Any]],
        electricity_tariff_rate: float = 8.50,
        baseline_facility_peak_kw: float = 50.0
    ) -> Dict[str, Any]:
        """
        Calculates EV charging demand, coincident peak, and grid impact.
        """
        total_chargers_count = 0
        total_connected_ev_kw = 0.0
        total_daily_ev_kwh = 0.0
        total_vehicles_served = 0
        itemized_chargers = []
        max_simultaneous_demand_kw = 0.0

        for item in chargers_config:
            label = item.get("charger_label", "EV Charger")
            power_kw = float(item.get("power_kw", 7.4))
            count = int(item.get("chargers_count", 2))
            hours_day = float(item.get("daily_charging_hours", 6.0))
            vehicles_day = int(item.get("vehicles_per_day", 4))
            simultaneous_pct = float(item.get("simultaneous_pct", 75.0)) / 100.0

            # Daily energy in kWh
            daily_kwh = round(count * power_kw * hours_day * simultaneous_pct, 2)
            monthly_kwh = round(daily_kwh * 30.0, 2)
            monthly_cost = round(monthly_kwh * electricity_tariff_rate, 2)

            coincident_kw = round(count * power_kw * simultaneous_pct, 2)

            total_chargers_count += count
            total_connected_ev_kw += (count * power_kw)
            total_daily_ev_kwh += daily_kwh
            total_vehicles_served += vehicles_day
            max_simultaneous_demand_kw += coincident_kw

            itemized_chargers.append({
                "label": label,
                "chargers_count": count,
                "power_kw_each": power_kw,
                "daily_charging_hours": hours_day,
                "vehicles_served_daily": vehicles_day,
                "simultaneous_factor_pct": round(simultaneous_pct * 100, 1),
                "coincident_peak_kw": coincident_kw,
                "daily_kwh": daily_kwh,
                "monthly_kwh": monthly_kwh,
                "monthly_cost_inr": monthly_cost
            })

        total_monthly_ev_kwh = round(total_daily_ev_kwh * 30.0, 2)
        total_monthly_ev_cost = round(total_monthly_ev_kwh * electricity_tariff_rate, 2)
        combined_peak_kw = round(baseline_facility_peak_kw + max_simultaneous_demand_kw, 2)
        peak_increase_pct = round((max_simultaneous_demand_kw / max(1.0, baseline_facility_peak_kw)) * 100, 1)

        # Smart Load Management Recommendations
        load_management_strategies = [
            {
                "strategy": "Time-of-Day (ToD) Nocturnal Scheduling",
                "impact": "Shift 60% of fleet and overnight charging to off-peak hours (10:00 PM - 06:00 AM).",
                "benefit_inr": round(total_monthly_ev_cost * 0.15, 2),
                "peak_shaving_kw": round(max_simultaneous_demand_kw * 0.50, 2)
            },
            {
                "strategy": "Dynamic Load Curtailment (Peak Clipping)",
                "impact": "Throttle EV charger output automatically when primary facility HVAC or machinery hits peak.",
                "benefit_inr": round(max_simultaneous_demand_kw * 150.0, 2),  # Demand charge reduction
                "peak_shaving_kw": round(max_simultaneous_demand_kw * 0.35, 2)
            }
        ]

        return {
            "summary": {
                "total_chargers_count": total_chargers_count,
                "total_vehicles_daily": total_vehicles_served,
                "total_connected_ev_capacity_kw": round(total_connected_ev_kw, 2),
                "ev_coincident_peak_demand_kw": round(max_simultaneous_demand_kw, 2),
                "daily_charging_kwh": round(total_daily_ev_kwh, 2),
                "monthly_charging_kwh": total_monthly_ev_kwh,
                "monthly_charging_cost_inr": total_monthly_ev_cost,
                "baseline_facility_peak_kw": baseline_facility_peak_kw,
                "combined_facility_peak_kw": combined_peak_kw,
                "peak_demand_increase_pct": peak_increase_pct
            },
            "itemized_chargers": itemized_chargers,
            "load_management_strategies": load_management_strategies
        }

ev_charging_service = EVChargingService()
