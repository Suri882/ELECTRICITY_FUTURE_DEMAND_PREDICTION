import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any

class DataPreprocessingPipeline:
    """
    Standardizes raw electricity consumption sequences, handles missing data,
    performs temporal feature engineering, and normalizes feature vectors.
    """

    def clean_and_impute(self, df: pd.DataFrame) -> pd.DataFrame:
        clean = df.copy()
        clean["date"] = pd.to_datetime(clean["date"])
        clean = clean.sort_values("date").reset_index(drop=True)

        # Convert numerics
        for col in ["units_consumed", "bill_amount", "peak_usage"]:
            if col in clean.columns:
                clean[col] = pd.to_numeric(clean[col], errors="coerce")
        if "number_of_days" in clean.columns:
            clean["number_of_days"] = pd.to_numeric(clean["number_of_days"], errors="coerce").fillna(30).astype(int)

        # Impute missing values with forward-fill then backward-fill
        clean["units_consumed"] = clean["units_consumed"].ffill().bfill()
        clean["bill_amount"] = clean["bill_amount"].ffill().bfill()
        if "peak_usage" in clean.columns:
            clean["peak_usage"] = clean["peak_usage"].fillna(0.0)

        return clean

    def extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        data = self.clean_and_impute(df)

        data["lag_1"] = data["units_consumed"].shift(1)
        data["lag_2"] = data["units_consumed"].shift(2).fillna(data["lag_1"])
        data["rolling_avg_3"] = data["units_consumed"].rolling(window=3, min_periods=1).mean()
        data["growth_rate"] = (data["units_consumed"] - data["lag_1"]) / (data["lag_1"] + 1e-5)
        data["day_of_week"] = data["date"].dt.dayofweek
        data["month"] = data["date"].dt.month
        data["peak_ratio"] = np.where(
            data["units_consumed"] > 0,
            data["peak_usage"] / data["units_consumed"],
            0.0
        )

        data["lag_1"] = data["lag_1"].fillna(data["units_consumed"])
        data["lag_2"] = data["lag_2"].fillna(data["units_consumed"])
        data["growth_rate"] = data["growth_rate"].fillna(0.0)
        return data

pipeline = DataPreprocessingPipeline()
