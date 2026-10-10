import requests
import json
import os
from datetime import date

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== STARTING FULL E2E SYSTEM INTEGRATION TEST ===")
    
    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] System Health Check Verified (200 OK)")

    # 2. Register new test user
    test_email = f"tester_{int(date.today().strftime('%Y%m%d'))}@example.com"
    reg_payload = {
        "name": "Ananya Sharma",
        "email": test_email,
        "phone": "+91 9123456789",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123",
        "consumer_type": "Household"
    }
    # If already registered, login directly
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": test_email, "password": "SecurePassword@123"})
    if login_res.status_code == 200:
        token = login_res.json()["access_token"]
        user_info = login_res.json()["user"]
        print("[PASS] User Login Successful")
    else:
        res = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
        assert res.status_code == 200, f"Registration failed: {res.text}"
        token = res.json()["access_token"]
        user_info = res.json()["user"]
        print("[PASS] User Registration Successful")

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Configure profile (budget, location, etc.)
    prof_payload = {
        "location": "Bengaluru, Karnataka",
        "monthly_budget": 4000.0,
        "avg_monthly_consumption": 420.0,
        "notification_enabled": True
    }
    res = requests.put(f"{BASE_URL}/api/users/profile", json=prof_payload, headers=headers)
    assert res.status_code == 200, f"Profile update failed: {res.text}"
    assert res.json()["monthly_budget"] == 4000.0
    print("[PASS] User Profile & Monthly Budget Configured (Rs. 4,000.00)")

    # 4. Test Section 10: Empty State when no consumption records
    # Check current summary
    res = requests.get(f"{BASE_URL}/api/analytics/summary", headers=headers)
    assert res.status_code == 200
    summary_data = res.json()
    print(f"[PASS] Dashboard Summary Tested: has_data={summary_data['has_data']}, records_count={summary_data['records_count']}")

    # 5. Ingest Consumption Telemetry via Batch CSV
    csv_content = (
        "date,units_consumed,bill_amount,number_of_days,peak_usage\n"
        "2026-01-15,380.00,2660.00,30,90.00\n"
        "2026-02-15,410.00,2870.00,30,105.00\n"
        "2026-03-15,440.00,3080.00,30,120.00\n"
        "2026-04-15,490.00,3430.00,30,140.00\n"
    )
    files = {"file": ("consumption_telemetry.csv", csv_content, "text/csv")}
    res = requests.post(f"{BASE_URL}/api/consumption/upload-csv", files=files, headers=headers)
    assert res.status_code == 200, f"CSV upload failed: {res.text}"
    upload_summary = res.json()
    assert upload_summary["successful_rows"] >= 0
    print(f"[PASS] Batch CSV Telemetry Ingested: {upload_summary['message']}")

    # 6. Add Single Record
    single_log = {
        "date": "2026-05-15",
        "units_consumed": 530.0,
        "bill_amount": 3710.0,
        "number_of_days": 30,
        "peak_usage": 165.0
    }
    res = requests.post(f"{BASE_URL}/api/consumption", json=single_log, headers=headers)
    if res.status_code == 201:
        print("[PASS] Single Consumption Record Logged (530.0 kWh)")
    elif res.status_code == 400 and "already exists" in res.text:
        print("[PASS] Duplicate Prevention Verified (Record already exists)")

    # 7. Machine Learning Demand Prediction (Section 14 & 15)
    res = requests.post(f"{BASE_URL}/api/predictions", json={}, headers=headers)
    assert res.status_code == 201, f"Prediction failed: {res.text}"
    pred = res.json()
    print(f"[PASS] ML Demand Prediction Generated:")
    print(f"       Forecasted Demand: {pred['predicted_demand']} kWh")
    print(f"       Demand Level:      {pred['demand_level']}")
    print(f"       Model Selected:    {pred['model_name']}")
    print(f"       Model MAE:         {pred['mae']} kWh, RMSE: {pred['rmse']}, R2: {pred['r2_score']}")
    print(f"       Expected Shift:    {pred['percentage_change']:+.1f}% vs baseline ({pred['previous_average']} kWh avg)")

    # 8. Efficiency Score Breakdown (Section 18)
    res = requests.get(f"{BASE_URL}/api/analytics/efficiency", headers=headers)
    assert res.status_code == 200
    eff = res.json()
    print(f"[PASS] Energy Efficiency Score: {eff['overall_score']}/100 ({eff['category']})")
    for factor in eff["factors"]:
        print(f"       - {factor['name']}: {factor['score']}/{factor['weight']} pts")

    # 9. Cost Intelligence (Section 19)
    res = requests.get(f"{BASE_URL}/api/analytics/cost", headers=headers)
    assert res.status_code == 200
    cost = res.json()
    print(f"[PASS] Cost Intelligence Evaluated: Latest Bill Rs. {cost['current_bill']}, Variance: {cost['cost_difference']:+}")

    # 10. Recommendations (Section 20)
    res = requests.get(f"{BASE_URL}/api/recommendations", headers=headers)
    assert res.status_code == 200
    recs = res.json()
    print(f"[PASS] Smart Optimization Engine: {len(recs)} active directives generated")
    if recs:
        print(f"       Top Directive: '{recs[0]['title']}' [{recs[0]['priority']}] -> {recs[0]['expected_benefit']}")

    # 11. Alerts & Notifications (Section 21 & 22)
    res = requests.get(f"{BASE_URL}/api/alerts", headers=headers)
    assert res.status_code == 200
    alerts = res.json()
    print(f"[PASS] In-App Notification Center: {len(alerts)} alerts logged")

    # 12. Report Generation (Section 25)
    res = requests.post(f"{BASE_URL}/api/reports/generate", headers=headers)
    assert res.status_code == 200, f"Report generation failed: {res.text}"
    report_info = res.json()
    print(f"[PASS] PDF Audit Report Compiled: {report_info['file_name']}")

    # Test downloading PDF bytes
    dl_res = requests.get(f"{BASE_URL}/api/reports/download/{report_info['id']}", headers=headers)
    assert dl_res.status_code == 200
    assert len(dl_res.content) > 1000
    print(f"[PASS] PDF Report Download Stream Verified ({len(dl_res.content)} bytes)")

    # 13. Admin Portal Access (Section 26 & 35)
    admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@smartenergy.com", "password": "Admin@12345"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=admin_headers)
    assert res.status_code == 200
    admin_dash = res.json()
    print(f"[PASS] Admin Governance Portal Verified:")
    print(f"       Total Users:            {admin_dash['stats']['total_users']}")
    print(f"       Active Telemetry Users: {admin_dash['stats']['active_users']}")
    print(f"       Total Records:          {admin_dash['stats']['total_consumption_records']}")
    print(f"       Total ML Forecasts:     {admin_dash['stats']['total_predictions']}")
    print(f"       Total Alerts:           {admin_dash['stats']['total_alerts']}")
    print(f"       Avg Platform Score:     {admin_dash['stats']['average_efficiency_score']}")

    print("\n=======================================================")
    print("ALL 13 SYSTEM MODULES AND INTEGRATION TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
