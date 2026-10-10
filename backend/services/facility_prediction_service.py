from typing import Dict, List, Any, Optional
import math
from backend.services.tariff_engine_service import tariff_engine
from backend.services.recommendations_engine_service import recommendations_engine

class FacilityPredictionService:
    """
    Core Engineering Demand Prediction & Load Sizing Service.
    
    Calculates input-dependent electricity demand for all facility construction types:
    - Daily electricity consumption in kWh
    - Monthly electricity consumption in kWh
    - Average demand in kW
    - Estimated peak load in kW
    - Recommended connection capacity in kVA
    - Estimated monthly electricity bill (₹) using verified DISCOM tariff slabs
    
    All figures are dynamically computed from user building area, floor count,
    occupancy, daily operating hours, operating days, HVAC system, appliances,
    and facility-specific parameters.
    """

    # Engineering Archetypes calibrated with ECBC / NBC / ASHRAE 90.1 benchmarks
    ARCHETYPES: Dict[str, Dict[str, Any]] = {
        "Residential House": {
            "category": "Residential",
            "base_w_per_sq_ft": 3.2,
            "cooling_sq_ft_per_ton": 380.0,
            "occupant_watts": 180.0,
            "floor_adder_kw": 0.8,
            "diversity_factor": 0.65,
            "power_factor": 0.88,
            "default_hours": 24.0,
            "default_days": 30,
            "default_area": 2500.0,
            "default_floors": 2,
            "default_occupancy": 4,
            "default_discom": "BESCOM",
            "default_tariff": "Domestic LT-2",
            "peak_window": "18:00 – 22:00 (Evening Surge)",
            "hourly_weights": [
                0.025, 0.022, 0.020, 0.019, 0.021, 0.028,
                0.045, 0.055, 0.048, 0.038, 0.034, 0.032,
                0.035, 0.032, 0.031, 0.033, 0.042, 0.058,
                0.078, 0.088, 0.082, 0.068, 0.045, 0.031
            ]
        },
        "Apartment / Residential Complex": {
            "category": "Residential",
            "base_w_per_sq_ft": 4.5,
            "cooling_sq_ft_per_ton": 360.0,
            "occupant_watts": 150.0,
            "floor_adder_kw": 3.5, # Multi-floor lifts & riser hydro-pneumatics
            "diversity_factor": 0.70,
            "power_factor": 0.88,
            "default_hours": 24.0,
            "default_days": 30,
            "default_area": 45000.0,
            "default_floors": 8,
            "default_occupancy": 150,
            "default_discom": "BESCOM",
            "default_tariff": "Domestic LT-2",
            "peak_window": "06:00 – 09:00 & 18:30 – 22:00 (Dual Residential Peak)",
            "hourly_weights": [
                0.028, 0.025, 0.022, 0.020, 0.024, 0.040,
                0.068, 0.075, 0.062, 0.040, 0.035, 0.034,
                0.036, 0.034, 0.032, 0.035, 0.044, 0.060,
                0.076, 0.082, 0.075, 0.055, 0.045, 0.038
            ]
        },
        "College / School": {
            "category": "Public and Institutional",
            "base_w_per_sq_ft": 5.2,
            "cooling_sq_ft_per_ton": 320.0,
            "occupant_watts": 85.0, # Computer lab & classroom share
            "floor_adder_kw": 1.6,
            "diversity_factor": 0.72,
            "power_factor": 0.90,
            "default_hours": 8.5,
            "default_days": 24,
            "default_area": 35000.0,
            "default_floors": 3,
            "default_occupancy": 600,
            "default_discom": "BESCOM",
            "default_tariff": "Commercial LT-3",
            "peak_window": "09:30 – 14:30 (Daytime Academic Schedule)",
            "hourly_weights": [
                0.010, 0.010, 0.010, 0.010, 0.012, 0.015,
                0.025, 0.050, 0.095, 0.120, 0.125, 0.115,
                0.105, 0.110, 0.090, 0.045, 0.020, 0.012,
                0.010, 0.010, 0.008, 0.008, 0.008, 0.008
            ]
        },
        "Hospital": {
            "category": "Public and Institutional",
            "base_w_per_sq_ft": 16.5, # Sterile air handling, diagnostic systems, OT
            "cooling_sq_ft_per_ton": 180.0,
            "occupant_watts": 850.0, # High medical instrumentation per bed/staff
            "floor_adder_kw": 4.2, # Bed lifts, medical gas pumps
            "diversity_factor": 0.85, # High continuous duty factor
            "power_factor": 0.92,
            "default_hours": 24.0,
            "default_days": 30,
            "default_area": 40000.0,
            "default_floors": 5,
            "default_occupancy": 150,
            "default_discom": "BESCOM",
            "default_tariff": "Commercial LT-3",
            "peak_window": "Continuous 24/7 (Critical Healthcare Baseline)",
            "hourly_weights": [
                0.038, 0.037, 0.036, 0.036, 0.037, 0.039,
                0.042, 0.046, 0.048, 0.049, 0.050, 0.049,
                0.048, 0.047, 0.046, 0.045, 0.044, 0.043,
                0.042, 0.041, 0.040, 0.039, 0.038, 0.038
            ]
        },
        "Office Building": {
            "category": "Commercial",
            "base_w_per_sq_ft": 9.5,
            "cooling_sq_ft_per_ton": 240.0,
            "occupant_watts": 260.0, # Laptops, dual screens, task lighting
            "floor_adder_kw": 3.8,
            "diversity_factor": 0.75,
            "power_factor": 0.90,
            "default_hours": 10.0,
            "default_days": 22,
            "default_area": 25000.0,
            "default_floors": 4,
            "default_occupancy": 200,
            "default_discom": "BESCOM",
            "default_tariff": "Commercial LT-3",
            "peak_window": "10:00 – 17:00 (Business Working Hours)",
            "hourly_weights": [
                0.012, 0.010, 0.010, 0.010, 0.012, 0.018,
                0.030, 0.055, 0.088, 0.105, 0.110, 0.105,
                0.095, 0.100, 0.098, 0.092, 0.075, 0.040,
                0.020, 0.015, 0.012, 0.010, 0.010, 0.010
            ]
        },
        "Shopping Mall": {
            "category": "Commercial",
            "base_w_per_sq_ft": 16.0, # Display lighting, anchor supermarket, escalators
            "cooling_sq_ft_per_ton": 200.0,
            "occupant_watts": 80.0, # High footfall visitor heat gain
            "floor_adder_kw": 4.5,
            "diversity_factor": 0.80,
            "power_factor": 0.90,
            "default_hours": 12.0,
            "default_days": 30,
            "default_area": 60000.0,
            "default_floors": 4,
            "default_occupancy": 800,
            "default_discom": "BESCOM",
            "default_tariff": "Commercial LT-3",
            "peak_window": "12:00 – 21:00 (Afternoon & Evening Retail Surge)",
            "hourly_weights": [
                0.015, 0.012, 0.010, 0.010, 0.010, 0.012,
                0.018, 0.025, 0.040, 0.065, 0.085, 0.095,
                0.100, 0.098, 0.095, 0.092, 0.095, 0.105,
                0.110, 0.100, 0.070, 0.040, 0.025, 0.018
            ]
        },
        "Hotel": {
            "category": "Commercial",
            "base_w_per_sq_ft": 11.5,
            "cooling_sq_ft_per_ton": 260.0,
            "occupant_watts": 350.0, # Rooms, central kitchen, banquet equipment
            "floor_adder_kw": 3.2,
            "diversity_factor": 0.74,
            "power_factor": 0.90,
            "default_hours": 24.0,
            "default_days": 30,
            "default_area": 40000.0,
            "default_floors": 6,
            "default_occupancy": 120,
            "default_discom": "BESCOM",
            "default_tariff": "Commercial LT-3",
            "peak_window": "07:00 – 10:30 & 18:30 – 23:00 (Hospitality Dining Peak)",
            "hourly_weights": [
                0.028, 0.025, 0.022, 0.020, 0.022, 0.035,
                0.055, 0.072, 0.070, 0.055, 0.042, 0.038,
                0.040, 0.038, 0.035, 0.036, 0.044, 0.062,
                0.078, 0.085, 0.080, 0.065, 0.048, 0.035
            ]
        },
        "Factory / Industrial Building": {
            "category": "Industrial and Infrastructure",
            "base_w_per_sq_ft": 26.0, # Machine shop floor, compressed air, cranes
            "cooling_sq_ft_per_ton": 550.0,
            "occupant_watts": 450.0, # Machine workstation tool tooling
            "floor_adder_kw": 1.0,
            "diversity_factor": 0.82,
            "power_factor": 0.85,
            "default_hours": 16.0,
            "default_days": 26,
            "default_area": 30000.0,
            "default_floors": 1,
            "default_occupancy": 80,
            "default_discom": "BESCOM",
            "default_tariff": "Industrial LT-5",
            "peak_window": "08:00 – 18:00 (Industrial Shift Operating Peak)",
            "hourly_weights": [
                0.020, 0.018, 0.018, 0.018, 0.020, 0.030,
                0.055, 0.090, 0.105, 0.110, 0.105, 0.100,
                0.095, 0.098, 0.095, 0.090, 0.075, 0.060,
                0.045, 0.035, 0.025, 0.022, 0.020, 0.020
            ]
        },
        "IT Park": {
            "category": "Commercial",
            "base_w_per_sq_ft": 22.0, # High density data servers, precision cooling, workstations
            "cooling_sq_ft_per_ton": 210.0,
            "occupant_watts": 320.0,
            "floor_adder_kw": 4.2,
            "diversity_factor": 0.78,
            "power_factor": 0.92,
            "default_hours": 18.0,
            "default_days": 24,
            "default_area": 50000.0,
            "default_floors": 6,
            "default_occupancy": 450,
            "default_discom": "BESCOM",
            "default_tariff": "Commercial LT-3",
            "peak_window": "09:00 – 20:00 (High-Density Server & Workspace Peak)",
            "hourly_weights": [
                0.025, 0.022, 0.022, 0.020, 0.022, 0.028,
                0.045, 0.075, 0.095, 0.105, 0.108, 0.100,
                0.095, 0.098, 0.095, 0.090, 0.082, 0.068,
                0.052, 0.040, 0.032, 0.028, 0.025, 0.024
            ]
        },
        "Warehouse / Logistics Hub": {
            "category": "Commercial",
            "base_w_per_sq_ft": 4.5,
            "cooling_sq_ft_per_ton": 750.0,
            "occupant_watts": 150.0,
            "floor_adder_kw": 0.5,
            "diversity_factor": 0.60,
            "power_factor": 0.88,
            "default_hours": 10.0,
            "default_days": 26,
            "default_area": 40000.0,
            "default_floors": 1,
            "default_occupancy": 35,
            "default_discom": "BESCOM",
            "default_tariff": "Commercial LT-3",
            "peak_window": "08:00 – 17:00 (Logistics Dispatch & Loading)",
            "hourly_weights": [
                0.015, 0.012, 0.010, 0.010, 0.012, 0.020,
                0.045, 0.085, 0.105, 0.110, 0.105, 0.098,
                0.092, 0.095, 0.090, 0.085, 0.070, 0.040,
                0.025, 0.020, 0.018, 0.015, 0.015, 0.015
            ]
        },
        "Commercial Retail Store": {
            "category": "Commercial",
            "base_w_per_sq_ft": 14.0,
            "cooling_sq_ft_per_ton": 250.0,
            "occupant_watts": 120.0,
            "floor_adder_kw": 2.0,
            "diversity_factor": 0.76,
            "power_factor": 0.90,
            "default_hours": 12.0,
            "default_days": 30,
            "default_area": 8000.0,
            "default_floors": 2,
            "default_occupancy": 40,
            "default_discom": "BESCOM",
            "default_tariff": "Commercial LT-3",
            "peak_window": "11:00 – 20:30 (Commercial Retail Trading Hours)",
            "hourly_weights": [
                0.015, 0.012, 0.010, 0.010, 0.012, 0.015,
                0.020, 0.035, 0.065, 0.090, 0.095, 0.098,
                0.095, 0.092, 0.090, 0.092, 0.098, 0.105,
                0.108, 0.095, 0.065, 0.035, 0.025, 0.018
            ]
        }
    }

    # COP and kW per ton power draw for HVAC configurations
    AC_SYSTEM_SPECS = {
        "Central Chiller HVAC Plant": {"kw_per_ton": 0.75, "efficiency_label": "High Efficiency Water/Air Chiller"},
        "VRV / VRF Multi-Split System": {"kw_per_ton": 1.10, "efficiency_label": "Variable Refrigerant Flow (VRF)"},
        "Split / Window Inverter ACs": {"kw_per_ton": 1.30, "efficiency_label": "Direct Expansion Inverter Split Units"},
        "Natural Ventilation / Fans Only": {"kw_per_ton": 0.18, "efficiency_label": "High Volume Fans / Mechanical Ventilation"}
    }

    def predict_demand(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes complete mathematical demand prediction from building parameters.
        Returns all 6 required metrics, itemized categories, sensitivity analysis,
        and state-specific DISCOM tariff bills.
        """
        construction_type = input_data.get("construction_type") or input_data.get("facility_subtype") or "Residential House"
        
        # Match archetype or fallback to Residential House / Commercial
        archetype = self.ARCHETYPES.get(construction_type)
        if not archetype:
            for k, arch in self.ARCHETYPES.items():
                if k.lower() in construction_type.lower() or construction_type.lower() in k.lower():
                    archetype = arch
                    break
        if not archetype:
            archetype = self.ARCHETYPES["Commercial Retail Store"] if "commercial" in construction_type.lower() else self.ARCHETYPES["Residential House"]

        # Parse & Validate Primary Inputs
        raw_area = input_data.get("built_up_area")
        area = float(raw_area) if raw_area not in [None, "", 0] else archetype["default_area"]
        if area <= 0:
            raise ValueError("Building area must be a positive number greater than zero.")

        raw_floors = input_data.get("floors_count")
        floors = int(raw_floors) if raw_floors not in [None, "", 0] else archetype["default_floors"]
        if floors < 1:
            raise ValueError("Number of floors must be at least 1.")

        raw_occ = input_data.get("occupancy")
        occupancy = int(raw_occ) if raw_occ not in [None, "", 0] else archetype["default_occupancy"]
        if occupancy < 1:
            raise ValueError("Occupancy must be at least 1 person.")

        raw_hours = input_data.get("daily_operating_hours")
        daily_hours = float(raw_hours) if raw_hours not in [None, "", 0] else archetype["default_hours"]
        if daily_hours < 1.0 or daily_hours > 24.0:
            raise ValueError("Daily operating hours must be between 1 and 24 hours.")

        raw_days = input_data.get("operating_days_per_month")
        operating_days = int(raw_days) if raw_days not in [None, "", 0] else archetype["default_days"]
        if operating_days < 1 or operating_days > 31:
            raise ValueError("Operating days per month must be between 1 and 31 days.")

        ac_type = input_data.get("ac_type") or "Split / Window Inverter ACs"
        ac_spec = self.AC_SYSTEM_SPECS.get(ac_type, self.AC_SYSTEM_SPECS["Split / Window Inverter ACs"])
        
        discom = input_data.get("discom") or archetype["default_discom"]
        tariff_cat = input_data.get("tariff_category") or archetype["default_tariff"]

        # -----------------------------------------------------------------
        # 1. Connected Load Calculation by Component
        # -----------------------------------------------------------------
        # A. Base Lighting & Ambient System Power (kW)
        # Scales with building area (W/sq ft / 1000)
        base_lighting_kw = round((area * (archetype["base_w_per_sq_ft"] * 0.40)) / 1000.0, 3)

        # B. HVAC & Cooling Connected Load (kW)
        # Sized by thermal cooling area per ton and equipment COP
        cooling_tons = round(area / archetype["cooling_sq_ft_per_ton"], 2)
        hvac_connected_kw = round(cooling_tons * ac_spec["kw_per_ton"], 3)

        # C. Occupancy Plug Load (kW)
        # Scales with actual occupant count and archetype plug density
        occupancy_plug_kw = round((occupancy * archetype["occupant_watts"]) / 1000.0, 3)

        # D. Vertical Transportation & Pumping Load (kW)
        # Multi-floor distribution penalty: Lifts, booster pumps, riser pressurization
        floor_infrastructure_kw = round(max(0, floors - 1) * archetype["floor_adder_kw"], 3)

        # E. Form Appliance Inventory (if provided)
        appliances_input = input_data.get("appliances") or []
        appliances_connected_kw = 0.0
        appliances_daily_kwh = 0.0

        itemized_appliance_data = []
        for app in appliances_input:
            is_active = app.get("checked", True)
            if not is_active:
                continue
            qty = max(1, int(app.get("quantity", 1)))
            rated_w = max(1.0, float(app.get("rated_power_w", 500.0)))
            hrs = min(24.0, max(0.5, float(app.get("daily_hours", 8.0))))
            load_factor = float(app.get("operating_load_pct", 75.0)) / 100.0

            device_total_kw = (rated_w * qty) / 1000.0
            appliances_connected_kw += device_total_kw

            item_daily_kwh = (device_total_kw * load_factor * hrs)
            appliances_daily_kwh += item_daily_kwh
            
            itemized_appliance_data.append({
                "name": app.get("name", "Appliance"),
                "category": app.get("category", "Appliances"),
                "connected_kw": round(device_total_kw, 2),
                "daily_kwh": round(item_daily_kwh, 2)
            })

        # Total Connected Electrical Load (kW)
        # If user supplied custom appliances, integrate them with the building physics load
        total_connected_load_kw = round(
            base_lighting_kw + hvac_connected_kw + occupancy_plug_kw + floor_infrastructure_kw + appliances_connected_kw,
            2
        )

        # -----------------------------------------------------------------
        # 2. Daily Energy Consumption Breakdown (kWh/day)
        # -----------------------------------------------------------------
        # HVAC runs during daily operating hours with thermal cycling factor (typically 65% duty)
        hvac_daily_kwh = round(hvac_connected_kw * 0.68 * min(daily_hours, 24.0), 2)
        
        # Base lighting runs during active hours (plus 10% security/night baseline)
        lighting_daily_kwh = round((base_lighting_kw * daily_hours) + (base_lighting_kw * 0.12 * (24.0 - daily_hours)), 2)
        
        # Occupant plug loads active during operating hours (plus 15% standby/phantom load)
        occupancy_daily_kwh = round((occupancy_plug_kw * 0.70 * daily_hours) + (occupancy_plug_kw * 0.15 * (24.0 - daily_hours)), 2)
        
        # Pumping & elevator duty cycle (intermittent ~3.5 hours equivalent run time)
        pumping_daily_kwh = round(floor_infrastructure_kw * 0.60 * min(daily_hours, 8.0), 2)

        # Base Daily Energy Total (kWh/day)
        total_daily_kwh = round(
            hvac_daily_kwh + lighting_daily_kwh + occupancy_daily_kwh + pumping_daily_kwh + appliances_daily_kwh,
            2
        )

        # -----------------------------------------------------------------
        # 3. Monthly Electricity Consumption (kWh/month)
        # -----------------------------------------------------------------
        total_monthly_kwh = round(total_daily_kwh * operating_days, 1)
        annual_kwh = round(total_monthly_kwh * 12.0, 1)

        # -----------------------------------------------------------------
        # 4. Average Demand (kW)
        # Power averaged across the active operating window
        # -----------------------------------------------------------------
        avg_demand_kw = round(total_daily_kwh / max(1.0, daily_hours), 2)

        # -----------------------------------------------------------------
        # 5. Estimated Peak Load (kW)
        # Peak load = Connected Load * Diversity Factor
        # -----------------------------------------------------------------
        diversity_factor = archetype["diversity_factor"]
        estimated_peak_load_kw = round(max(1.5, total_connected_load_kw * diversity_factor), 2)

        # -----------------------------------------------------------------
        # 6. Recommended Connection Capacity (kVA)
        # Capacity in kVA = Peak kW / Power Factor * Electrical Safety Margin (1.15)
        # -----------------------------------------------------------------
        power_factor = archetype["power_factor"]
        safety_margin = 1.15 # 15% reserve capacity per Indian Electricity Rules / CEA
        recommended_capacity_kva = round((estimated_peak_load_kw / power_factor) * safety_margin, 1)

        # -----------------------------------------------------------------
        # 7. Estimated Monthly Electricity Bill (₹)
        # Uses verified DISCOM telescopic slabs & tariff category
        # -----------------------------------------------------------------
        custom_tariff = input_data.get("custom_tariff")
        tariff_result = tariff_engine.calculate_bill(
            consumption_kwh=total_monthly_kwh,
            discom_code=discom,
            category_name=tariff_cat,
            sanctioned_load_kw=max(5.0, round(estimated_peak_load_kw * 1.10, 1)),
            custom_tariff=custom_tariff
        )

        monthly_bill_inr = tariff_result["total_estimated_monthly_bill"]
        effective_tariff_rate = tariff_result["effective_rate_per_kwh"]
        annual_bill_inr = round(monthly_bill_inr * 12.0, 2)

        # -----------------------------------------------------------------
        # 8. Usage Category Breakdown
        # -----------------------------------------------------------------
        categories_list = [
            {
                "category": "HVAC & Climate Control",
                "daily_kwh": hvac_daily_kwh,
                "monthly_kwh": round(hvac_daily_kwh * operating_days, 1),
                "pct": round((hvac_daily_kwh / max(0.1, total_daily_kwh)) * 100, 1),
                "connected_kw": hvac_connected_kw,
                "color": "#00D9FF"
            },
            {
                "category": "Interior & Area Lighting",
                "daily_kwh": lighting_daily_kwh,
                "monthly_kwh": round(lighting_daily_kwh * operating_days, 1),
                "pct": round((lighting_daily_kwh / max(0.1, total_daily_kwh)) * 100, 1),
                "connected_kw": base_lighting_kw,
                "color": "#1677FF"
            },
            {
                "category": "Occupant Equipment & Plug Loads",
                "daily_kwh": round(occupancy_daily_kwh + appliances_daily_kwh, 2),
                "monthly_kwh": round((occupancy_daily_kwh + appliances_daily_kwh) * operating_days, 1),
                "pct": round(((occupancy_daily_kwh + appliances_daily_kwh) / max(0.1, total_daily_kwh)) * 100, 1),
                "connected_kw": round(occupancy_plug_kw + appliances_connected_kw, 2),
                "color": "#10B981"
            },
            {
                "category": "Pumping & Vertical Transport",
                "daily_kwh": pumping_daily_kwh,
                "monthly_kwh": round(pumping_daily_kwh * operating_days, 1),
                "pct": round((pumping_daily_kwh / max(0.1, total_daily_kwh)) * 100, 1),
                "connected_kw": floor_infrastructure_kw,
                "color": "#F59E0B"
            }
        ]

        # -----------------------------------------------------------------
        # 9. 24-Hour Diurnal Demand Curve
        # -----------------------------------------------------------------
        hourly_weights = archetype["hourly_weights"]
        hourly_curve = []
        for h, w in enumerate(hourly_weights):
            kw_at_h = round((total_daily_kwh * w * 24.0) / 1.0, 2)
            is_peak = h in [11, 12, 13, 18, 19, 20, 21]
            hourly_curve.append({
                "hour": f"{h:02d}:00",
                "predicted_kw": kw_at_h,
                "is_peak": is_peak
            })

        # -----------------------------------------------------------------
        # 10. Sensitivity Drivers & Input Influence
        # -----------------------------------------------------------------
        hvac_pct = round((hvac_daily_kwh / max(0.1, total_daily_kwh)) * 100, 1)
        lighting_pct = round((lighting_daily_kwh / max(0.1, total_daily_kwh)) * 100, 1)
        plug_pct = round(((occupancy_daily_kwh + appliances_daily_kwh) / max(0.1, total_daily_kwh)) * 100, 1)
        pumping_pct = round((pumping_daily_kwh / max(0.1, total_daily_kwh)) * 100, 1)

        sensitivity_drivers = [
            {
                "input_factor": "Building Area & HVAC System",
                "influence_pct": hvac_pct,
                "explanation": f"Sizing for {area:,.0f} sq ft using {ac_type} accounts for {hvac_pct}% of total daily electricity."
            },
            {
                "input_factor": "Occupancy & Working Equipment",
                "influence_pct": plug_pct,
                "explanation": f"{occupancy} occupants and active appliances account for {plug_pct}% of total load."
            },
            {
                "input_factor": "Daily Operating Schedule",
                "influence_pct": round((daily_hours / 24.0) * 100, 1),
                "explanation": f"Operating {daily_hours} hrs/day over {operating_days} days determines operational duty factor."
            },
            {
                "input_factor": "Floors & Vertical Infrastructure",
                "influence_pct": pumping_pct,
                "explanation": f"{floors} floors require elevator hoisting and water boosting contributing {pumping_pct}%."
            }
        ]

        # -----------------------------------------------------------------
        # 11. Targeted Energy-Saving Recommendations
        # -----------------------------------------------------------------
        tailored_recs = self._generate_tailored_recommendations(
            construction_type=construction_type,
            area=area,
            floors=floors,
            occupancy=occupancy,
            daily_hours=daily_hours,
            hvac_pct=hvac_pct,
            effective_rate=effective_tariff_rate,
            monthly_bill=monthly_bill_inr
        )

        # Carbon emissions (India grid emission factor = 0.716 kg CO2e / kWh)
        carbon_monthly_kg = round(total_monthly_kwh * 0.716, 1)
        tree_offsets = math.ceil(carbon_monthly_kg / 1.83)

        return {
            "summary": {
                "daily_kwh": total_daily_kwh,
                "monthly_kwh": total_monthly_kwh,
                "annual_kwh": annual_kwh,
                "avg_demand_kw": avg_demand_kw,
                "peak_load_kw": estimated_peak_load_kw,
                "connection_capacity_kva": recommended_capacity_kva,
                "estimated_monthly_bill_inr": monthly_bill_inr,
                "estimated_annual_bill_inr": annual_bill_inr,
                "effective_tariff_rate_inr": effective_tariff_rate,
                "total_connected_load_kw": total_connected_load_kw,
                "carbon_footprint_monthly_kg": carbon_monthly_kg,
                "tree_offsets_monthly": tree_offsets
            },
            "inputs_echo": {
                "construction_type": construction_type,
                "built_up_area": area,
                "floors_count": floors,
                "occupancy": occupancy,
                "daily_operating_hours": daily_hours,
                "operating_days_per_month": operating_days,
                "ac_type": ac_type,
                "discom": discom,
                "tariff_category": tariff_cat
            },
            "category_breakdown": categories_list,
            "peak_demand": {
                "peak_window": archetype["peak_window"],
                "estimated_peak_kw": estimated_peak_load_kw,
                "hourly_curve": hourly_curve
            },
            "tariff_details": {
                "discom": discom,
                "category": tariff_cat,
                "total_bill_inr": monthly_bill_inr,
                "effective_rate_inr": effective_tariff_rate,
                "fixed_charges_inr": tariff_result.get("fixed_charge_applied", 0),
                "energy_charges_inr": tariff_result.get("energy_charges_total", 0),
                "tax_charges_inr": tariff_result.get("tax_amount", 0),
                "slab_breakdown": tariff_result.get("slabs_breakdown", [])
            },
            "sensitivity_drivers": sensitivity_drivers,
            "recommendations": tailored_recs,
            "assumptions": {
                "diversity_factor": diversity_factor,
                "power_factor": power_factor,
                "safety_margin": safety_margin,
                "base_w_per_sq_ft": archetype["base_w_per_sq_ft"],
                "cooling_sq_ft_per_ton": archetype["cooling_sq_ft_per_ton"],
                "ac_kw_per_ton": ac_spec["kw_per_ton"],
                "tariff_discom": discom,
                "tariff_category": tariff_cat,
                "is_default_assumptions": (
                    area == archetype["default_area"] and
                    floors == archetype["default_floors"] and
                    occupancy == archetype["default_occupancy"] and
                    daily_hours == archetype["default_hours"]
                )
            },
            "engineering_disclaimer": (
                "Engineering Estimation Disclosure: All predictions represent engineering simulation models synthesized from building physics, "
                "connected equipment duty-cycles, load diversity factors, and official DISCOM slab tariffs. "
                "These calculated values are distinct from measured meter telemetry and are intended for pre-construction sizing "
                "and cost planning."
            )
        }

    def _generate_tailored_recommendations(
        self,
        construction_type: str,
        area: float,
        floors: int,
        occupancy: int,
        daily_hours: float,
        hvac_pct: float,
        effective_rate: float,
        monthly_bill: float
    ) -> List[Dict[str, Any]]:
        """Generates construction-type targeted energy conservation measures."""
        recs = []

        if hvac_pct > 35:
            recs.append({
                "title": "HVAC Temperature Deadband & VFD Upgrade",
                "category": "HVAC Optimization",
                "description": f"Adjust thermostat setpoint from 21°C to 24°C and implement variable refrigerant flow modulation. Reduces cooling consumption by 18%.",
                "estimated_monthly_inr_savings": round(monthly_bill * 0.12, 0),
                "payback_period_years": 0.8
            })

        if area > 10000:
            recs.append({
                "title": "Rooftop Solar PV Installation",
                "category": "Renewable Generation",
                "description": f"Install rooftop solar PV across available roof area (~{area * 0.4:,.0f} sq ft) to offset daytime grid energy charges.",
                "estimated_monthly_inr_savings": round(monthly_bill * 0.28, 0),
                "payback_period_years": 3.4
            })

        if floors > 3:
            recs.append({
                "title": "Regenerative Elevator Drives & Staggered Pumping",
                "category": "Vertical Transport",
                "description": f"Equip {floors} elevator risers with regenerative braking drives and schedule hydro-pneumatic tank refills during off-peak hours.",
                "estimated_monthly_inr_savings": round(monthly_bill * 0.06, 0),
                "payback_period_years": 1.5
            })

        recs.append({
            "title": "Smart Occupancy Sensors & Daylight Harvesting",
            "category": "Lighting & Control",
            "description": f"Install PIR occupancy sensors and smart dimming controls across corridors, meeting areas, and perimeter zones.",
            "estimated_monthly_inr_savings": round(monthly_bill * 0.08, 0),
            "payback_period_years": 1.1
        })

        if "Hospital" in construction_type or "Factory" in construction_type or "IT" in construction_type:
            recs.append({
                "title": "Automatic Power Factor Controller (APFC)",
                "category": "Grid Quality",
                "description": "Maintain power factor above 0.98 to avoid DISCOM low-PF penalties and reduce distribution transformer losses.",
                "estimated_monthly_inr_savings": round(monthly_bill * 0.05, 0),
                "payback_period_years": 0.5
            })

        return recs

facility_prediction = FacilityPredictionService()
