from typing import Dict, List, Any

class ScenarioComparisonService:
    """
    Multi-Scenario Comparative Financial & Energy Intelligence Engine.
    Enables side-by-side comparison across up to 3 scenarios (e.g., Baseline,
    High-Efficiency, Solar+Battery Microgrid) covering purchase costs,
    construction power, operating bills, peak kW, and 5-Year Total Cost of Ownership (TCO).
    """

    def compare_scenarios(
        self,
        scenarios_data: List[Dict[str, Any]],
        construction_cost: float = 0.0,
        emission_factor: float = 0.716
    ) -> Dict[str, Any]:
        """
        Processes up to 3 scenario models and builds comparison tables and chart vectors.
        """
        comparisons = []
        baseline_scenario = None

        for idx, sc in enumerate(scenarios_data[:3]):
            name = sc.get("name", f"Scenario {idx + 1}")
            eq_summary = sc.get("equipment_summary", {})
            solar_summary = sc.get("solar_summary", {})
            tariff_summary = sc.get("tariff_summary", {})

            # Capex components
            appliance_purchase_cost = float(eq_summary.get("total_purchase_budget_inr", 0.0))
            solar_bess_investment = float(solar_summary.get("initial_capex_inr", 0.0))
            total_initial_capex = round(appliance_purchase_cost + solar_bess_investment, 2)

            # Energy metrics
            monthly_operational_kwh = float(eq_summary.get("total_monthly_kwh", 0.0))
            solar_monthly_gen_kwh = float(solar_summary.get("expected_daily_generation_kwh", 0.0)) * 30.0
            net_grid_monthly_kwh = max(0.0, monthly_operational_kwh - solar_monthly_gen_kwh)
            annual_operational_kwh = round(net_grid_monthly_kwh * 12.0, 2)

            peak_demand_kw = float(eq_summary.get("total_operational_peak_kw", 0.0))

            # Operational bills
            monthly_bill = float(tariff_summary.get("total_estimated_monthly_bill", 0.0))
            if solar_monthly_gen_kwh > 0:
                # Solar net offset
                offset_ratio = max(0.0, 1.0 - (solar_monthly_gen_kwh / max(1.0, monthly_operational_kwh)))
                monthly_bill = round(monthly_bill * offset_ratio, 2)
            annual_bill = round(monthly_bill * 12.0, 2)

            # 5-Year Operating Bill Total
            five_year_bills = round(annual_bill * 5.0, 2)

            # 5-Year Total Cost of Ownership (TCO)
            # TCO = Equipment Capex + Solar Capex + Construction Electricity + 5-Year Operating Bills
            five_year_tco = round(total_initial_capex + construction_cost + five_year_bills, 2)

            # Carbon footprint (tonnes CO2e/year)
            annual_co2_tonnes = round((annual_operational_kwh * emission_factor) / 1000.0, 2)

            entry = {
                "scenario_id": sc.get("id", idx + 1),
                "name": name,
                "is_active": sc.get("is_active", True),
                "appliance_purchase_cost_inr": appliance_purchase_cost,
                "construction_electricity_cost_inr": round(construction_cost, 2),
                "solar_bess_investment_inr": solar_bess_investment,
                "total_initial_investment_inr": total_initial_capex,
                "operational_monthly_kwh": round(monthly_operational_kwh, 2),
                "net_grid_monthly_kwh": round(net_grid_monthly_kwh, 2),
                "annual_kwh": annual_operational_kwh,
                "monthly_electricity_bill_inr": monthly_bill,
                "annual_electricity_bill_inr": annual_bill,
                "five_year_operating_bills_inr": five_year_bills,
                "peak_demand_kw": round(peak_demand_kw, 2),
                "five_year_tco_inr": five_year_tco,
                "annual_carbon_emissions_tonnes": annual_co2_tonnes,
                "kwh_saved_vs_baseline": 0.0,
                "money_saved_5yr_vs_baseline": 0.0
            }

            if idx == 0:
                baseline_scenario = entry

            comparisons.append(entry)

        # Compute savings relative to baseline scenario
        if baseline_scenario:
            base_kwh = baseline_scenario["operational_monthly_kwh"]
            base_tco = baseline_scenario["five_year_tco_inr"]
            for item in comparisons:
                item["kwh_saved_monthly_vs_baseline"] = round(base_kwh - item["net_grid_monthly_kwh"], 2)
                item["money_saved_5yr_vs_baseline"] = round(base_tco - item["five_year_tco_inr"], 2)

        # Structure data for frontend charts
        chart_data = []
        for c in comparisons:
            chart_data.append({
                "name": c["name"],
                "purchase_cost": c["appliance_purchase_cost_inr"],
                "solar_investment": c["solar_bess_investment_inr"],
                "annual_bill": c["annual_electricity_bill_inr"],
                "five_year_tco": c["five_year_tco_inr"],
                "monthly_kwh": c["net_grid_monthly_kwh"],
                "peak_kw": c["peak_demand_kw"]
            })

        return {
            "comparisons": comparisons,
            "chart_data": chart_data,
            "construction_cost_included": round(construction_cost, 2),
            "emission_factor_used": emission_factor
        }

scenario_comparison = ScenarioComparisonService()
