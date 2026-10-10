import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("Testing ElectroWise REST API endpoints...")
    # 1. Login with demo user
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "rajesh@example.com", "password": "Password@123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] User Authentication OK")

    # 2. Get Facility Catalog
    cat_res = requests.get(f"{BASE_URL}/api/projects/catalog", headers=headers)
    assert cat_res.status_code == 200
    cat_data = cat_res.json()
    assert len(cat_data["categories"]) >= 4
    print(f"[PASS] Facility Catalog OK: {len(cat_data['categories'])} categories")

    # 3. Get Verified DISCOMs
    discom_res = requests.get(f"{BASE_URL}/api/projects/tariffs/discoms", headers=headers)
    assert discom_res.status_code == 200
    discoms = discom_res.json()
    assert len(discoms) >= 4
    print(f"[PASS] DISCOM Tariffs OK: {len(discoms)} utilities")

    # 4. Seed Demo Projects
    seed_res = requests.post(f"{BASE_URL}/api/projects/demo/seed", headers=headers)
    assert seed_res.status_code == 200
    print("[PASS] Seeded Demo Projects OK:", seed_res.json())

    # 5. List Projects
    list_res = requests.get(f"{BASE_URL}/api/projects", headers=headers)
    assert list_res.status_code == 200
    projects = list_res.json()
    assert len(projects) >= 1
    target_id = projects[0]["id"]
    print(f"[PASS] Projects List OK: {len(projects)} projects, first is '{projects[0]['name']}' (ID: {target_id})")

    # 6. Execute Full Project Calculation
    calc_res = requests.post(f"{BASE_URL}/api/projects/{target_id}/calculate", json={}, headers=headers)
    assert calc_res.status_code == 200, f"Calc failed: {calc_res.text}"
    cdata = calc_res.json()
    assert cdata["equipment_analysis"]["summary"]["total_monthly_kwh"] > 0
    assert cdata["tariff_analysis"]["total_estimated_monthly_bill"] > 0
    assert cdata["construction_analysis"]["summary"]["suggested_connection_capacity_kva"] >= 0
    assert len(cdata["recommendations"]) > 0
    print(f"[PASS] Project Calculation OK: Monthly = {cdata['equipment_analysis']['summary']['total_monthly_kwh']} kWh, Bill = Rs. {cdata['tariff_analysis']['total_estimated_monthly_bill']}, Temp Connection = {cdata['construction_analysis']['summary']['suggested_connection_capacity_kva']} kVA")

    # Also test project with construction equipment (e.g. Hospital project)
    hosp_proj = next((p for p in projects if "Hospital" in p["name"]), None)
    if hosp_proj:
        hosp_calc = requests.post(f"{BASE_URL}/api/projects/{hosp_proj['id']}/calculate", json={}, headers=headers)
        assert hosp_calc.status_code == 200
        assert hosp_calc.json()["construction_analysis"]["summary"]["suggested_connection_capacity_kva"] > 0
        print(f"[PASS] Construction Sizing Verified on Hospital Project: {hosp_calc.json()['construction_analysis']['summary']['suggested_connection_capacity_kva']} kVA")

    # 7. Download PDF Audit Report
    pdf_res = requests.post(f"{BASE_URL}/api/projects/{target_id}/report/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert len(pdf_res.content) > 1000
    print(f"[PASS] PDF Audit Report Download OK: {len(pdf_res.content)} bytes")

    # 8. Export Equipment CSV
    csv_res = requests.get(f"{BASE_URL}/api/projects/{target_id}/export/csv", headers=headers)
    assert csv_res.status_code == 200
    assert "Rated Power" in csv_res.text
    print(f"[PASS] CSV Export OK: {len(csv_res.text)} characters")

    # 9. Duplicate Scenario
    scenario_id = cdata["active_scenario"]["id"]
    dup_res = requests.post(f"{BASE_URL}/api/projects/scenarios/{scenario_id}/duplicate", headers=headers)
    assert dup_res.status_code == 200
    print(f"[PASS] Scenario Duplication OK: Created copy '{dup_res.json()['name']}'")

    print("\nALL ELECTROWISE REST API INTEGRATION TESTS PASSED 100%!")

if __name__ == "__main__":
    test_api()
