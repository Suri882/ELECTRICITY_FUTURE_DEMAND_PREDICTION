import json
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models.user import User
from backend.models.project import Project, PlanningScenario, EquipmentItem, ConstructionEquipmentItem
from backend.services.facility_catalog_service import facility_catalog
from backend.services.tariff_engine_service import tariff_engine
from backend.services.construction_calc_service import construction_calc
from backend.services.equipment_intelligence_service import equipment_intelligence
from backend.services.solar_storage_service import solar_storage
from backend.services.ev_charging_service import ev_charging_service

class DemoProjectService:
    """
    Seeds and manages pre-configured sample projects for ElectroWise demonstration mode.
    Every project is explicitly flagged with `is_demo=True`.
    """

    def seed_demo_projects(self, db: Session, user: User) -> int:
        """Seeds realistic sample projects across residential, commercial, hospital, and industrial facilities."""
        # Check if demo projects already exist for this user
        existing = db.query(Project).filter(Project.user_id == user.id, Project.is_demo == True).count()
        if existing > 0:
            return existing

        # 1. Greenfield 100-Bed Multi-Speciality Hospital
        p1 = Project(
            user_id=user.id,
            name="Apex Metro 100-Bed Multi-Speciality Hospital (Demo)",
            facility_category="Public and Institutional",
            facility_subtype="Hospital",
            project_phase="Planning",
            location="Whitefield, Bengaluru",
            state="Karnataka",
            country="India",
            discom="BESCOM",
            tariff_category="Commercial LT-3",
            built_up_area=42000.0,
            area_unit="sq_ft",
            floors_count=5,
            occupancy=250,
            operating_days_per_month=30,
            daily_operating_hours=24.0,
            connection_type="HT Three Phase",
            budget_range="₹2,50,000 - ₹3,50,000 / month",
            target_completion_date="2027-03-31",
            is_demo=True
        )
        db.add(p1)
        db.flush()

        # Scenario 1: Baseline Equipment
        sc1 = PlanningScenario(
            project_id=p1.id,
            name="Standard Baseline Setup",
            description="Conventional commercial medical equipment & standard screw chiller HVAC",
            is_active=True
        )
        db.add(sc1)
        db.flush()

        eq_hospital = facility_catalog.get_benchmark_equipment("Hospital")
        for eq in eq_hospital:
            db.add(EquipmentItem(
                scenario_id=sc1.id,
                category=eq["category"],
                name=eq["name"],
                brand_model=eq.get("brand_model"),
                quantity=eq["quantity"],
                rated_power_w=eq["rated_power_w"],
                operating_load_pct=eq["operating_load_pct"],
                daily_hours=eq["daily_hours"],
                monthly_days=eq["monthly_days"],
                efficiency_pct=eq["efficiency_pct"],
                unit_purchase_cost=eq["unit_purchase_cost"],
                is_energy_efficient=eq["is_energy_efficient"],
                efficient_alternative_name=eq.get("efficient_alternative_name"),
                efficient_alternative_watts=eq.get("efficient_alternative_watts"),
                efficient_alternative_cost=eq.get("efficient_alternative_cost")
            ))

        # Add Construction items for Hospital
        const_defaults = facility_catalog.get_default_construction_equipment()
        for c in const_defaults:
            db.add(ConstructionEquipmentItem(
                project_id=p1.id,
                phase_name=c["phase_name"],
                equipment_name=c["equipment_name"],
                rated_power_kw=c["rated_power_kw"],
                quantity=c["quantity"],
                operating_load_pct=c["operating_load_pct"],
                hours_per_day=c["hours_per_day"],
                days_per_month=c["days_per_month"],
                duration_months=c["duration_months"],
                efficiency_pct=c["efficiency_pct"]
            ))

        # 2. Sunrise Luxury Villa Residence
        p2 = Project(
            user_id=user.id,
            name="Green Valley 4-BHK Luxury Villa (Demo)",
            facility_category="Residential",
            facility_subtype="Villa",
            project_phase="Planning",
            location="Sarjapur Road, Bengaluru",
            state="Karnataka",
            country="India",
            discom="BESCOM",
            tariff_category="Domestic LT-2",
            built_up_area=4500.0,
            area_unit="sq_ft",
            floors_count=2,
            occupancy=5,
            operating_days_per_month=30,
            daily_operating_hours=24.0,
            connection_type="3-Phase LT",
            budget_range="₹8,000 - ₹14,000 / month",
            target_completion_date="2026-11-30",
            is_demo=True
        )
        db.add(p2)
        db.flush()

        sc2 = PlanningScenario(
            project_id=p2.id,
            name="Solar + Inverter Efficiency Plan",
            description="5-Star Inverters, BLDC ceiling fans, heat pump geysers and 6 kW rooftop solar",
            is_active=True
        )
        db.add(sc2)
        db.flush()

        eq_res = facility_catalog.get_benchmark_equipment("Residential")
        for eq in eq_res:
            db.add(EquipmentItem(
                scenario_id=sc2.id,
                category=eq["category"],
                name=eq["name"],
                brand_model=eq.get("brand_model"),
                quantity=eq["quantity"],
                rated_power_w=eq["rated_power_w"],
                operating_load_pct=eq["operating_load_pct"],
                daily_hours=eq["daily_hours"],
                monthly_days=eq["monthly_days"],
                efficiency_pct=eq["efficiency_pct"],
                unit_purchase_cost=eq["unit_purchase_cost"],
                is_energy_efficient=eq["is_energy_efficient"],
                efficient_alternative_name=eq.get("efficient_alternative_name"),
                efficient_alternative_watts=eq.get("efficient_alternative_watts"),
                efficient_alternative_cost=eq.get("efficient_alternative_cost")
            ))

        # 3. Coimbatore Precision Textile Mills
        p3 = Project(
            user_id=user.id,
            name="Coimbatore Spinning & Weaving Mill (Demo)",
            facility_category="Industrial and Infrastructure",
            facility_subtype="Textile factory",
            project_phase="Existing Facility",
            location="Peelamedu, Coimbatore",
            state="Tamil Nadu",
            country="India",
            discom="TANGEDCO",
            tariff_category="Commercial LT-2B",
            built_up_area=35000.0,
            area_unit="sq_ft",
            floors_count=1,
            occupancy=45,
            operating_days_per_month=26,
            daily_operating_hours=24.0,
            connection_type="HT Industrial",
            budget_range="₹1,80,000 - ₹2,40,000 / month",
            target_completion_date="Operational",
            is_demo=True
        )
        db.add(p3)
        db.flush()

        sc3 = PlanningScenario(
            project_id=p3.id,
            name="Industrial Motors & Compressor VFD Plan",
            description="IE4 super premium induction motors, VFD air compressors, and LED high bays",
            is_active=True
        )
        db.add(sc3)
        db.flush()

        eq_mfg = facility_catalog.get_benchmark_equipment("Manufacturing factory")
        for eq in eq_mfg:
            db.add(EquipmentItem(
                scenario_id=sc3.id,
                category=eq["category"],
                name=eq["name"],
                brand_model=eq.get("brand_model"),
                quantity=eq["quantity"],
                rated_power_w=eq["rated_power_w"],
                operating_load_pct=eq["operating_load_pct"],
                daily_hours=eq["daily_hours"],
                monthly_days=eq["monthly_days"],
                efficiency_pct=eq["efficiency_pct"],
                unit_purchase_cost=eq["unit_purchase_cost"],
                is_energy_efficient=eq["is_energy_efficient"],
                efficient_alternative_name=eq.get("efficient_alternative_name"),
                efficient_alternative_watts=eq.get("efficient_alternative_watts"),
                efficient_alternative_cost=eq.get("efficient_alternative_cost")
            ))

        db.commit()
        return 3

    def clear_demo_projects(self, db: Session, user: User) -> int:
        count = db.query(Project).filter(Project.user_id == user.id, Project.is_demo == True).delete()
        db.commit()
        return count

demo_project_service = DemoProjectService()
