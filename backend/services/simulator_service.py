from typing import Dict, Any, List, Optional
from datetime import datetime

HOURLY_BASE_WEIGHTS = [
    0.025, 0.022, 0.020, 0.019, 0.021, 0.028,  # 00:00 - 05:00 (Night base)
    0.040, 0.055, 0.058, 0.052, 0.048, 0.046,  # 06:00 - 11:00 (Morning rise)
    0.050, 0.052, 0.049, 0.046, 0.048, 0.056,  # 12:00 - 17:00 (Afternoon)
    0.068, 0.076, 0.072, 0.065, 0.045, 0.032   # 18:00 - 23:00 (Evening peak)
]

PEAK_HOURS_INDICES = [12, 13, 14, 18, 19, 20, 21]
OFF_PEAK_RECIPIENT_HOURS = [2, 3, 4, 10, 11, 15]


class WhatIfEnergySimulatorService:
    """
    Signature Feature: Interactive What-If Energy Simulator Engine.
    Simulates peak load shaving, peak-to-off-peak load shifting,
    dynamic tariff adjustments, and carbon mitigation with mathematically
    transparent formulas and documented assumptions.
    """

    def simulate(
        self,
        baseline_monthly_kwh: float,
        baseline_peak_kwh: Optional[float] = None,
        peak_reduction_pct: float = 10.0,
        peak_shift_pct: float = 15.0,
        base_tariff: float = 7.50,
        peak_multiplier: float = 1.40,
        fixed_charges: float = 120.0,
        tax_pct: float = 5.0,
        grid_emission_factor: float = 0.82
    ) -> Dict[str, Any]:
        """
        Executes real-time simulation on monthly and 24-hour hourly curves.
        
        Principles:
        1. Peak Reduction directly curtails non-essential peak load, reducing total kWh and cost.
        2. Peak Shifting re-schedules flexible load from high-tariff peak hours to low-tariff off-peak hours.
           (Shifting reduces bill surcharge and grid stress, but preserves total kWh needed for appliances).
        """
        monthly_kwh = max(10.0, baseline_monthly_kwh)
        peak_kwh = baseline_peak_kwh if baseline_peak_kwh is not None else (monthly_kwh * 0.28)
        offpeak_kwh = max(0.0, monthly_kwh - peak_kwh)

        # 1. Peak Reduction (Curtailment)
        # Fraction of peak consumption curtailed
        curtailed_peak_kwh = peak_kwh * (min(50.0, max(0.0, peak_reduction_pct)) / 100.0)
        remaining_peak_before_shift = peak_kwh - curtailed_peak_kwh

        # 2. Peak Shifting
        # Fraction of remaining peak consumption transferred to off-peak hours
        shifted_kwh = remaining_peak_before_shift * (min(50.0, max(0.0, peak_shift_pct)) / 100.0)
        simulated_peak_kwh = remaining_peak_before_shift - shifted_kwh
        simulated_offpeak_kwh = offpeak_kwh + shifted_kwh

        # Totals
        simulated_total_kwh = simulated_peak_kwh + simulated_offpeak_kwh
        total_kwh_saved = curtailed_peak_kwh
        pct_energy_reduced = round((total_kwh_saved / (monthly_kwh + 1e-5)) * 100, 2)

        # Baseline Financials
        base_cost = (offpeak_kwh * base_tariff) + (peak_kwh * (base_tariff * peak_multiplier))
        baseline_bill = (base_cost + fixed_charges) * (1 + tax_pct / 100.0)

        # Simulated Financials
        sim_cost = (simulated_offpeak_kwh * base_tariff) + (simulated_peak_kwh * (base_tariff * peak_multiplier))
        simulated_bill = (sim_cost + fixed_charges) * (1 + tax_pct / 100.0)
        cost_saved = max(0.0, baseline_bill - simulated_bill)
        pct_cost_saved = round((cost_saved / (baseline_bill + 1e-5)) * 100, 2)

        # Environmental Carbon Impact
        emissions_baseline_kg = monthly_kwh * grid_emission_factor
        emissions_simulated_kg = simulated_total_kwh * grid_emission_factor
        emissions_saved_kg = total_kwh_saved * grid_emission_factor

        # 24-Hour Curve Comparison
        daily_baseline = monthly_kwh / 30.0
        hourly_baseline = []
        hourly_simulated = []

        # Peak hours reduction & shift distribution
        shift_per_hour = (shifted_kwh / 30.0) / len(OFF_PEAK_RECIPIENT_HOURS) if OFF_PEAK_RECIPIENT_HOURS else 0.0

        for h in range(24):
            base_h_kwh = daily_baseline * HOURLY_BASE_WEIGHTS[h]
            sim_h_kwh = base_h_kwh

            if h in PEAK_HOURS_INDICES:
                # Curtail and shift
                curtail = base_h_kwh * (peak_reduction_pct / 100.0)
                shift = (base_h_kwh - curtail) * (peak_shift_pct / 100.0)
                sim_h_kwh = base_h_kwh - curtail - shift
            elif h in OFF_PEAK_RECIPIENT_HOURS:
                # Absorbs shifted load
                sim_h_kwh = base_h_kwh + shift_per_hour

            hourly_baseline.append({
                "hour": f"{h:02d}:00",
                "label": f"{h:02d}:00",
                "baseline_kwh": round(base_h_kwh, 2),
                "simulated_kwh": round(max(0.01, sim_h_kwh), 2),
                "is_peak": h in PEAK_HOURS_INDICES
            })

        # Pre-computed strategy comparison presets
        preset_strategies = [
            self._evaluate_strategy("Conservative Shift (5% shift)", monthly_kwh, peak_kwh, 0.0, 5.0, base_tariff, peak_multiplier, fixed_charges, tax_pct, grid_emission_factor),
            self._evaluate_strategy("Moderate Balance (10% cut, 10% shift)", monthly_kwh, peak_kwh, 10.0, 10.0, base_tariff, peak_multiplier, fixed_charges, tax_pct, grid_emission_factor),
            self._evaluate_strategy("Recommended Optimizer (15% cut, 20% shift)", monthly_kwh, peak_kwh, 15.0, 20.0, base_tariff, peak_multiplier, fixed_charges, tax_pct, grid_emission_factor, is_recommended=True),
            self._evaluate_strategy("Aggressive Peak Shaving (25% cut, 25% shift)", monthly_kwh, peak_kwh, 25.0, 25.0, base_tariff, peak_multiplier, fixed_charges, tax_pct, grid_emission_factor),
        ]

        return {
            "disclaimer": "SIMULATION ASSUMPTION NOTICE: Simulated savings are model projections based on your entered parameters and tariff schedule. Actual savings require deliberate consumer behavioral adjustment or automated smart-timer operation.",
            "inputs": {
                "baseline_monthly_kwh": round(monthly_kwh, 2),
                "baseline_peak_kwh": round(peak_kwh, 2),
                "peak_reduction_pct": peak_reduction_pct,
                "peak_shift_pct": peak_shift_pct,
                "base_tariff": base_tariff,
                "peak_multiplier": peak_multiplier,
                "grid_emission_factor": grid_emission_factor
            },
            "summary": {
                "original_consumption_kwh": round(monthly_kwh, 2),
                "simulated_consumption_kwh": round(simulated_total_kwh, 2),
                "energy_saved_kwh": round(total_kwh_saved, 2),
                "energy_reduction_pct": pct_energy_reduced,
                "original_bill_inr": round(baseline_bill, 2),
                "simulated_bill_inr": round(simulated_bill, 2),
                "bill_saved_inr": round(cost_saved, 2),
                "bill_reduction_pct": pct_cost_saved,
                "carbon_saved_kg": round(emissions_saved_kg, 2),
                "carbon_reduction_pct": pct_energy_reduced
            },
            "hourly_profile_comparison": hourly_baseline,
            "strategy_benchmarks": preset_strategies,
            "recommended_scenario": {
                "name": "Balanced Peak Shift & Shave (15% Cut, 20% Shift)",
                "expected_kwh_saved": round(peak_kwh * 0.15, 1),
                "expected_monthly_savings_inr": round((baseline_bill - ((monthly_kwh * 0.95 * base_tariff) + fixed_charges) * (1 + tax_pct / 100.0)), 2),
                "feasibility": "High (Achievable via smart plugs, washing machine delays, and AC thermostat setpoint +1.5°C)"
            }
        }

    def _evaluate_strategy(
        self,
        name: str,
        total_kwh: float,
        peak_kwh: float,
        cut_pct: float,
        shift_pct: float,
        base_tariff: float,
        peak_mult: float,
        fixed: float,
        tax: float,
        grid_emission: float,
        is_recommended: bool = False
    ) -> Dict[str, Any]:
        curtail = peak_kwh * (cut_pct / 100.0)
        rem_peak = peak_kwh - curtail
        shift = rem_peak * (shift_pct / 100.0)
        sim_peak = rem_peak - shift
        sim_offpeak = (total_kwh - peak_kwh) + shift

        base_bill = (((total_kwh - peak_kwh) * base_tariff + peak_kwh * (base_tariff * peak_mult)) + fixed) * (1 + tax / 100.0)
        sim_bill = ((sim_offpeak * base_tariff + sim_peak * (base_tariff * peak_mult)) + fixed) * (1 + tax / 100.0)

        saved_cost = max(0.0, base_bill - sim_bill)
        return {
            "strategy_name": name,
            "peak_reduction_pct": cut_pct,
            "peak_shift_pct": shift_pct,
            "simulated_kwh": round(total_kwh - curtail, 1),
            "kwh_saved": round(curtail, 1),
            "bill_saved_inr": round(saved_cost, 2),
            "emissions_saved_kg": round(curtail * grid_emission, 1),
            "is_recommended": is_recommended
        }

simulator_service = WhatIfEnergySimulatorService()
