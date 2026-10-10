from typing import Dict, Any, List, Optional

class CarbonIntelligenceService:
    """
    Environmental Carbon Emission Estimation & Sustainability Module.
    Calculates CO2 equivalent footprints based on configured regional grid emission factors.
    Converts savings into tangible environmental metrics (trees planted, gasoline avoided).
    """

    # Official CEA (Central Electricity Authority India) average baseline is ~0.82 kg CO2e/kWh.
    # US EPA eGRID national average is ~0.38 kg CO2e/kWh; Global average ~0.47 kg CO2e/kWh.
    DEFAULT_GRID_FACTOR = 0.82

    def compute_emissions(
        self,
        actual_kwh: float,
        predicted_kwh: Optional[float] = None,
        simulated_kwh: Optional[float] = None,
        grid_emission_factor: float = DEFAULT_GRID_FACTOR,
        history_records: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        factor = max(0.01, grid_emission_factor)

        actual_emissions_kg = round(actual_kwh * factor, 2)
        actual_emissions_mt = round(actual_emissions_kg / 1000.0, 3)

        predicted_emissions_kg = round(predicted_kwh * factor, 2) if predicted_kwh is not None else None
        simulated_emissions_kg = round(simulated_kwh * factor, 2) if simulated_kwh is not None else None

        # Reductions
        savings_kwh = max(0.0, actual_kwh - simulated_kwh) if simulated_kwh is not None else 0.0
        emissions_saved_kg = round(savings_kwh * factor, 2)

        # Equivalencies:
        # 1 adult tree absorbs ~22 kg CO2/year (~1.83 kg CO2/month)
        # 1 passenger vehicle produces ~192 g CO2/km (~0.192 kg CO2/km)
        # 1 liter of gasoline combustion produces ~2.31 kg CO2
        trees_monthly = round(actual_emissions_kg / 1.83, 1)
        car_km = round(actual_emissions_kg / 0.192, 0)
        gasoline_liters = round(actual_emissions_kg / 2.31, 1)

        trees_saved = round(emissions_saved_kg / 1.83, 1) if emissions_saved_kg > 0 else 0.0
        car_km_saved = round(emissions_saved_kg / 0.192, 0) if emissions_saved_kg > 0 else 0.0

        # Timeline analysis if historical records provided
        emissions_timeline = []
        if history_records:
            for r in history_records[-12:]:
                u = float(r.get("units_consumed", 0.0))
                emissions_timeline.append({
                    "date": str(r.get("date", "")),
                    "units_consumed": u,
                    "emissions_kg": round(u * factor, 2)
                })

        return {
            "grid_emission_factor": factor,
            "emission_factor_unit": "kg CO2e / kWh",
            "source_reference": "Central Electricity Authority (CEA) CO2 Baseline Database / IEA Standard",
            "actual": {
                "consumption_kwh": round(actual_kwh, 2),
                "emissions_kg": actual_emissions_kg,
                "emissions_metric_tons": actual_emissions_mt,
                "equivalencies": {
                    "trees_monthly_absorption": trees_monthly,
                    "gasoline_car_km": car_km,
                    "gasoline_fuel_liters": gasoline_liters
                }
            },
            "predicted": {
                "consumption_kwh": round(predicted_kwh, 2) if predicted_kwh else None,
                "emissions_kg": predicted_emissions_kg,
                "emissions_metric_tons": round(predicted_emissions_kg / 1000.0, 3) if predicted_emissions_kg else None
            } if predicted_kwh is not None else None,
            "simulated": {
                "consumption_kwh": round(simulated_kwh, 2) if simulated_kwh else None,
                "emissions_kg": simulated_emissions_kg,
                "emissions_saved_kg": emissions_saved_kg,
                "trees_offset_equivalent": trees_saved,
                "car_km_avoided": car_km_saved
            } if simulated_kwh is not None else None,
            "timeline": emissions_timeline
        }

carbon_service = CarbonIntelligenceService()
