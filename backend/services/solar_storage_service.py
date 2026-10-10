from typing import Dict, Any, Optional

class SolarStorageService:
    """
    Solar Photovoltaic, Battery Energy Storage (BESS), and Renewable Sizing Service.
    Calculates solar array capacity based on rooftop space & consumption,
    predicts daily/annual generation, models battery storage Ah/kWh requirements,
    and performs 3-scenario financial payback comparison.
    """

    def calculate_solar_and_storage(
        self,
        daily_consumption_kwh: float,
        rooftop_area_sq_ft: float = 1200.0,
        solar_irradiance_kwh_per_sqm: float = 5.0,  # Benchmark ~4.8 - 5.5 in India
        critical_load_kw: float = 2.5,
        desired_backup_hours: float = 4.0,
        grid_tariff_rate: float = 7.50,
        system_derate_factor: float = 0.78,         # Inverter efficiency, dust, temperature losses
        solar_cost_per_kw: float = 48000.0,         # ₹/kW turnkey on-grid
        battery_cost_per_kwh: float = 18500.0,      # ₹/kWh LiFePO4 storage
        hybrid_inverter_base_cost: float = 35000.0  # ₹
    ) -> Dict[str, Any]:
        """
        Executes PV & BESS physics and financial calculations.
        """
        # Area capacity limit: ~100 sq ft (~9.3 sq m) per 1 kWp crystalline silicon solar PV
        max_solar_by_area_kw = round(rooftop_area_sq_ft / 100.0, 1)

        # Target solar generation to offset 75% of daytime consumption
        daily_target_kwh = daily_consumption_kwh * 0.75
        ideal_solar_kw = round(daily_target_kwh / max(1.0, (solar_irradiance_kwh_per_sqm * system_derate_factor)), 1)

        # Suggested capacity matches the smaller of space limit or optimal load offset
        suggested_solar_kw = max(1.0, min(max_solar_by_area_kw, ideal_solar_kw))

        # Expected Generation (kWh)
        daily_generation_kwh = round(suggested_solar_kw * solar_irradiance_kwh_per_sqm * system_derate_factor, 2)
        annual_generation_kwh = round(daily_generation_kwh * 365.0, 2)

        # Self-consumption potential: direct daytime usage without battery is approx 70% of generation
        direct_self_consumption_pct = 70.0
        self_consumed_daily_kwh = min(daily_generation_kwh * (direct_self_consumption_pct / 100.0), daily_consumption_kwh)

        # Battery Sizing
        # Energy required = Critical load (kW) * Backup hours
        # Factoring 85% Depth of Discharge (DoD) and 92% round-trip inverter battery efficiency
        battery_effective_kwh = critical_load_kw * desired_backup_hours
        battery_capacity_kwh = round(battery_effective_kwh / (0.85 * 0.92), 2)
        battery_ah_48v = round((battery_capacity_kwh * 1000.0) / 48.0, 0) # Standard 48V DC bus

        # Grid energy remaining after solar
        grid_energy_daily_kwh = max(0.0, daily_consumption_kwh - daily_generation_kwh)
        grid_energy_monthly_kwh = round(grid_energy_daily_kwh * 30.0, 2)

        # Financial Costs
        solar_hardware_cost = suggested_solar_kw * solar_cost_per_kw
        battery_hardware_cost = battery_capacity_kwh * battery_cost_per_kwh

        # Scenario 1: Grid Electricity Only (Baseline)
        annual_grid_cost = round(daily_consumption_kwh * 365.0 * grid_tariff_rate, 2)
        baseline_5yr_cost = round(annual_grid_cost * 5.0, 2)

        # Scenario 2: Solar Without Battery (Grid-Tied Net Metering)
        solar_only_capital = round(solar_hardware_cost, 2)
        solar_only_annual_bill = round(max(0.0, (daily_consumption_kwh * 365.0) - annual_generation_kwh) * grid_tariff_rate, 2)
        solar_only_annual_savings = round(annual_grid_cost - solar_only_annual_bill, 2)
        solar_only_payback_years = round(solar_only_capital / max(1.0, solar_only_annual_savings), 1)
        solar_only_5yr_tco = round(solar_only_capital + (solar_only_annual_bill * 5.0), 2)

        # Scenario 3: Solar With Battery Storage (Hybrid Microgrid)
        hybrid_capital = round(solar_hardware_cost + battery_hardware_cost + hybrid_inverter_base_cost, 2)
        # With battery, self-consumption rises to 92%
        hybrid_annual_bill = round(max(0.0, (daily_consumption_kwh * 365.0) - (annual_generation_kwh * 0.95)) * grid_tariff_rate, 2)
        hybrid_annual_savings = round(annual_grid_cost - hybrid_annual_bill, 2)
        hybrid_payback_years = round(hybrid_capital / max(1.0, hybrid_annual_savings), 1)
        hybrid_5yr_tco = round(hybrid_capital + (hybrid_annual_bill * 5.0), 2)

        # Lifetime 25-Year Clean Electricity Production
        lifetime_generation_kwh = round(annual_generation_kwh * 25.0 * 0.90, 0) # 0.90 accounts for 0.5%/yr degradation

        # CO2 Avoided (0.716 kg CO2/kWh grid emission factor)
        annual_co2_offset_tonnes = round((annual_generation_kwh * 0.716) / 1000.0, 2)

        return {
            "inputs": {
                "daily_consumption_kwh": daily_consumption_kwh,
                "rooftop_area_sq_ft": rooftop_area_sq_ft,
                "solar_irradiance_benchmark": solar_irradiance_kwh_per_sqm,
                "critical_load_kw": critical_load_kw,
                "desired_backup_hours": desired_backup_hours,
                "grid_tariff_rate": grid_tariff_rate
            },
            "solar_sizing": {
                "suggested_solar_capacity_kw": suggested_solar_kw,
                "max_capacity_by_rooftop_area_kw": max_solar_by_area_kw,
                "expected_daily_generation_kwh": daily_generation_kwh,
                "expected_annual_generation_kwh": annual_generation_kwh,
                "lifetime_25yr_generation_kwh": lifetime_generation_kwh,
                "self_consumption_potential_pct": direct_self_consumption_pct,
                "remaining_grid_monthly_kwh": grid_energy_monthly_kwh,
                "annual_co2_offset_tonnes": annual_co2_offset_tonnes
            },
            "battery_storage_sizing": {
                "suggested_battery_capacity_kwh": battery_capacity_kwh,
                "battery_amp_hours_48v": battery_ah_48v,
                "backup_duration_hours": desired_backup_hours,
                "critical_load_supported_kw": critical_load_kw,
                "battery_chemistry": "Lithium Iron Phosphate (LiFePO4, 85% DoD)"
            },
            "scenarios_comparison": {
                "scenario_1_grid_only": {
                    "name": "Grid Electricity Only",
                    "initial_capex_inr": 0.0,
                    "annual_electricity_bill_inr": annual_grid_cost,
                    "five_year_tco_inr": baseline_5yr_cost,
                    "payback_years": 0.0,
                    "grid_reliance_pct": 100.0
                },
                "scenario_2_solar_grid_tied": {
                    "name": "Solar PV (Net Metered, No Battery)",
                    "initial_capex_inr": solar_only_capital,
                    "annual_electricity_bill_inr": solar_only_annual_bill,
                    "annual_savings_inr": solar_only_annual_savings,
                    "five_year_tco_inr": solar_only_5yr_tco,
                    "payback_years": solar_only_payback_years,
                    "grid_reliance_pct": round((grid_energy_monthly_kwh / max(1.0, daily_consumption_kwh * 30.0)) * 100, 1)
                },
                "scenario_3_solar_hybrid_battery": {
                    "name": "Solar PV + BESS Battery Storage",
                    "initial_capex_inr": hybrid_capital,
                    "annual_electricity_bill_inr": hybrid_annual_bill,
                    "annual_savings_inr": hybrid_annual_savings,
                    "five_year_tco_inr": hybrid_5yr_tco,
                    "payback_years": hybrid_payback_years,
                    "grid_reliance_pct": max(5.0, round((grid_energy_monthly_kwh / max(1.0, daily_consumption_kwh * 30.0)) * 50, 1))
                }
            },
            "disclaimer": (
                "IMPORTANT NOTICE: Solar generation and battery payback estimates are indicative models based on standard "
                "solar irradiance data. Actual yield depends on local shadow obstructions, roof azimuth/tilt, inverter clipping, "
                "and seasonal cloud cover. A physical shadow survey and structural stability inspection by a qualified solar installer is mandatory."
            )
        }

solar_storage = SolarStorageService()
