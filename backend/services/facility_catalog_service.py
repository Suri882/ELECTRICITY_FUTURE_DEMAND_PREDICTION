from typing import Dict, List, Any

class FacilityCatalogService:
    """
    Catalog of facility classifications, subtype metadata,
    facility-specific parameter schemas, benchmark equipment packages,
    and equipment libraries with efficient alternatives.
    """

    CATEGORIES = {
        "Residential": [
            "Independent house",
            "Villa",
            "Apartment building",
            "Residential complex",
            "Hostel",
            "Paying guest accommodation"
        ],
        "Commercial": [
            "Office building",
            "IT park",
            "Shopping mall",
            "Hotel and resort",
            "Restaurant",
            "Cinema theatre",
            "Supermarket",
            "Warehouse",
            "Convention center"
        ],
        "Public and Institutional": [
            "School",
            "College and university",
            "Hospital",
            "Clinic",
            "Government office",
            "Railway station",
            "Bus terminal",
            "Airport",
            "Library",
            "Sports stadium"
        ],
        "Industrial and Infrastructure": [
            "Manufacturing factory",
            "Textile factory",
            "Food processing plant",
            "Cold storage facility",
            "Data center",
            "Workshop",
            "Construction site",
            "Water treatment plant",
            "Pumping station",
            "EV charging station",
            "Agricultural facility",
            "Custom facility"
        ]
    }

    # Facility-specific parameters definitions
    FACILITY_SPECIFIC_FIELDS = {
        "Independent house": [
            {"id": "bedrooms", "label": "Bedrooms", "type": "number", "default": 3},
            {"id": "bathrooms", "label": "Bathrooms", "type": "number", "default": 3},
            {"id": "kitchens", "label": "Kitchens", "type": "number", "default": 1},
            {"id": "residents", "label": "Number of Residents", "type": "number", "default": 4},
            {"id": "has_ev", "label": "EV Charging at Home", "type": "boolean", "default": False},
        ],
        "Villa": [
            {"id": "bedrooms", "label": "Bedrooms", "type": "number", "default": 4},
            {"id": "bathrooms", "label": "Bathrooms", "type": "number", "default": 5},
            {"id": "has_pool", "label": "Private Swimming Pool Pump", "type": "boolean", "default": True},
            {"id": "has_lawn", "label": "Landscape Irrigation Pump", "type": "boolean", "default": True},
            {"id": "residents", "label": "Number of Residents", "type": "number", "default": 5},
        ],
        "Apartment building": [
            {"id": "units_count", "label": "Total Apartment Units", "type": "number", "default": 24},
            {"id": "elevators_count", "label": "Elevators / Lifts", "type": "number", "default": 2},
            {"id": "common_area_lighting", "label": "Common Area Corridors (Floors)", "type": "number", "default": 6},
            {"id": "clubhouse", "label": "Clubhouse & Gym Included", "type": "boolean", "default": True},
        ],
        "Residential complex": [
            {"id": "total_blocks", "label": "Residential Towers / Blocks", "type": "number", "default": 4},
            {"id": "total_units", "label": "Total Flats / Units", "type": "number", "default": 120},
            {"id": "elevators_count", "label": "Total Elevators", "type": "number", "default": 8},
            {"id": "water_stp_plant", "label": "Sewage Treatment Plant (STP)", "type": "boolean", "default": True},
        ],
        "Hostel": [
            {"id": "rooms_count", "label": "Hostel Rooms", "type": "number", "default": 60},
            {"id": "students_count", "label": "Student Occupancy", "type": "number", "default": 120},
            {"id": "mess_kitchen", "label": "Central Dining & Mess Kitchen", "type": "boolean", "default": True},
            {"id": "water_heaters_central", "label": "Commercial Solar/Geyser System", "type": "boolean", "default": True},
        ],
        "Paying guest accommodation": [
            {"id": "rooms_count", "label": "PG Rooms", "type": "number", "default": 15},
            {"id": "beds_count", "label": "Total Beds", "type": "number", "default": 30},
            {"id": "shared_kitchen", "label": "Shared Induction Kitchen", "type": "boolean", "default": True},
        ],
        "Hospital": [
            {"id": "beds_count", "label": "Hospital Bed Capacity", "type": "number", "default": 100},
            {"id": "icu_beds", "label": "ICU Beds", "type": "number", "default": 15},
            {"id": "operating_theatres", "label": "Operation Theatres (OT)", "type": "number", "default": 4},
            {"id": "diagnostic_imaging", "label": "MRI & CT Diagnostic Center", "type": "boolean", "default": True},
            {"id": "central_hvac", "label": "24x7 Clean Room / Central Chiller HVAC", "type": "boolean", "default": True},
            {"id": "backup_dg_kva", "label": "Backup DG Set Capacity (kVA)", "type": "number", "default": 250},
        ],
        "Clinic": [
            {"id": "consultation_rooms", "label": "Consultation Rooms", "type": "number", "default": 4},
            {"id": "has_xray", "label": "Digital X-Ray / Dental Chair", "type": "boolean", "default": True},
            {"id": "daycare_beds", "label": "Observation Beds", "type": "number", "default": 4},
        ],
        "School": [
            {"id": "classrooms_count", "label": "Classrooms", "type": "number", "default": 20},
            {"id": "computer_labs", "label": "Computer Labs", "type": "number", "default": 2},
            {"id": "auditorium", "label": "Auditorium / Multipurpose Hall", "type": "boolean", "default": True},
            {"id": "working_hours_day", "label": "School Operating Hours", "type": "number", "default": 8},
        ],
        "College and university": [
            {"id": "departments", "label": "Academic Departments", "type": "number", "default": 6},
            {"id": "computer_labs", "label": "Computer Labs & Servers", "type": "number", "default": 8},
            {"id": "engineering_workshops", "label": "Heavy Engineering Labs & Machines", "type": "boolean", "default": True},
            {"id": "student_strength", "label": "Campus Student Population", "type": "number", "default": 1500},
        ],
        "Office building": [
            {"id": "workstations", "label": "Workstations / Desks", "type": "number", "default": 150},
            {"id": "meeting_rooms", "label": "Conference & Meeting Rooms", "type": "number", "default": 6},
            {"id": "server_room_kw", "label": "Server Room IT Load (kW)", "type": "number", "default": 15},
            {"id": "cafeteria", "label": "Cafeteria / Pantry Equipment", "type": "boolean", "default": True},
        ],
        "IT park": [
            {"id": "total_seats", "label": "Seating Capacity", "type": "number", "default": 1200},
            {"id": "server_racks", "label": "Data Center Server Racks", "type": "number", "default": 20},
            {"id": "chiller_capacity_tr", "label": "Central Chiller Capacity (TR)", "type": "number", "default": 400},
            {"id": "target_uptime_pct", "label": "Target Tier Uptime (%)", "type": "number", "default": 99.98},
        ],
        "Shopping mall": [
            {"id": "retail_shops", "label": "Retail Stores", "type": "number", "default": 50},
            {"id": "anchor_supermarkets", "label": "Anchor Supermarkets / Dept Stores", "type": "number", "default": 2},
            {"id": "food_court_kitchens", "label": "Food Court Kitchen Stalls", "type": "number", "default": 12},
            {"id": "escalators_count", "label": "Escalators", "type": "number", "default": 8},
            {"id": "elevators_count", "label": "Elevators", "type": "number", "default": 4},
            {"id": "cinema_multiplex", "label": "Cinema Multiplex Attached", "type": "boolean", "default": True},
        ],
        "Hotel and resort": [
            {"id": "guest_rooms", "label": "Guest Rooms", "type": "number", "default": 80},
            {"id": "occupancy_avg_pct", "label": "Average Occupancy Rate (%)", "type": "number", "default": 75},
            {"id": "banquet_halls", "label": "Banquet Halls", "type": "number", "default": 2},
            {"id": "commercial_laundry", "label": "In-House Commercial Laundry", "type": "boolean", "default": True},
            {"id": "commercial_kitchen", "label": "24/7 Multi-Cuisine Kitchen", "type": "boolean", "default": True},
        ],
        "Restaurant": [
            {"id": "dining_covers", "label": "Seating Covers", "type": "number", "default": 80},
            {"id": "kitchen_fryers_ovens", "label": "Commercial Electric Fryers & Ovens", "type": "number", "default": 4},
            {"id": "exhaust_blowers_kw", "label": "Kitchen Exhaust Blowers (kW)", "type": "number", "default": 7.5},
            {"id": "cold_storage_chillers", "label": "Walk-In Freezers & Chillers", "type": "number", "default": 2},
        ],
        "Manufacturing factory": [
            {"id": "production_shifts", "label": "Daily Production Shifts (8 hr each)", "type": "number", "default": 2},
            {"id": "connected_motor_load_kw", "label": "Total Connected Motor Load (kW)", "type": "number", "default": 120},
            {"id": "air_compressor_cfm", "label": "Compressed Air System (CFM)", "type": "number", "default": 150},
            {"id": "motor_efficiency_class", "label": "Standard Motor Efficiency Class", "type": "select", "options": ["IE1 Standard", "IE2 High", "IE3 Premium", "IE4 Super Premium"], "default": "IE2 High"},
        ],
        "Textile factory": [
            {"id": "weaving_looms", "label": "Looms / Spinning Frames", "type": "number", "default": 24},
            {"id": "humidification_plants", "label": "Humidification Plant Fans (kW)", "type": "number", "default": 45},
            {"id": "dyeing_boilers_electric", "label": "Electric Steam Heating (kW)", "type": "number", "default": 30},
            {"id": "production_shifts", "label": "Production Shifts (24 hr operation)", "type": "number", "default": 3},
        ],
        "Cold storage facility": [
            {"id": "storage_capacity_tons", "label": "Cold Storage Metric Tons", "type": "number", "default": 500},
            {"id": "target_temp_celsius", "label": "Storage Chamber Target Temp (°C)", "type": "number", "default": -18},
            {"id": "compressor_racks", "label": "Ammonia / Freon Compressor Racks (kW)", "type": "number", "default": 90},
            {"id": "blast_freezing", "label": "Blast Freezing Tunnel Included", "type": "boolean", "default": True},
        ],
        "Data center": [
            {"id": "it_critical_load_kw", "label": "IT Equipment Server Load (kW)", "type": "number", "default": 100},
            {"id": "design_pue", "label": "Target Power Usage Effectiveness (PUE)", "type": "number", "default": 1.45},
            {"id": "ups_efficiency_pct", "label": "Online Double-Conversion UPS Efficiency (%)", "type": "number", "default": 94},
            {"id": "cooling_redundancy", "label": "Cooling Architecture Redundancy", "type": "select", "options": ["N+1 Redundant", "2N Concurrent Maintainable", "N Base"], "default": "N+1 Redundant"},
        ],
        "Construction site": [
            {"id": "tower_cranes", "label": "Tower Cranes / Hoists", "type": "number", "default": 2},
            {"id": "concrete_batching_plant", "label": "On-Site Batching Plant (kW)", "type": "number", "default": 45},
            {"id": "welding_stations", "label": "Electric Arc Welding Sets", "type": "number", "default": 6},
            {"id": "dewatering_pumps", "label": "Submersible Dewatering Pumps", "type": "number", "default": 3},
            {"id": "project_duration_months", "label": "Estimated Construction Months", "type": "number", "default": 18},
        ],
        "EV charging station": [
            {"id": "dc_fast_chargers_60kw", "label": "60 kW Dual-Gun DC Fast Chargers", "type": "number", "default": 4},
            {"id": "ac_type2_chargers_22kw", "label": "22 kW AC Type-2 Chargers", "type": "number", "default": 4},
            {"id": "solar_canopy_kw", "label": "Solar Canopy Integration (kW)", "type": "number", "default": 25},
            {"id": "bess_storage_kwh", "label": "Battery Energy Storage Buffer (kWh)", "type": "number", "default": 100},
        ],
        "Warehouse": [
            {"id": "high_bay_fixtures", "label": "High-Bay LED Racks (Fixtures)", "type": "number", "default": 60},
            {"id": "electric_forklifts", "label": "Electric Forklift Charging Stations", "type": "number", "default": 4},
            {"id": "cold_storage_section", "label": "Cold Storage Refrigeration Section", "type": "boolean", "default": False},
            {"id": "loading_docks_motorized", "label": "Motorized Dock Levelers & Shutters", "type": "number", "default": 6},
        ],
        "Other Commercial Building": [
            {"id": "commercial_activity", "label": "Primary Commercial Function", "type": "text", "default": "Retail Showroom & Customer Service"},
            {"id": "customer_footfall_daily", "label": "Expected Daily Footfall", "type": "number", "default": 150},
            {"id": "hvac_type", "label": "Primary Air Conditioning Type", "type": "text", "default": "Inverter Multi-Split Cassette"},
        ],
        "Custom facility": [
            {"id": "custom_description", "label": "Specialized Machinery / Operational Description", "type": "text", "default": "Specialized Industrial / Commercial Installation"},
            {"id": "custom_peak_kw", "label": "Estimated Coincident Peak Power (kW)", "type": "number", "default": 25.0},
        ]
    }

    # Aliases for 11 core construction types
    FACILITY_SPECIFIC_FIELDS["Residential House"] = FACILITY_SPECIFIC_FIELDS["Independent house"]
    FACILITY_SPECIFIC_FIELDS["Apartment / Residential Complex"] = FACILITY_SPECIFIC_FIELDS["Apartment building"]
    FACILITY_SPECIFIC_FIELDS["College / School"] = FACILITY_SPECIFIC_FIELDS["School"]
    FACILITY_SPECIFIC_FIELDS["Office Building"] = FACILITY_SPECIFIC_FIELDS["Office building"]
    FACILITY_SPECIFIC_FIELDS["Shopping Mall"] = FACILITY_SPECIFIC_FIELDS["Shopping mall"]
    FACILITY_SPECIFIC_FIELDS["Hotel"] = FACILITY_SPECIFIC_FIELDS["Hotel and resort"]
    FACILITY_SPECIFIC_FIELDS["Factory / Industrial Building"] = FACILITY_SPECIFIC_FIELDS["Manufacturing factory"]
    FACILITY_SPECIFIC_FIELDS["IT Park"] = FACILITY_SPECIFIC_FIELDS["IT park"]
    FACILITY_SPECIFIC_FIELDS["Warehouse"] = FACILITY_SPECIFIC_FIELDS["Warehouse"]
    FACILITY_SPECIFIC_FIELDS["Other Commercial Building"] = FACILITY_SPECIFIC_FIELDS["Other Commercial Building"]


    # Pre-populated benchmark equipment libraries for each subtype
    BENCHMARK_EQUIPMENT = {
        "Residential": [
            {
                "category": "HVAC",
                "name": "1.5 Ton 3-Star Split AC",
                "brand_model": "Standard Inverter",
                "quantity": 2,
                "rated_power_w": 1450.0,
                "operating_load_pct": 75.0,
                "daily_hours": 8.0,
                "monthly_days": 30,
                "efficiency_pct": 85.0,
                "unit_purchase_cost": 36000.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "1.5 Ton 5-Star Dual Inverter AC",
                "efficient_alternative_watts": 980.0,
                "efficient_alternative_cost": 44000.0
            },
            {
                "category": "Refrigeration",
                "name": "260L Double Door Refrigerator",
                "brand_model": "Frost Free 3-Star",
                "quantity": 1,
                "rated_power_w": 220.0,
                "operating_load_pct": 60.0,
                "daily_hours": 24.0,
                "monthly_days": 30,
                "efficiency_pct": 80.0,
                "unit_purchase_cost": 24000.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "5-Star Smart Inverter Refrigerator",
                "efficient_alternative_watts": 130.0,
                "efficient_alternative_cost": 29000.0
            },
            {
                "category": "Ventilation",
                "name": "Standard Induction Ceiling Fan",
                "brand_model": "1200mm Conventional",
                "quantity": 5,
                "rated_power_w": 75.0,
                "operating_load_pct": 90.0,
                "daily_hours": 12.0,
                "monthly_days": 30,
                "efficiency_pct": 70.0,
                "unit_purchase_cost": 1800.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "BLDC Smart Remote Ceiling Fan (5-Star)",
                "efficient_alternative_watts": 28.0,
                "efficient_alternative_cost": 3200.0
            },
            {
                "category": "Lighting",
                "name": "CFL / Fluorescent Fixtures",
                "brand_model": "36W Tube Lights",
                "quantity": 8,
                "rated_power_w": 36.0,
                "operating_load_pct": 100.0,
                "daily_hours": 6.0,
                "monthly_days": 30,
                "efficiency_pct": 65.0,
                "unit_purchase_cost": 350.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "High Lumen LED Batten",
                "efficient_alternative_watts": 18.0,
                "efficient_alternative_cost": 450.0
            },
            {
                "category": "Water Heating",
                "name": "25L Storage Electric Geyser",
                "brand_model": "Conventional Element",
                "quantity": 2,
                "rated_power_w": 2000.0,
                "operating_load_pct": 100.0,
                "daily_hours": 1.5,
                "monthly_days": 30,
                "efficiency_pct": 75.0,
                "unit_purchase_cost": 8500.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "5-Star Glasslined Geyser / Solar Hybrid",
                "efficient_alternative_watts": 1200.0,
                "efficient_alternative_cost": 14000.0
            },
            {
                "category": "Pumping",
                "name": "1.0 HP Domestic Water Pump",
                "brand_model": "Monoblock Induction",
                "quantity": 1,
                "rated_power_w": 750.0,
                "operating_load_pct": 85.0,
                "daily_hours": 1.0,
                "monthly_days": 30,
                "efficiency_pct": 72.0,
                "unit_purchase_cost": 6500.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "Energy Efficient Regenerative Pump (BEE 5-Star)",
                "efficient_alternative_watts": 550.0,
                "efficient_alternative_cost": 8800.0
            }
        ],
        "Hospital": [
            {
                "category": "HVAC",
                "name": "Central Clean Room Chiller HVAC",
                "brand_model": "Air-Cooled Screw Chiller",
                "quantity": 2,
                "rated_power_w": 45000.0,
                "operating_load_pct": 75.0,
                "daily_hours": 24.0,
                "monthly_days": 30,
                "efficiency_pct": 85.0,
                "unit_purchase_cost": 1800000.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "Magnetic Bearing Centrifugal Chiller with VFD",
                "efficient_alternative_watts": 32000.0,
                "efficient_alternative_cost": 2400000.0
            },
            {
                "category": "Medical Equipment",
                "name": "CT Scanner & Imaging Suite",
                "brand_model": "128-Slice Multi-Detector",
                "quantity": 1,
                "rated_power_w": 50000.0,
                "operating_load_pct": 40.0,
                "daily_hours": 12.0,
                "monthly_days": 30,
                "efficiency_pct": 90.0,
                "unit_purchase_cost": 15000000.0,
                "is_energy_efficient": True,
                "efficient_alternative_name": "Eco-Mode Low Dose Smart CT",
                "efficient_alternative_watts": 38000.0,
                "efficient_alternative_cost": 17000000.0
            },
            {
                "category": "Life Support",
                "name": "ICU Ventilators & Monitors",
                "brand_model": "Critical Care Units",
                "quantity": 15,
                "rated_power_w": 250.0,
                "operating_load_pct": 90.0,
                "daily_hours": 24.0,
                "monthly_days": 30,
                "efficiency_pct": 95.0,
                "unit_purchase_cost": 450000.0,
                "is_energy_efficient": True,
                "efficient_alternative_name": "Low-Power Smart ICU Station",
                "efficient_alternative_watts": 180.0,
                "efficient_alternative_cost": 520000.0
            },
            {
                "category": "Elevators",
                "name": "Hospital Bed Elevators",
                "brand_model": "Traction Lift 15-Passenger",
                "quantity": 3,
                "rated_power_w": 11000.0,
                "operating_load_pct": 65.0,
                "daily_hours": 16.0,
                "monthly_days": 30,
                "efficiency_pct": 82.0,
                "unit_purchase_cost": 1200000.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "Regenerative Drive Gearless PMSM Elevator",
                "efficient_alternative_watts": 7500.0,
                "efficient_alternative_cost": 1500000.0
            },
            {
                "category": "Lighting",
                "name": "Surgical OT Lighting & Hospital LED",
                "brand_model": "Medical Grade Luminaires",
                "quantity": 80,
                "rated_power_w": 40.0,
                "operating_load_pct": 90.0,
                "daily_hours": 20.0,
                "monthly_days": 30,
                "efficiency_pct": 92.0,
                "unit_purchase_cost": 2200.0,
                "is_energy_efficient": True,
                "efficient_alternative_name": "High-CRI Motion-Sensed LED Panel",
                "efficient_alternative_watts": 28.0,
                "efficient_alternative_cost": 2800.0
            }
        ],
        "Office building": [
            {
                "category": "HVAC",
                "name": "Commercial VRF / VRV System",
                "brand_model": "Outdoor Multi-Split Modular",
                "quantity": 4,
                "rated_power_w": 18000.0,
                "operating_load_pct": 70.0,
                "daily_hours": 10.0,
                "monthly_days": 24,
                "efficiency_pct": 88.0,
                "unit_purchase_cost": 450000.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "Top-Tier High-COP Inverter VRV IV with AI Scheduling",
                "efficient_alternative_watts": 13500.0,
                "efficient_alternative_cost": 550000.0
            },
            {
                "category": "IT Equipment",
                "name": "Corporate Workstations & Monitors",
                "brand_model": "Dual-Monitor Business Desktops",
                "quantity": 120,
                "rated_power_w": 180.0,
                "operating_load_pct": 65.0,
                "daily_hours": 9.0,
                "monthly_days": 22,
                "efficiency_pct": 85.0,
                "unit_purchase_cost": 55000.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "Energy Star Mini PC + USB-C Eco Monitors",
                "efficient_alternative_watts": 85.0,
                "efficient_alternative_cost": 62000.0
            },
            {
                "category": "IT Equipment",
                "name": "Server Room Racks & Core Switches",
                "brand_model": "2U Enterprise Blade Servers",
                "quantity": 4,
                "rated_power_w": 3500.0,
                "operating_load_pct": 80.0,
                "daily_hours": 24.0,
                "monthly_days": 30,
                "efficiency_pct": 92.0,
                "unit_purchase_cost": 420000.0,
                "is_energy_efficient": True,
                "efficient_alternative_name": "Titanium Rated High-Density Server Racks",
                "efficient_alternative_watts": 2800.0,
                "efficient_alternative_cost": 500000.0
            },
            {
                "category": "Lighting",
                "name": "Office Grid 2x2 LED Troffers",
                "brand_model": "Recessed Panels",
                "quantity": 90,
                "rated_power_w": 36.0,
                "operating_load_pct": 100.0,
                "daily_hours": 10.0,
                "monthly_days": 24,
                "efficiency_pct": 90.0,
                "unit_purchase_cost": 1400.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "Dimmable Daylight-Harvesting Smart LED",
                "efficient_alternative_watts": 22.0,
                "efficient_alternative_cost": 2100.0
            }
        ],
        "Manufacturing factory": [
            {
                "category": "Industrial Motors",
                "name": "Heavy Induction Motor (30 kW)",
                "brand_model": "IE2 High Efficiency Motor",
                "quantity": 3,
                "rated_power_w": 30000.0,
                "operating_load_pct": 80.0,
                "daily_hours": 16.0,
                "monthly_days": 26,
                "efficiency_pct": 91.5,
                "unit_purchase_cost": 145000.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "IE4 Super Premium Motor with Variable Frequency Drive (VFD)",
                "efficient_alternative_watts": 25500.0,
                "efficient_alternative_cost": 210000.0
            },
            {
                "category": "Compressed Air",
                "name": "Rotary Screw Air Compressor (50 HP)",
                "brand_model": "Fixed Speed Oil-Injected",
                "quantity": 1,
                "rated_power_w": 37000.0,
                "operating_load_pct": 85.0,
                "daily_hours": 16.0,
                "monthly_days": 26,
                "efficiency_pct": 86.0,
                "unit_purchase_cost": 650000.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "Variable Speed Drive (VSD) Permanent Magnet Compressor",
                "efficient_alternative_watts": 28000.0,
                "efficient_alternative_cost": 880000.0
            },
            {
                "category": "Fabrication",
                "name": "Industrial MIG / ARC Welding Units",
                "brand_model": "400A Transformer Rectifier",
                "quantity": 4,
                "rated_power_w": 12000.0,
                "operating_load_pct": 60.0,
                "daily_hours": 8.0,
                "monthly_days": 26,
                "efficiency_pct": 78.0,
                "unit_purchase_cost": 55000.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "IGBT Inverter Multi-Process Welder",
                "efficient_alternative_watts": 8500.0,
                "efficient_alternative_cost": 82000.0
            },
            {
                "category": "Industrial Lighting",
                "name": "High-Bay Metal Halide / Fluorescent",
                "brand_model": "250W Conventional Bay",
                "quantity": 25,
                "rated_power_w": 250.0,
                "operating_load_pct": 100.0,
                "daily_hours": 16.0,
                "monthly_days": 26,
                "efficiency_pct": 70.0,
                "unit_purchase_cost": 3200.0,
                "is_energy_efficient": False,
                "efficient_alternative_name": "120W Industrial UFO LED High Bay",
                "efficient_alternative_watts": 120.0,
                "efficient_alternative_cost": 4800.0
            }
        ]
    }

    # Standard temporary construction phase equipment template
    CONSTRUCTION_DEFAULT_EQUIPMENT = [
        {
            "phase_name": "Excavation & Earthwork",
            "equipment_name": "Diesel-Electric Dewatering Pump",
            "rated_power_kw": 5.5,
            "quantity": 2,
            "operating_load_pct": 75.0,
            "hours_per_day": 8.0,
            "days_per_month": 25,
            "duration_months": 2.0,
            "efficiency_pct": 82.0
        },
        {
            "phase_name": "Foundation & Piling",
            "equipment_name": "Bored Piling Rig & Slurry Pump",
            "rated_power_kw": 22.0,
            "quantity": 1,
            "operating_load_pct": 80.0,
            "hours_per_day": 6.0,
            "days_per_month": 25,
            "duration_months": 2.5,
            "efficiency_pct": 85.0
        },
        {
            "phase_name": "Structural & RCC",
            "equipment_name": "Reversible Concrete Batch Mixer",
            "rated_power_kw": 7.5,
            "quantity": 2,
            "operating_load_pct": 70.0,
            "hours_per_day": 6.0,
            "days_per_month": 26,
            "duration_months": 5.0,
            "efficiency_pct": 84.0
        },
        {
            "phase_name": "Structural & RCC",
            "equipment_name": "High-Frequency Concrete Vibrators",
            "rated_power_kw": 1.5,
            "quantity": 4,
            "operating_load_pct": 65.0,
            "hours_per_day": 4.0,
            "days_per_month": 20,
            "duration_months": 5.0,
            "efficiency_pct": 80.0
        },
        {
            "phase_name": "Material Handling",
            "equipment_name": "Construction Hoist / Builder Lift",
            "rated_power_kw": 11.0,
            "quantity": 1,
            "operating_load_pct": 60.0,
            "hours_per_day": 8.0,
            "days_per_month": 26,
            "duration_months": 6.0,
            "efficiency_pct": 86.0
        },
        {
            "phase_name": "Welding & Fabrication",
            "equipment_name": "Structural Arc Welding Units",
            "rated_power_kw": 9.0,
            "quantity": 3,
            "operating_load_pct": 55.0,
            "hours_per_day": 6.0,
            "days_per_month": 24,
            "duration_months": 4.0,
            "efficiency_pct": 82.0
        },
        {
            "phase_name": "Finishing & Masonry",
            "equipment_name": "Plastering Machine & Mortar Spray",
            "rated_power_kw": 4.0,
            "quantity": 1,
            "operating_load_pct": 65.0,
            "hours_per_day": 5.0,
            "days_per_month": 25,
            "duration_months": 3.0,
            "efficiency_pct": 85.0
        },
        {
            "phase_name": "Site Camp & Night Works",
            "equipment_name": "Temporary Site Floodlighting (LED Masts)",
            "rated_power_kw": 3.0,
            "quantity": 1,
            "operating_load_pct": 100.0,
            "hours_per_day": 10.0,
            "days_per_month": 30,
            "duration_months": 8.0,
            "efficiency_pct": 92.0
        }
    ]

    def get_all_categories(self) -> Dict[str, List[str]]:
        return self.CATEGORIES

    def get_facility_specific_fields(self, subtype: str) -> List[Dict[str, Any]]:
        return self.FACILITY_SPECIFIC_FIELDS.get(subtype, self.FACILITY_SPECIFIC_FIELDS["Custom facility"])

    def get_benchmark_equipment(self, category: str) -> List[Dict[str, Any]]:
        if category in self.BENCHMARK_EQUIPMENT:
            return self.BENCHMARK_EQUIPMENT[category]
        elif "Residential" in category:
            return self.BENCHMARK_EQUIPMENT["Residential"]
        elif "Hospital" in category:
            return self.BENCHMARK_EQUIPMENT["Hospital"]
        elif "Industrial" in category or "Manufacturing" in category:
            return self.BENCHMARK_EQUIPMENT["Manufacturing factory"]
        return self.BENCHMARK_EQUIPMENT["Office building"]

    def get_default_construction_equipment(self) -> List[Dict[str, Any]]:
        return self.CONSTRUCTION_DEFAULT_EQUIPMENT

facility_catalog = FacilityCatalogService()
