import os
import sys
import numpy as np
import pandas as pd
from datetime import date

# Ensure root workspace is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.preprocessing.pipeline import pipeline
from backend.ml.predictor import RidgeRegressor, LinearRegressor, PolynomialTrendRegressor, compute_metrics

def train_offline_model(csv_path: str):
    """
    Offline training script that ingests a dataset, executes feature engineering,
    benchmarks candidate regression models, and outputs performance metrics.
    """
    print(f"Loading electricity consumption dataset from: {csv_path}")
    df = pd.read_csv(csv_path)
    df_featured = pipeline.extract_features(df)

    feature_cols = [
        "lag_1", "lag_2", "rolling_avg_3", "growth_rate",
        "day_of_week", "month", "peak_ratio", "number_of_days"
    ]

    X = df_featured[feature_cols].values
    y = df_featured["units_consumed"].values

    models = {
        "Ridge Regression": RidgeRegressor(alpha=1.0),
        "Linear Regression": LinearRegressor(),
        "Polynomial Trend Regression": PolynomialTrendRegressor(degree=2, alpha=0.8)
    }

    print("\n" + "="*50)
    print("MODEL PERFORMANCE EVALUATION & BENCHMARK")
    print("="*50)
    best_name = None
    best_mae = float("inf")

    for name, model in models.items():
        model.fit(X, y)
        preds = model.predict(X)
        mae, rmse, r2 = compute_metrics(y, preds)
        print(f"Model: {name:<28} | MAE: {mae:>6.2f} kWh | RMSE: {rmse:>6.2f} | R2: {r2:>6.4f}")
        if mae < best_mae:
            best_mae = mae
            best_name = name

    print(f"\nOptimal Architecture Selected: {best_name} (Lowest MAE: {best_mae:.2f})")
    print("Training sequence completed successfully.")

if __name__ == "__main__":
    sample_csv = os.path.join(os.path.dirname(__file__), "sample_training_data.csv")
    if not os.path.exists(sample_csv):
        # Create a sample training data file
        dates = pd.date_range(start="2024-01-01", periods=24, freq="ME")
        base = 350.0
        units = [base + i * 15 + np.sin(i / 2.0) * 40 for i in range(24)]
        bills = [u * 7.5 for u in units]
        peaks = [u * 0.28 for u in units]
        sample_df = pd.DataFrame({
            "date": [d.strftime("%Y-%m-%d") for d in dates],
            "units_consumed": np.round(units, 2),
            "bill_amount": np.round(bills, 2),
            "number_of_days": [30]*24,
            "peak_usage": np.round(peaks, 2)
        })
        sample_df.to_csv(sample_csv, index=False)
        print(f"Synthesized benchmark dataset created at {sample_csv}")

    train_offline_model(sample_csv)
