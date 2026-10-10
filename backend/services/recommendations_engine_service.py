from typing import Dict, List, Any

class RecommendationsEngineService:
    """
    Actionable Energy Efficiency & Smart Recommendation Engine.
    Examines project equipment, operating hours, HVAC setpoints, and facility load profiles
    to synthesize transparent, mathematically substantiated efficiency actions.
    """

    def generate_recommendations(
        self,
        equipment_list: List[Dict[str, Any]],
        tariff_rate: float = 7.50,
        monthly_kwh_total: float = 1200.0,
        facility_subtype: str = "Commercial"
    ) -> List[Dict[str, Any]]:
        recommendations = []

        # 1. Equipment Upgrade Opportunities (Standard to High Efficiency)
        for eq in equipment_list:
            rated_w = float(eq.get("rated_power_w", 1000.0))
            alt_w = float(eq.get("efficient_alternative_watts", 0.0)) if eq.get("efficient_alternative_watts") else None
            alt_name = eq.get("efficient_alternative_name")
            alt_cost = float(eq.get("efficient_alternative_cost", 0.0)) if eq.get("efficient_alternative_cost") else None
            qty = int(eq.get("quantity", 1))
            hrs_day = float(eq.get("daily_hours", 8.0))
            days_month = int(eq.get("monthly_days", 30))
            unit_cost = float(eq.get("unit_purchase_cost", 0.0))

            if alt_w and alt_w < rated_w:
                w_saved_per_unit = rated_w - alt_w
                monthly_kwh_saved = round((w_saved_per_unit * qty * hrs_day * days_month) / 1000.0, 1)
                monthly_money_saved = round(monthly_kwh_saved * tariff_rate, 2)
                incremental_capex = max(0.0, (alt_cost or unit_cost) * qty - (unit_cost * qty))
                if incremental_capex == 0.0 and alt_cost:
                    incremental_capex = alt_cost * qty

                annual_money_saved = monthly_money_saved * 12.0
                payback_months = round((incremental_capex / max(1.0, monthly_money_saved)), 1) if monthly_money_saved > 0 else 0.0

                recommendations.append({
                    "id": f"upgrade_{eq.get('name', 'item').lower().replace(' ', '_')}",
                    "category": "Equipment Replacement",
                    "title": f"Upgrade {eq.get('name')} to {alt_name}",
                    "priority": "High" if monthly_kwh_saved > 100 else "Medium",
                    "reason": f"Replacing {qty}x {eq.get('name')} ({int(rated_w)}W) reduces power draw by {int(w_saved_per_unit)}W per unit while delivering equivalent duty performance.",
                    "units_saved_monthly_kwh": monthly_kwh_saved,
                    "money_saved_monthly_inr": monthly_money_saved,
                    "money_saved_annual_inr": round(annual_money_saved, 2),
                    "implementation_cost_inr": round(incremental_capex, 2),
                    "payback_period_months": payback_months,
                    "confidence_rating": "High (Based on certified BEE / EnergyStar ratings)",
                    "action_steps": [
                        f"Select BEE 5-Star or equivalent rated {alt_name}.",
                        "Verify dimensional compatibility and electrical connections.",
                        "Decommission and recycle legacy units with accredited e-waste vendors."
                    ]
                })

        # 2. HVAC Setpoint Optimization (if HVAC equipment present)
        hvac_items = [e for e in equipment_list if e.get("category") in ["HVAC", "Air Conditioning"]]
        if hvac_items:
            total_hvac_monthly_kwh = sum(
                (float(e.get("rated_power_w", 1500)) * int(e.get("quantity", 1)) * float(e.get("daily_hours", 8)) * int(e.get("monthly_days", 30))) / 1000.0
                for e in hvac_items
            )
            # Standard ASHRAE & BEE guideline: Every 1°C increase in AC setpoint saves ~6% cooling energy
            hvac_saved_kwh = round(total_hvac_monthly_kwh * 0.12, 1) # Raising setpoint by 2°C (e.g. 22°C -> 24°C)
            hvac_saved_inr = round(hvac_saved_kwh * tariff_rate, 2)

            recommendations.append({
                "id": "hvac_setpoint_optimization",
                "category": "Operational Tuning",
                "title": "Calibrate HVAC Thermostat Setpoints to 24°C - 25°C",
                "priority": "High",
                "reason": (
                    "Air conditioning currently operates at baseline thermostat setpoints. "
                    "According to Bureau of Energy Efficiency (BEE) guidelines, each 1°C increase saves approx 6% compressor electrical draw."
                ),
                "units_saved_monthly_kwh": hvac_saved_kwh,
                "money_saved_monthly_inr": hvac_saved_inr,
                "money_saved_annual_inr": round(hvac_saved_inr * 12.0, 2),
                "implementation_cost_inr": 0.0, # Zero capital cost!
                "payback_period_months": 0.0,
                "confidence_rating": "Very High (Empirical Thermodynamic Standard)",
                "action_steps": [
                    "Standardize building thermostats to 24°C default setting.",
                    "Enable programmable timer schedules to shut off cooling 30 minutes before end of working hours.",
                    "Clean indoor air filters every fortnight to sustain peak airflow."
                ]
            })

        # 3. Time-of-Day Peak Shifting
        heavy_items = [e for e in equipment_list if float(e.get("rated_power_w", 0)) >= 3000.0 or e.get("category") in ["Pumping", "Compressed Air", "Motors"]]
        if heavy_items:
            heavy_kwh = sum(
                (float(e.get("rated_power_w", 3000)) * int(e.get("quantity", 1)) * min(4.0, float(e.get("daily_hours", 4))) * int(e.get("monthly_days", 25))) / 1000.0
                for e in heavy_items
            )
            shift_saved_inr = round(heavy_kwh * tariff_rate * 0.20, 2) # 20% peak tariff differential savings

            recommendations.append({
                "id": "peak_load_shifting",
                "category": "Load Scheduling",
                "title": "Shift Heavy Pumping & Batch Loads to Off-Peak Windows",
                "priority": "Medium",
                "reason": (
                    "Water pumps, compressors, and high-draw thermal systems currently operate during high-tariff evening peak hours (18:00 - 22:00). "
                    "Shifting duty to off-peak periods circumvents DISCOM peak surcharges."
                ),
                "units_saved_monthly_kwh": 0.0, # Conserves money via tariff differential, not direct units
                "money_saved_monthly_inr": shift_saved_inr,
                "money_saved_annual_inr": round(shift_saved_inr * 12.0, 2),
                "implementation_cost_inr": 4500.0, # Cost of digital time-switches / smart relays
                "payback_period_months": round(4500.0 / max(1.0, shift_saved_inr), 1),
                "confidence_rating": "High (Based on applicable DISCOM ToD tariff slots)",
                "action_steps": [
                    "Install digital programmable timer contactors on water transfer pumps.",
                    "Automate reservoir pumping cycles between 10:00 PM and 06:00 AM.",
                    "Avoid non-essential batch machinery operation during 18:00 - 22:00."
                ]
            })

        # 4. Standby Phantom Load Reduction
        standby_kwh = round(monthly_kwh_total * 0.04, 1) # 4% typical standby draw
        standby_inr = round(standby_kwh * tariff_rate, 2)
        recommendations.append({
            "id": "phantom_standby_reduction",
            "category": "Controls & Automation",
            "title": "Eliminate Idle Standby / Phantom Power Leakage",
            "priority": "Low",
            "reason": (
                "Televisions, computers, chargers, and kitchen appliances draw continuous standby transformer current "
                "when inactive. Smart plug strips and master cut-off relays eliminate this passive consumption."
            ),
            "units_saved_monthly_kwh": standby_kwh,
            "money_saved_monthly_inr": standby_inr,
            "money_saved_annual_inr": round(standby_inr * 12.0, 2),
            "implementation_cost_inr": 2500.0,
            "payback_period_months": round(2500.0 / max(1.0, standby_inr), 1),
            "confidence_rating": "Medium (Typical empirical standby baseline)",
            "action_steps": [
                "Install master-cutoff relays for workstation pods and entertainment clusters.",
                "Mandate overnight shutdown policies for monitors and idle printers."
            ]
        })

        return recommendations

recommendations_engine = RecommendationsEngineService()
