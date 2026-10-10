from typing import Dict, List, Any

class EquipmentIntelligenceService:
    """
    Intelligence service for operational electrical appliances, motors, HVAC,
    and industrial equipment. Computes daily, monthly, annual kWh, purchase budget,
    1-year, 3-year, 5-year Total Cost of Ownership (TCO), consumption rankings,
    and efficiency comparison against high-efficiency alternatives.
    """

    def analyze_equipment(
        self,
        equipment_list: List[Dict[str, Any]],
        tariff_rate: float = 7.50
    ) -> Dict[str, Any]:
        analyzed_items = []
        total_daily_kwh = 0.0
        total_monthly_kwh = 0.0
        total_annual_kwh = 0.0
        total_monthly_cost = 0.0
        total_purchase_budget = 0.0
        total_connected_load_w = 0.0
        total_operational_peak_w = 0.0

        for eq in equipment_list:
            name = eq.get("name", "Equipment")
            category = eq.get("category", "General")
            brand = eq.get("brand_model", "")
            qty = int(eq.get("quantity", 1))
            rated_w = float(eq.get("rated_power_w", 1000.0))
            load_pct = float(eq.get("operating_load_pct", 70.0)) / 100.0
            daily_hrs = float(eq.get("daily_hours", 8.0))
            monthly_days = int(eq.get("monthly_days", 30))
            eff_pct = float(eq.get("efficiency_pct", 90.0)) / 100.0
            unit_cost = float(eq.get("unit_purchase_cost", 0.0))
            is_efficient = bool(eq.get("is_energy_efficient", False))

            alt_name = eq.get("efficient_alternative_name")
            alt_watts = float(eq.get("efficient_alternative_watts", 0.0)) if eq.get("efficient_alternative_watts") else None
            alt_cost = float(eq.get("efficient_alternative_cost", 0.0)) if eq.get("efficient_alternative_cost") else None

            # Input draw taking efficiency and load factor into account
            input_power_w = (rated_w * load_pct) / max(0.2, eff_pct)
            total_device_w = input_power_w * qty

            total_connected_load_w += rated_w * qty
            total_operational_peak_w += total_device_w

            # Daily energy in kWh = (total_device_w * daily_hrs) / 1000.0
            daily_kwh = round((total_device_w * daily_hrs) / 1000.0, 2)
            monthly_kwh = round(daily_kwh * monthly_days, 2)
            annual_kwh = round(monthly_kwh * 12.0, 2)
            item_purchase_total = round(unit_cost * qty, 2)
            monthly_cost = round(monthly_kwh * tariff_rate, 2)
            annual_cost = round(annual_kwh * tariff_rate, 2)

            total_daily_kwh += daily_kwh
            total_monthly_kwh += monthly_kwh
            total_annual_kwh += annual_kwh
            total_monthly_cost += monthly_cost
            total_purchase_budget += item_purchase_total

            # Efficient alternative comparison
            comparison = None
            if alt_watts and alt_watts < rated_w:
                alt_input_w = (alt_watts * load_pct) / max(0.2, eff_pct)
                alt_total_w = alt_input_w * qty
                alt_daily_kwh = round((alt_total_w * daily_hrs) / 1000.0, 2)
                alt_monthly_kwh = round(alt_daily_kwh * monthly_days, 2)
                alt_annual_kwh = round(alt_monthly_kwh * 12.0, 2)
                alt_annual_cost = round(alt_annual_kwh * tariff_rate, 2)

                kwh_saved_annual = round(annual_kwh - alt_annual_kwh, 2)
                money_saved_annual = round(annual_cost - alt_annual_cost, 2)
                incremental_cost = max(0.0, (alt_cost or unit_cost) * qty - item_purchase_total)
                payback_years = round(incremental_cost / max(1.0, money_saved_annual), 1) if money_saved_annual > 0 else 0.0

                comparison = {
                    "alternative_name": alt_name or "High Efficiency Alternative",
                    "alternative_rated_watts": alt_watts,
                    "alternative_annual_kwh": alt_annual_kwh,
                    "kwh_saved_annual": kwh_saved_annual,
                    "money_saved_annual_inr": money_saved_annual,
                    "incremental_investment_inr": incremental_cost,
                    "payback_period_years": payback_years
                }

            analyzed_items.append({
                "name": name,
                "category": category,
                "brand_model": brand,
                "quantity": qty,
                "rated_power_w": rated_w,
                "operating_load_pct": round(load_pct * 100, 1),
                "daily_hours": daily_hrs,
                "monthly_days": monthly_days,
                "efficiency_pct": round(eff_pct * 100, 1),
                "unit_purchase_cost": unit_cost,
                "total_purchase_cost": item_purchase_total,
                "daily_kwh": daily_kwh,
                "monthly_kwh": monthly_kwh,
                "annual_kwh": annual_kwh,
                "monthly_cost": monthly_cost,
                "annual_cost": annual_cost,
                "cost_1_year": annual_cost,
                "cost_3_years": round(annual_cost * 3.0, 2),
                "cost_5_years": round(annual_cost * 5.0, 2),
                "is_energy_efficient": is_efficient,
                "comparison": comparison
            })

        # Calculate consumption shares and rank items
        for item in analyzed_items:
            share = round((item["monthly_kwh"] / max(0.1, total_monthly_kwh)) * 100, 1)
            item["consumption_share_pct"] = share

        # Sort descending by monthly consumption
        analyzed_items.sort(key=lambda x: x["monthly_kwh"], reverse=True)

        highest_consumer = analyzed_items[0] if analyzed_items else None

        # Category Breakdown
        category_breakdown = {}
        for item in analyzed_items:
            cat = item["category"]
            if cat not in category_breakdown:
                category_breakdown[cat] = {
                    "category": cat,
                    "monthly_kwh": 0.0,
                    "monthly_cost": 0.0,
                    "share_pct": 0.0
                }
            category_breakdown[cat]["monthly_kwh"] += item["monthly_kwh"]
            category_breakdown[cat]["monthly_cost"] += item["monthly_cost"]

        for cat, data in category_breakdown.items():
            data["monthly_kwh"] = round(data["monthly_kwh"], 2)
            data["monthly_cost"] = round(data["monthly_cost"], 2)
            data["share_pct"] = round((data["monthly_kwh"] / max(0.1, total_monthly_kwh)) * 100, 1)

        return {
            "summary": {
                "total_items_count": len(analyzed_items),
                "total_connected_load_kw": round(total_connected_load_w / 1000.0, 2),
                "total_operational_peak_kw": round(total_operational_peak_w / 1000.0, 2),
                "total_daily_kwh": round(total_daily_kwh, 2),
                "total_monthly_kwh": round(total_monthly_kwh, 2),
                "total_annual_kwh": round(total_annual_kwh, 2),
                "total_monthly_cost_inr": round(total_monthly_cost, 2),
                "total_annual_cost_inr": round(total_monthly_cost * 12.0, 2),
                "total_purchase_budget_inr": round(total_purchase_budget, 2),
                "operating_cost_1_year": round(total_monthly_cost * 12.0, 2),
                "operating_cost_3_years": round(total_monthly_cost * 36.0, 2),
                "operating_cost_5_years": round(total_monthly_cost * 60.0, 2),
                "tco_5_years": round(total_purchase_budget + (total_monthly_cost * 60.0), 2),
                "highest_energy_consumer": highest_consumer["name"] if highest_consumer else "None"
            },
            "equipment_ranking": analyzed_items,
            "category_distribution": list(category_breakdown.values()),
            "calculation_notes": (
                "Calculated estimates factoring operating load factor and rated motor/device efficiency. "
                "Nominal rated wattages are not guaranteed constants and vary dynamically with ambient temperature and load."
            )
        }

equipment_intelligence = EquipmentIntelligenceService()
