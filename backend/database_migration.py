"""Safe database schema migration utility.
Checks for missing columns and tables and applies non-destructive ALTER TABLE commands.
Supports both SQLite and MySQL seamlessly.
"""

from sqlalchemy import inspect, text
from backend.database import engine, Base
import backend.models  # Ensures all models including SimulationRecord are registered
import logging

logger = logging.getLogger(__name__)

def run_migrations():
    """Ensure all required columns and tables exist."""
    # 1. Create any missing tables (like simulations)
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    dialect_name = engine.dialect.name.lower()

    # Columns to ensure on 'users' table
    user_columns = {
        "demand_threshold_low": "FLOAT DEFAULT 250.0",
        "demand_threshold_medium": "FLOAT DEFAULT 450.0",
        "demand_threshold_high": "FLOAT DEFAULT 700.0",
        "base_tariff_rate": "FLOAT DEFAULT 7.50",
        "peak_tariff_multiplier": "FLOAT DEFAULT 1.40",
        "fixed_charges": "FLOAT DEFAULT 120.0",
        "tax_percentage": "FLOAT DEFAULT 5.00",
        "grid_emission_factor": "FLOAT DEFAULT 0.82",
        "weather_city": "VARCHAR(120) DEFAULT 'Bengaluru'",
        "weather_latitude": "FLOAT DEFAULT 12.9716",
        "weather_longitude": "FLOAT DEFAULT 77.5946",
        "demo_mode": "BOOLEAN DEFAULT 0",
    }

    # Columns to ensure on 'predictions' table
    prediction_columns = {
        "forecast_period": "VARCHAR(20) DEFAULT '30d'",
        "temperature": "FLOAT DEFAULT NULL",
        "weather_condition": "VARCHAR(80) DEFAULT NULL",
        "details_json": "TEXT DEFAULT NULL",
    }

    with engine.connect() as conn:
        # Check users table
        existing_user_cols = {col["name"] for col in inspector.get_columns("users")}
        for col_name, col_def in user_columns.items():
            if col_name not in existing_user_cols:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"))
                    conn.commit()
                    logger.info(f"Added column {col_name} to users table.")
                except Exception as e:
                    logger.warning(f"Could not add column {col_name} to users: {e}")

        # Check predictions table
        existing_pred_cols = {col["name"] for col in inspector.get_columns("predictions")}
        for col_name, col_def in prediction_columns.items():
            if col_name not in existing_pred_cols:
                try:
                    conn.execute(text(f"ALTER TABLE predictions ADD COLUMN {col_name} {col_def}"))
                    conn.commit()
                    logger.info(f"Added column {col_name} to predictions table.")
                except Exception as e:
                    logger.warning(f"Could not add column {col_name} to predictions: {e}")

    logger.info("Database migration check completed successfully.")

if __name__ == "__main__":
    run_migrations()
    print("Migration executed successfully.")
