from typing import Dict, List, Any

class ConstructionCalcService:
    """
    Dedicated temporary electricity calculator for building and infrastructure construction.
    Calculates phase-wise consumption, total energy budget, maximum simultaneous demand,
    and suggested temporary electrical connection capacity (kVA) with engineering disclaimers.
    """

    def calculate_construction_energy(
        self,
        equipment_list: List[Dict[str, Any]],
        temporary_tariff_rate: float = 11.50, # Typical temporary commercial construction rate (₹/kWh)
        fixed_charge_per_month: float = 350.0,
        diversity_factor: float = 0.65,        # Coincident factor for simultaneous running
        power_factor: float = 0.85             # Standard construction load power factor
    ) -> Dict[str, Any]:
        """
        Computes itemized and phase-level construction temporary electricity.
        """
        phase_groups: Dict[str, Dict[str, Any]] = {}
        total_construction_kwh = 0.0
        total_monthly_kwh = 0.0
        connected_load_kw = 0.0
        max_duration_months = 0.0

        itemized_results = []

        for eq in equipment_list:
            name = eq.get("equipment_name", "Equipment")
            phase = eq.get("phase_name", "General Construction")
            rated_kw = float(eq.get("rated_power_kw", 5.0))
            qty = int(eq.get("quantity", 1))
            load_pct = float(eq.get("operating_load_pct", 70.0)) / 100.0
            hrs_day = float(eq.get("hours_per_day", 6.0))
            days_month = int(eq.get("days_per_month", 25))
            duration_months = float(eq.get("duration_months", 3.0))
            efficiency = float(eq.get("efficiency_pct", 85.0)) / 100.0

            # Input electrical power in kW = (Rated kW * load %) / efficiency
            input_power_kw = (rated_kw * load_pct) / max(0.2, efficiency)
            total_machine_power_kw = input_power_kw * qty
            connected_load_kw += rated_kw * qty

            daily_kwh = round(total_machine_power_kw * hrs_day, 2)
            monthly_kwh = round(daily_kwh * days_month, 2)
            total_kwh = round(monthly_kwh * duration_months, 2)
            estimated_cost = round(total_kwh * temporary_tariff_rate, 2)

            if duration_months > max_duration_months:
                max_duration_months = duration_months

            total_construction_kwh += total_kwh
            total_monthly_kwh += monthly_kwh

            calc_item = {
                "equipment_name": name,
                "phase_name": phase,
                "quantity": qty,
                "rated_power_kw": rated_kw,
                "operating_load_pct": round(load_pct * 100, 1),
                "hours_per_day": hrs_day,
                "days_per_month": days_month,
                "duration_months": duration_months,
                "daily_kwh": daily_kwh,
                "monthly_kwh": monthly_kwh,
                "total_kwh": total_kwh,
                "estimated_cost": estimated_cost
            }
            itemized_results.append(calc_item)

            # Phase grouping
            if phase not in phase_groups:
                phase_groups[phase] = {
                    "phase_name": phase,
                    "equipment_count": 0,
                    "total_kwh": 0.0,
                    "total_cost": 0.0,
                    "duration_months": duration_months
                }
            phase_groups[phase]["equipment_count"] += qty
            phase_groups[phase]["total_kwh"] += total_kwh
            phase_groups[phase]["total_cost"] += estimated_cost
            phase_groups[phase]["duration_months"] = max(phase_groups[phase]["duration_months"], duration_months)

        # Total energy cost + temporary connection fixed charges
        total_energy_cost = total_construction_kwh * temporary_tariff_rate
        total_fixed_charges = fixed_charge_per_month * max_duration_months
        total_construction_budget = round(total_energy_cost + total_fixed_charges, 2)

        # Maximum simultaneous peak demand in kW
        # Coincidence diversity factor reflects that not all pumps, cranes, and welders run simultaneously
        estimated_max_demand_kw = round(connected_load_kw * diversity_factor, 2)

        # Suggested Temporary Connection Capacity (kVA)
        # kVA = kW / PF with standard 15% electrical engineering safety margin
        suggested_connection_kva = round((estimated_max_demand_kw / max(0.5, power_factor)) * 1.15, 1)

        # Average monthly consumption during active construction
        avg_active_monthly_kwh = round(total_construction_kwh / max(1.0, max_duration_months), 2)
        avg_active_monthly_cost = round(total_construction_budget / max(1.0, max_duration_months), 2)

        return {
            "summary": {
                "total_construction_kwh": round(total_construction_kwh, 2),
                "total_construction_budget_inr": total_construction_budget,
                "total_connected_load_kw": round(connected_load_kw, 2),
                "estimated_max_simultaneous_demand_kw": estimated_max_demand_kw,
                "suggested_connection_capacity_kva": suggested_connection_kva,
                "duration_months": max_duration_months,
                "average_monthly_kwh": avg_active_monthly_kwh,
                "average_monthly_cost_inr": avg_active_monthly_cost,
                "temporary_tariff_rate_applied": temporary_tariff_rate,
                "applied_diversity_factor": diversity_factor,
                "applied_power_factor": power_factor
            },
            "phases": list(phase_groups.values()),
            "itemized_equipment": itemized_results,
            "engineering_disclaimer": (
                "DISCLAIMER: Temporary construction electricity estimates, equipment sizing, "
                "and suggested connection capacity are preliminary planning projections. "
                "Final transformer sizing, DG backup sizing, and service connection sanctioning "
                "must be verified and stamped by a licensed Chartered Electrical Engineer / Electrical Inspectorate."
            )
        }

construction_calc = ConstructionCalcService()
