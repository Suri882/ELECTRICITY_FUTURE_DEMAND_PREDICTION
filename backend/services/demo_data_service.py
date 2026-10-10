from datetime import date, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models.electricity_record import ElectricityRecord
from backend.models.user import User

DEMO_CONSUMPTION_SERIES = [
    {"date_offset_months": 11, "units": 360.0, "bill": 2700.0, "peak": 85.0},
    {"date_offset_months": 10, "units": 385.0, "bill": 2887.5, "peak": 95.0},
    {"date_offset_months": 9,  "units": 410.0, "bill": 3075.0, "peak": 105.0},
    {"date_offset_months": 8,  "units": 435.0, "bill": 3262.5, "peak": 115.0},
    {"date_offset_months": 7,  "units": 470.0, "bill": 3525.0, "peak": 130.0},
    {"date_offset_months": 6,  "units": 520.0, "bill": 3900.0, "peak": 155.0}, # Summer peak
    {"date_offset_months": 5,  "units": 510.0, "bill": 3825.0, "peak": 150.0},
    {"date_offset_months": 4,  "units": 460.0, "bill": 3450.0, "peak": 125.0},
    {"date_offset_months": 3,  "units": 430.0, "bill": 3225.0, "peak": 110.0},
    {"date_offset_months": 2,  "units": 415.0, "bill": 3112.5, "peak": 100.0},
    {"date_offset_months": 1,  "units": 440.0, "bill": 3300.0, "peak": 118.0},
    {"date_offset_months": 0,  "units": 465.0, "bill": 3487.5, "peak": 128.0}, # Latest
]

class DemoDataService:
    """
    Manages explicit Demonstration Dataset.
    Allows evaluators to load or clear 12-month historical calibration series
    clearly labeled as DEMO DATA, strictly isolated per authenticated user.
    """

    @staticmethod
    def load_demo_data(db: Session, user: User) -> int:
        today = date.today()
        # Clean any prior demo/existing test records if resetting
        existing = db.query(ElectricityRecord).filter(ElectricityRecord.user_id == user.id).all()
        if len(existing) > 0:
            for r in existing:
                db.delete(r)
            db.commit()

        count = 0
        for item in DEMO_CONSUMPTION_SERIES:
            offset = item["date_offset_months"]
            rec_date = today - timedelta(days=offset * 30 + 1)
            rec = ElectricityRecord(
                user_id=user.id,
                date=rec_date,
                units_consumed=item["units"],
                bill_amount=item["bill"],
                number_of_days=30,
                peak_usage=item["peak"]
            )
            db.add(rec)
            count += 1

        user.demo_mode = True
        user.monthly_budget = 4000.0
        user.avg_monthly_consumption = 450.0
        db.commit()
        return count

    @staticmethod
    def clear_demo_data(db: Session, user: User) -> int:
        recs = db.query(ElectricityRecord).filter(ElectricityRecord.user_id == user.id).all()
        count = len(recs)
        for r in recs:
            db.delete(r)
        user.demo_mode = False
        db.commit()
        return count

demo_data_service = DemoDataService()
