import requests
from datetime import date

BASE_URL = "http://127.0.0.1:8000"

def test_features():
    print("Testing upgraded features...")
    # 1. Login with demo user
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "rajesh@example.com", "password": "Password@123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Login verified")

    # 2. Demo mode status & load demo data
    demo_status = requests.get(f"{BASE_URL}/api/demo/status", headers=headers)
    assert demo_status.status_code == 200
    print("[PASS] Demo status:", demo_status.json())

    demo_load = requests.post(f"{BASE_URL}/api/demo/load", headers=headers)
    assert demo_load.status_code == 200
    print("[PASS] Loaded demo dataset:", demo_load.json()["records_loaded"], "records")

    # 3. Weather API
    w_res = requests.get(f"{BASE_URL}/api/weather/current", headers=headers)
    assert w_res.status_code == 200
    w_data = w_res.json()
    print(f"[PASS] Weather API: {w_data['current']['temperature']}°C ({w_data['current']['condition']}), Source: {w_data['data_source']}")

    w_analysis = requests.get(f"{BASE_URL}/api/weather/analysis", headers=headers)
    assert w_analysis.status_code == 200
    print("[PASS] Weather Analysis: CDD =", w_analysis.json()["current_cooling_degree_days"])

    # 4. Multi-Horizon Predictions (24h, 7d, 30d)
    for p in ["24h", "7d", "30d"]:
        pred_res = requests.post(f"{BASE_URL}/api/predictions", json={"forecast_period": p}, headers=headers)
        assert pred_res.status_code == 201, f"Prediction {p} failed: {pred_res.text}"
        pj = pred_res.json()
        print(f"[PASS] Prediction {p}: Demand = {pj['predicted_demand']} kWh, Model = {pj['model_name']}, Points = {len(pj['forecast_points'] or [])}")

    # 5. Peak Demand Analysis
    peak_res = requests.get(f"{BASE_URL}/api/peak-demand", headers=headers)
    assert peak_res.status_code == 200
    pk = peak_res.json()
    print(f"[PASS] Peak Demand: Category = {pk['demand_category']}, Peak window = {pk['peak_window']}, Peak = {pk['peak_hour_predicted_kwh']} kWh")

    # 6. Billing Estimator
    bill_res = requests.get(f"{BASE_URL}/api/billing/estimate", headers=headers)
    assert bill_res.status_code == 200
    bj = bill_res.json()
    print(f"[PASS] Bill Estimate: Current = Rs. {bj['current_cycle_estimate']['total_estimated_bill']}, Predicted = Rs. {bj['predicted_cycle_estimate']['total_estimated_bill']}")

    calc_res = requests.post(f"{BASE_URL}/api/billing/calculate", json={"consumption_kwh": 500, "base_tariff": 8.0, "peak_kwh": 150}, headers=headers)
    assert calc_res.status_code == 200
    print(f"[PASS] Custom Bill Calculation: Rs. {calc_res.json()['total_estimated_bill']}")

    # 7. What-If Simulator (Signature Feature)
    sim_res = requests.post(f"{BASE_URL}/api/simulator/simulate", json={"peak_reduction_pct": 15.0, "peak_shift_pct": 20.0}, headers=headers)
    assert sim_res.status_code == 200
    sj = sim_res.json()
    print(f"[PASS] What-If Simulation: Saved {sj['summary']['energy_saved_kwh']} kWh, Saved Rs. {sj['summary']['bill_saved_inr']}, CO2 Saved {sj['summary']['carbon_saved_kg']} kg")

    # Save scenario
    save_res = requests.post(f"{BASE_URL}/api/simulator/save", json={
        "scenario_name": "Test Optimizer",
        "peak_reduction_pct": 15.0,
        "peak_shift_pct": 20.0,
        "baseline_kwh": sj["summary"]["original_consumption_kwh"],
        "simulated_kwh": sj["summary"]["simulated_consumption_kwh"],
        "kwh_saved": sj["summary"]["energy_saved_kwh"],
        "baseline_cost": sj["summary"]["original_bill_inr"],
        "simulated_cost": sj["summary"]["simulated_bill_inr"],
        "cost_saved": sj["summary"]["bill_saved_inr"],
        "emissions_saved_kg": sj["summary"]["carbon_saved_kg"]
    }, headers=headers)
    assert save_res.status_code == 201
    print("[PASS] Saved scenario to DB:", save_res.json()["scenario_name"])

    # 8. Carbon Intelligence
    carb_res = requests.get(f"{BASE_URL}/api/carbon/summary", headers=headers)
    assert carb_res.status_code == 200
    cj = carb_res.json()
    print(f"[PASS] Carbon Emissions: Actual = {cj['actual']['emissions_kg']} kg CO2e, Trees = {cj['actual']['equivalencies']['trees_monthly_absorption']} trees/mo")

    # 9. Smart Recommendations Refresh
    rec_res = requests.post(f"{BASE_URL}/api/recommendations/refresh", headers=headers)
    assert rec_res.status_code == 200
    print(f"[PASS] Generated {len(rec_res.json())} smart recommendations with structured 4-part intelligence!")

    print("\nALL UPGRADED BACKEND CAPABILITIES VERIFIED 100% SUCCESSFULLY!")

if __name__ == "__main__":
    test_features()
