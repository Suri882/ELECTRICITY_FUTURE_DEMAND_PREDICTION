import os
import sys
from datetime import date
from backend.database import SessionLocal, Base, engine
from backend.models.user import User, UserRole, ConsumerType
from backend.models.project import Project, PlanningScenario, EquipmentItem, ConstructionEquipmentItem
from backend.services.facility_catalog_service import facility_catalog
from backend.services.tariff_engine_service import tariff_engine
from backend.services.construction_calc_service import construction_calc
from backend.services.equipment_intelligence_service import equipment_intelligence
from backend.services.solar_storage_service import solar_storage
from backend.services.ev_charging_service import ev_charging_service
from backend.services.recommendations_engine_service import recommendations_engine
from backend.services.scenario_comparison_service import scenario_comparison
from backend.services.electrowise_report_service import electrowise_report_service
from backend.services.demo_project_service import demo_project_service

def run_tests():
    print("==================================================")
    print("RUNNING ELECTROWISE CORE BACKEND TEST SUITE")
    print("==================================================")

    # 1. Facility Catalog Test
    cats = facility_catalog.get_all_categories()
    assert len(cats) >= 4, "Expected at least 4 major categories"
    assert "Residential" in cats and "Commercial" in cats and "Industrial and Infrastructure" in cats
    total_subtypes = sum(len(sub) for sub in cats.values())
    print(f"[PASS] Facility Catalog Verified: {len(cats)} Categories, {total_subtypes} Subtypes")

    # 2. Tariff Engine Multi-Slab Test (BESCOM & MSEDCL)
    bescom_bill = tariff_engine.calculate_bill(consumption_kwh=350.0, discom_code="BESCOM", category_name="Domestic LT-2", sanctioned_load_kw=4.0)
    assert bescom_bill["total_estimated_monthly_bill"] > 0
    assert len(bescom_bill["slab_breakdown"]) >= 3
    print(f"[PASS] BESCOM Slab Bill (350 kWh): Total = Rs. {bescom_bill['total_estimated_monthly_bill']}, Effective Rate = Rs. {bescom_bill['effective_rate_per_kwh']}/kWh")

    msedcl_bill = tariff_engine.calculate_bill(consumption_kwh=600.0, discom_code="MSEDCL", category_name="Domestic LT-1", sanctioned_load_kw=6.0)
    assert msedcl_bill["total_estimated_monthly_bill"] > 0
    assert len(msedcl_bill["slab_breakdown"]) >= 4
    print(f"[PASS] MSEDCL Slab Bill (600 kWh): Total = Rs. {msedcl_bill['total_estimated_monthly_bill']}, Effective Rate = Rs. {msedcl_bill['effective_rate_per_kwh']}/kWh")

    # 3. Construction Electricity Calculator Test
    sample_const_machines = facility_catalog.get_default_construction_equipment()
    const_res = construction_calc.calculate_construction_energy(sample_const_machines)
    assert const_res["summary"]["total_construction_kwh"] > 0
    assert const_res["summary"]["suggested_connection_capacity_kva"] > 0
    print(f"[PASS] Construction Calculator: Total Energy = {const_res['summary']['total_construction_kwh']} kWh, Budget = Rs. {const_res['summary']['total_construction_budget_inr']}, Suggested Sizing = {const_res['summary']['suggested_connection_capacity_kva']} kVA")

    # 4. Equipment Intelligence & TCO Test
    sample_eq = facility_catalog.get_benchmark_equipment("Hospital")
    eq_res = equipment_intelligence.analyze_equipment(sample_eq, tariff_rate=8.50)
    assert eq_res["summary"]["total_monthly_kwh"] > 0
    assert eq_res["summary"]["tco_5_years"] > 0
    assert len(eq_res["equipment_ranking"]) > 0
    print(f"[PASS] Equipment Intelligence: Monthly = {eq_res['summary']['total_monthly_kwh']} kWh, Peak = {eq_res['summary']['total_operational_peak_kw']} kW, 5-Yr TCO = Rs. {eq_res['summary']['tco_5_years']:,.2f}")

    # 5. Solar & Battery Storage Planner Test
    solar_res = solar_storage.calculate_solar_and_storage(
        daily_consumption_kwh=40.0,
        rooftop_area_sq_ft=1500.0,
        critical_load_kw=3.0,
        desired_backup_hours=4.0
    )
    assert solar_res["solar_sizing"]["suggested_solar_capacity_kw"] > 0
    assert solar_res["battery_storage_sizing"]["battery_amp_hours_48v"] > 0
    assert "scenario_3_solar_hybrid_battery" in solar_res["scenarios_comparison"]
    print(f"[PASS] Solar & Storage: Solar = {solar_res['solar_sizing']['suggested_solar_capacity_kw']} kW, BESS = {solar_res['battery_storage_sizing']['suggested_battery_capacity_kwh']} kWh ({solar_res['battery_storage_sizing']['battery_amp_hours_48v']} Ah @ 48V)")

    # 6. EV Charging Planner Test
    ev_res = ev_charging_service.calculate_ev_load([
        {"charger_label": "Wallbox 7.4 kW", "power_kw": 7.4, "chargers_count": 2, "daily_charging_hours": 6.0, "vehicles_per_day": 4, "simultaneous_pct": 75.0}
    ])
    assert ev_res["summary"]["monthly_charging_kwh"] > 0
    assert ev_res["summary"]["ev_coincident_peak_demand_kw"] > 0
    print(f"[PASS] EV Charging Planner: Monthly = {ev_res['summary']['monthly_charging_kwh']} kWh, Peak Demand = {ev_res['summary']['ev_coincident_peak_demand_kw']} kW")

    # 7. Actionable Recommendation Engine Test
    recs = recommendations_engine.generate_recommendations(sample_eq, tariff_rate=8.50, monthly_kwh_total=eq_res["summary"]["total_monthly_kwh"])
    assert len(recs) >= 2
    print(f"[PASS] Recommendations Engine: Generated {len(recs)} prioritized actions with payback calculations")

    # 8. Multi-Scenario Comparison Test
    scenarios_input = [
        {
            "id": 1,
            "name": "Standard Baseline",
            "equipment_summary": eq_res["summary"],
            "tariff_summary": {"total_estimated_monthly_bill": 125000.0},
            "solar_summary": {}
        },
        {
            "id": 2,
            "name": "Energy Efficient Plan",
            "equipment_summary": {**eq_res["summary"], "total_monthly_kwh": eq_res["summary"]["total_monthly_kwh"] * 0.75},
            "tariff_summary": {"total_estimated_monthly_bill": 93750.0},
            "solar_summary": {}
        }
    ]
    comp_res = scenario_comparison.compare_scenarios(scenarios_input, construction_cost=150000.0)
    assert len(comp_res["comparisons"]) == 2
    assert len(comp_res["chart_data"]) == 2
    print(f"[PASS] Multi-Scenario Comparison: Successfully compared {len(comp_res['comparisons'])} scenarios")

    # 9. PDF & CSV Report Generation Test
    dummy_proj = {
        "name": "Test Hospital Facility",
        "facility_category": "Public and Institutional",
        "facility_subtype": "Hospital",
        "project_phase": "Planning",
        "location": "Bengaluru",
        "state": "Karnataka",
        "built_up_area": 30000.0,
        "area_unit": "sq_ft",
        "floors_count": 4,
        "occupancy": 150,
        "connection_type": "HT Three Phase",
        "discom": "BESCOM",
        "tariff_category": "Commercial LT-3"
    }
    pdf_file = electrowise_report_service.generate_project_pdf(
        project_data=dummy_proj,
        scenario_data={"name": "Baseline Setup", "equipment_summary": eq_res},
        construction_calc_data=const_res,
        tariff_data=bescom_bill,
        solar_data=solar_res,
        recommendations=recs
    )
    assert os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 1000
    print(f"[PASS] ElectroWise PDF Audit Report Generated: {os.path.basename(pdf_file)} ({os.path.getsize(pdf_file):,} bytes)")

    csv_data = electrowise_report_service.export_equipment_csv(sample_eq)
    assert "Rated Power (Watts)" in csv_data
    print(f"[PASS] Equipment Inventory CSV Generated: {len(csv_data)} characters")

    # 10. Database Demo Seeding Test
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("[WARN] No user in DB to test demo project seeding")
        else:
            seed_count = demo_project_service.seed_demo_projects(db, user)
            assert seed_count >= 3
            print(f"[PASS] Demo Project Seeding Verified: {seed_count} Sample Projects Loaded for {user.email}")
    finally:
        db.close()

    print("\n>>> ALL ELECTROWISE BACKEND MODULES & SERVICES VERIFIED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    run_tests()
