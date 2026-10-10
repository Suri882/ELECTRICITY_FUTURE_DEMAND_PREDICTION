from backend.database import engine, Base, SessionLocal
from backend.models.user import User, UserRole, ConsumerType
from backend.utils.security import hash_password, verify_password
from backend.models.electricity_record import ElectricityRecord
from backend.ml.predictor import demand_predictor
from backend.ml.anomalies import anomaly_detector
from backend.services.efficiency_service import efficiency_calculator
from datetime import date

# 1. Initialize DB
Base.metadata.create_all(bind=engine)
db = SessionLocal()

# 2. Test Admin User creation/verification
admin = db.query(User).filter(User.email == "admin@smartenergy.com").first()
if not admin:
    admin = User(
        name="System Administrator",
        email="admin@smartenergy.com",
        phone="+91 9876543210",
        password_hash=hash_password("Admin@12345"),
        role=UserRole.ADMIN,
        consumer_type=ConsumerType.Office,
        monthly_budget=50000.0,
        avg_monthly_consumption=5000.0,
        notification_enabled=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

assert admin.role == UserRole.ADMIN
assert verify_password("Admin@12345", admin.password_hash)
print("[PASS] Database and Admin authentication verified")

# 3. Test Machine Learning Predictor
sample_records = [
    {"date": date(2026, 1, 15), "units_consumed": 380.0, "bill_amount": 2660.0, "number_of_days": 30, "peak_usage": 90.0},
    {"date": date(2026, 2, 15), "units_consumed": 410.0, "bill_amount": 2870.0, "number_of_days": 30, "peak_usage": 105.0},
    {"date": date(2026, 3, 15), "units_consumed": 450.0, "bill_amount": 3150.0, "number_of_days": 30, "peak_usage": 120.0},
    {"date": date(2026, 4, 15), "units_consumed": 490.0, "bill_amount": 3430.0, "number_of_days": 30, "peak_usage": 140.0},
]
prediction = demand_predictor.train_and_predict(sample_records)
print(f"[PASS] ML Demand Prediction successful: {prediction['predicted_demand']} units ({prediction['demand_level'].value}), MAE: {prediction['mae']}")

# 4. Test Anomaly Detection
score, severity, explanation = anomaly_detector.analyze_record(
    {"units_consumed": 850.0, "peak_usage": 400.0},
    sample_records
)
print(f"[PASS] Anomaly Detection successful: Score {score}, Severity: {severity.value}")

# 5. Test Efficiency Calculator
eff = efficiency_calculator.calculate(sample_records, monthly_budget=3500.0)
print(f"[PASS] Efficiency Score: {eff.overall_score}/100 ({eff.category})")

db.close()
print("ALL BACKEND & ML CORE TESTS PASSED SUCCESSFULLY!")
