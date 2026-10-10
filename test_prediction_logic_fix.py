import sys
import os
import unittest
import requests
import json

# Ensure project root is in path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.services.facility_prediction_service import facility_prediction, FacilityPredictionService

class TestPredictionLogic(unittest.TestCase):
    def setUp(self):
        self.api_base = "http://127.0.0.1:8000"

    def test_three_different_construction_types(self):
        """Test at least three different construction types with different input values produce distinct results."""
        # Type 1: Residential House
        house = facility_prediction.predict_demand({
            "construction_type": "Residential House",
            "built_up_area": 2500,
            "floors_count": 2,
            "occupancy": 4,
            "daily_operating_hours": 24,
            "operating_days_per_month": 30,
            "ac_type": "Split / Window Inverter ACs",
            "discom": "BESCOM",
            "tariff_category": "Domestic LT-2"
        })

        # Type 2: Commercial Office Building
        office = facility_prediction.predict_demand({
            "construction_type": "Office Building",
            "built_up_area": 20000,
            "floors_count": 4,
            "occupancy": 150,
            "daily_operating_hours": 10,
            "operating_days_per_month": 24,
            "ac_type": "VRV / VRF Multi-Split System",
            "discom": "BESCOM",
            "tariff_category": "Commercial LT-3"
        })

        # Type 3: Hospital Facility
        hospital = facility_prediction.predict_demand({
            "construction_type": "Hospital",
            "built_up_area": 50000,
            "floors_count": 6,
            "occupancy": 400,
            "daily_operating_hours": 24,
            "operating_days_per_month": 30,
            "ac_type": "Central Chiller HVAC Plant",
            "discom": "BESCOM",
            "tariff_category": "Commercial HT-2"
        })

        for label, pred in [("House", house), ("Office", office), ("Hospital", hospital)]:
            s = pred["summary"]
            self.assertGreater(s["daily_kwh"], 0, f"{label} daily_kwh must be > 0")
            self.assertGreater(s["monthly_kwh"], 0, f"{label} monthly_kwh must be > 0")
            self.assertGreater(s["avg_demand_kw"], 0, f"{label} avg_demand_kw must be > 0")
            self.assertGreater(s["peak_load_kw"], 0, f"{label} peak_load_kw must be > 0")
            self.assertGreater(s["connection_capacity_kva"], s["peak_load_kw"], f"{label} connection kVA must exceed peak kW")
            self.assertGreater(s["estimated_monthly_bill_inr"], 0, f"{label} bill must be > 0")
            self.assertTrue(len(pred["category_breakdown"]) >= 4, f"{label} must have category breakdowns")
            self.assertTrue(len(pred["recommendations"]) >= 2, f"{label} must have recommendations")
            self.assertIn("Engineering Estimation Disclosure", pred["engineering_disclaimer"])

        # Check distinctiveness and scale
        self.assertLess(house["summary"]["monthly_kwh"], office["summary"]["monthly_kwh"])
        self.assertLess(office["summary"]["monthly_kwh"], hospital["summary"]["monthly_kwh"])
        self.assertLess(house["summary"]["peak_load_kw"], office["summary"]["peak_load_kw"])
        self.assertLess(office["summary"]["peak_load_kw"], hospital["summary"]["peak_load_kw"])
        print(f"[PASS] 3 Construction Types Tested:")
        print(f"  Residential House: {house['summary']['monthly_kwh']:.1f} kWh/mo, Peak {house['summary']['peak_load_kw']:.1f} kW, kVA {house['summary']['connection_capacity_kva']:.1f}, Bill INR {house['summary']['estimated_monthly_bill_inr']:,.0f}")
        print(f"  Office Building:   {office['summary']['monthly_kwh']:.1f} kWh/mo, Peak {office['summary']['peak_load_kw']:.1f} kW, kVA {office['summary']['connection_capacity_kva']:.1f}, Bill INR {office['summary']['estimated_monthly_bill_inr']:,.0f}")
        print(f"  Hospital Facility: {hospital['summary']['monthly_kwh']:.1f} kWh/mo, Peak {hospital['summary']['peak_load_kw']:.1f} kW, kVA {hospital['summary']['connection_capacity_kva']:.1f}, Bill INR {hospital['summary']['estimated_monthly_bill_inr']:,.0f}")

    def test_single_variable_sensitivities(self):
        """Change only floor count, area, occupancy, and operating hours separately and verify predictions update."""
        baseline_params = {
            "construction_type": "Office Building",
            "built_up_area": 12000,
            "floors_count": 3,
            "occupancy": 60,
            "daily_operating_hours": 9,
            "operating_days_per_month": 24,
            "ac_type": "VRV / VRF Multi-Split System",
            "discom": "BESCOM",
            "tariff_category": "Commercial LT-3"
        }
        baseline = facility_prediction.predict_demand(baseline_params)
        base_s = baseline["summary"]

        # 1. Change ONLY Area: 12,000 -> 24,000
        area_params = dict(baseline_params, built_up_area=24000)
        area_pred = facility_prediction.predict_demand(area_params)
        self.assertGreater(area_pred["summary"]["monthly_kwh"], base_s["monthly_kwh"], "Doubling area must increase monthly kWh")
        self.assertGreater(area_pred["summary"]["peak_load_kw"], base_s["peak_load_kw"], "Doubling area must increase peak kW")
        print(f"[PASS] Area Sensitivity: {base_s['monthly_kwh']:.1f} -> {area_pred['summary']['monthly_kwh']:.1f} kWh/mo (+{((area_pred['summary']['monthly_kwh']/base_s['monthly_kwh'])-1)*100:.1f}%)")

        # 2. Change ONLY Floors: 3 -> 8 floors (same area)
        floors_params = dict(baseline_params, floors_count=8)
        floors_pred = facility_prediction.predict_demand(floors_params)
        self.assertGreater(floors_pred["summary"]["monthly_kwh"], base_s["monthly_kwh"], "Increasing floors must increase monthly kWh (lifts/pumps)")
        self.assertGreater(floors_pred["summary"]["peak_load_kw"], base_s["peak_load_kw"], "Increasing floors must increase peak kW")
        print(f"[PASS] Floors Sensitivity (3 -> 8 floors): {base_s['peak_load_kw']:.2f} -> {floors_pred['summary']['peak_load_kw']:.2f} kW peak")

        # 3. Change ONLY Occupancy: 60 -> 180 occupants
        occ_params = dict(baseline_params, occupancy=180)
        occ_pred = facility_prediction.predict_demand(occ_params)
        self.assertGreater(occ_pred["summary"]["monthly_kwh"], base_s["monthly_kwh"], "Tripling occupancy must increase monthly kWh")
        self.assertGreater(occ_pred["summary"]["peak_load_kw"], base_s["peak_load_kw"], "Tripling occupancy must increase peak kW")
        print(f"[PASS] Occupancy Sensitivity (60 -> 180 pax): {base_s['monthly_kwh']:.1f} -> {occ_pred['summary']['monthly_kwh']:.1f} kWh/mo")

        # 4. Change ONLY Operating Hours: 9 -> 16 hours/day
        hours_params = dict(baseline_params, daily_operating_hours=16)
        hours_pred = facility_prediction.predict_demand(hours_params)
        self.assertGreater(hours_pred["summary"]["monthly_kwh"], base_s["monthly_kwh"], "Extending daily hours must increase monthly kWh")
        self.assertGreater(hours_pred["summary"]["daily_kwh"], base_s["daily_kwh"], "Extending daily hours must increase daily kWh")
        print(f"[PASS] Hours Sensitivity (9 -> 16 hrs): {base_s['daily_kwh']:.1f} -> {hours_pred['summary']['daily_kwh']:.1f} kWh/day")

    def test_deterministic_consistency(self):
        """Verify submitting the same inputs twice produces consistent identical results."""
        params = {
            "construction_type": "Shopping Mall",
            "built_up_area": 35000,
            "floors_count": 4,
            "occupancy": 300,
            "daily_operating_hours": 12,
            "operating_days_per_month": 30,
            "ac_type": "Central Chiller HVAC Plant",
            "discom": "BESCOM",
            "tariff_category": "Commercial HT-2"
        }
        run1 = facility_prediction.predict_demand(params)
        run2 = facility_prediction.predict_demand(params)

        self.assertEqual(run1["summary"]["daily_kwh"], run2["summary"]["daily_kwh"])
        self.assertEqual(run1["summary"]["monthly_kwh"], run2["summary"]["monthly_kwh"])
        self.assertEqual(run1["summary"]["peak_load_kw"], run2["summary"]["peak_load_kw"])
        self.assertEqual(run1["summary"]["connection_capacity_kva"], run2["summary"]["connection_capacity_kva"])
        self.assertEqual(run1["summary"]["estimated_monthly_bill_inr"], run2["summary"]["estimated_monthly_bill_inr"])
        print("[PASS] Deterministic Consistency: Multiple runs produce identical results.")

    def test_api_predict_demand_endpoint(self):
        """Verify POST /api/projects/predict-demand returns input-dependent results over HTTP."""
        url = f"{self.api_base}/api/projects/predict-demand"
        payload = {
            "construction_type": "IT Park / Data Center",
            "built_up_area": 40000,
            "floors_count": 5,
            "occupancy": 350,
            "daily_operating_hours": 14,
            "operating_days_per_month": 26,
            "ac_type": "VRV / VRF Multi-Split System",
            "discom": "BESCOM",
            "tariff_category": "Commercial HT-2"
        }
        resp = requests.post(url, json=payload, timeout=5)
        self.assertEqual(resp.status_code, 200, f"API returned {resp.status_code}: {resp.text}")
        data = resp.json()
        self.assertIn("summary", data)
        self.assertIn("category_breakdown", data)
        self.assertIn("sensitivity_drivers", data)
        self.assertGreater(data["summary"]["daily_kwh"], 0)
        self.assertGreater(data["summary"]["monthly_kwh"], 0)
        self.assertGreater(data["summary"]["peak_load_kw"], 0)
        print(f"[PASS] API Endpoint /api/projects/predict-demand: HTTP 200, daily {data['summary']['daily_kwh']} kWh, peak {data['summary']['peak_load_kw']} kW")

    def test_api_validation_errors(self):
        """Verify invalid inputs return understandable HTTP 400 errors instead of silent fake success."""
        url = f"{self.api_base}/api/projects/predict-demand"

        # Test A: Negative or zero built_up_area
        resp_invalid_area = requests.post(url, json={"construction_type": "Residential House", "built_up_area": -500}, timeout=5)
        self.assertEqual(resp_invalid_area.status_code, 400)
        self.assertIn("Building built-up area must be positive", resp_invalid_area.json()["detail"])
        print("[PASS] API Validation: Negative area correctly rejected with HTTP 400.")

        # Test B: Operating hours > 24
        resp_invalid_hours = requests.post(url, json={"construction_type": "Office Building", "built_up_area": 2000, "daily_operating_hours": 28}, timeout=5)
        self.assertEqual(resp_invalid_hours.status_code, 400)
        self.assertIn("Daily operating hours must be between 0.5 and 24", resp_invalid_hours.json()["detail"])
        print("[PASS] API Validation: Daily hours > 24 correctly rejected with HTTP 400.")

if __name__ == "__main__":
    unittest.main()
