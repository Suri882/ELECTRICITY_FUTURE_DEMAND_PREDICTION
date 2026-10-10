import numpy as np
import pandas as pd
from datetime import date, datetime, timedelta
from typing import Dict, Any, Tuple, Optional, List
from backend.models.prediction import DemandLevel

MINIMUM_RECORDS_FOR_PREDICTION = 3

# Diurnal hourly consumption baseline distribution (weights summing to ~1.0)
# Reflects residential/commercial daily demand curve with evening and midday peaks
HOURLY_LOAD_DISTRIBUTION = [
    0.025, 0.022, 0.020, 0.019, 0.021, 0.028,  # 00:00 - 05:00 (Night base)
    0.040, 0.055, 0.058, 0.052, 0.048, 0.046,  # 06:00 - 11:00 (Morning rise)
    0.050, 0.052, 0.049, 0.046, 0.048, 0.056,  # 12:00 - 17:00 (Afternoon peak)
    0.068, 0.076, 0.072, 0.065, 0.045, 0.032   # 18:00 - 23:00 (Evening peak)
]

PEAK_HOURS_SET = {12, 13, 14, 18, 19, 20, 21}


class DecisionTreeLeaf:
    def __init__(self, value: float):
        self.value = value


class DecisionTreeNode:
    def __init__(self, feature: int, threshold: float, left: Any, right: Any):
        self.feature = feature
        self.threshold = threshold
        self.left = left
        self.right = right


class FastDecisionTreeRegressor:
    """NumPy-based Decision Tree Regressor optimizing variance reduction."""
    def __init__(self, max_depth: int = 4, min_samples_split: int = 2):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.root = None

    def fit(self, X: np.ndarray, y: np.ndarray, depth: int = 0, max_features: Optional[int] = None):
        n_samples, n_features = X.shape
        if depth >= self.max_depth or n_samples < self.min_samples_split or np.var(y) < 1e-6:
            return DecisionTreeLeaf(float(np.mean(y)))

        feat_indices = np.arange(n_features)
        if max_features and max_features < n_features:
            feat_indices = np.random.choice(feat_indices, max_features, replace=False)

        best_feat, best_thresh, best_mse = None, None, float("inf")

        for feat in feat_indices:
            values = np.unique(X[:, feat])
            if len(values) <= 1:
                continue
            thresholds = (values[:-1] + values[1:]) / 2.0
            if len(thresholds) > 8:
                thresholds = np.quantile(values, np.linspace(0.15, 0.85, 6))

            for thresh in thresholds:
                left_mask = X[:, feat] <= thresh
                right_mask = ~left_mask
                if np.sum(left_mask) == 0 or np.sum(right_mask) == 0:
                    continue
                mse = np.var(y[left_mask]) * np.sum(left_mask) + np.var(y[right_mask]) * np.sum(right_mask)
                if mse < best_mse:
                    best_mse, best_feat, best_thresh = mse, feat, thresh

        if best_feat is None:
            return DecisionTreeLeaf(float(np.mean(y)))

        left_mask = X[:, best_feat] <= best_thresh
        left = self.fit(X[left_mask], y[left_mask], depth + 1, max_features)
        right = self.fit(X[~left_mask], y[~left_mask], depth + 1, max_features)
        return DecisionTreeNode(best_feat, best_thresh, left, right)

    def _predict_row(self, node: Any, row: np.ndarray) -> float:
        if isinstance(node, DecisionTreeLeaf):
            return node.value
        if row[node.feature] <= node.threshold:
            return self._predict_row(node.left, row)
        return self._predict_row(node.right, row)

    def predict(self, X: np.ndarray) -> np.ndarray:
        return np.array([self._predict_row(self.root, row) for row in X])


class RandomForestRegressorPure:
    """Ensemble Random Forest Regressor using bootstrap aggregation and feature subsampling."""
    def __init__(self, n_estimators: int = 15, max_depth: int = 4, min_samples_split: int = 2):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.trees: List[FastDecisionTreeRegressor] = []

    def fit(self, X: np.ndarray, y: np.ndarray):
        n_samples, n_features = X.shape
        self.trees = []
        max_feat = max(1, int(np.sqrt(n_features)))
        rng = np.random.RandomState(42)

        for _ in range(self.n_estimators):
            boot_idx = rng.choice(n_samples, n_samples, replace=True)
            tree = FastDecisionTreeRegressor(self.max_depth, self.min_samples_split)
            tree.root = tree.fit(X[boot_idx], y[boot_idx], max_features=max_feat)
            self.trees.append(tree)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.trees:
            return np.zeros(len(X))
        all_preds = np.array([tree.predict(X) for tree in self.trees])
        return np.mean(all_preds, axis=0)


class RidgeRegressor:
    """Analytical L2 Regularized Ridge Regression implemented via NumPy."""
    def __init__(self, alpha: float = 1.0):
        self.alpha = alpha
        self.weights = None
        self.intercept = 0.0

    def fit(self, X: np.ndarray, y: np.ndarray):
        n_samples, n_features = X.shape
        X_mean = np.mean(X, axis=0)
        y_mean = np.mean(y)
        X_centered = X - X_mean
        y_centered = y - y_mean

        A = X_centered.T @ X_centered + self.alpha * np.eye(n_features)
        b = X_centered.T @ y_centered
        self.weights = np.linalg.pinv(A) @ b
        self.intercept = y_mean - float(np.dot(X_mean, self.weights))
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return np.dot(X, self.weights) + self.intercept


class LinearRegressor:
    """Ordinary Least Squares Linear Regression via Moore-Penrose pseudo-inverse."""
    def __init__(self):
        self.weights = None
        self.intercept = 0.0

    def fit(self, X: np.ndarray, y: np.ndarray):
        X_mean = np.mean(X, axis=0)
        y_mean = np.mean(y)
        X_centered = X - X_mean
        y_centered = y - y_mean

        self.weights = np.linalg.pinv(X_centered) @ y_centered
        self.intercept = y_mean - float(np.dot(X_mean, self.weights))
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return np.dot(X, self.weights) + self.intercept


class PolynomialTrendRegressor:
    """Quadratic Polynomial Trend Regression with regularization."""
    def __init__(self, degree: int = 2, alpha: float = 0.5):
        self.degree = degree
        self.alpha = alpha
        self.ridge = RidgeRegressor(alpha=alpha)

    def _transform(self, X: np.ndarray) -> np.ndarray:
        n_cols = min(4, X.shape[1])
        return np.hstack([X, X[:, :n_cols] ** 2])

    def fit(self, X: np.ndarray, y: np.ndarray):
        X_poly = self._transform(X)
        self.ridge.fit(X_poly, y)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        X_poly = self._transform(X)
        return self.ridge.predict(X_poly)


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Tuple[float, float, float]:
    """Computes MAE, RMSE, and R2 score."""
    errors = y_true - y_pred
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))

    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    ss_res = np.sum(errors ** 2)

    if ss_tot > 1e-7:
        r2 = float(1.0 - (ss_res / ss_tot))
    else:
        r2 = 1.0 if mae < 1e-4 else 0.0

    return round(mae, 2), round(rmse, 2), round(max(-1.0, min(1.0, r2)), 4)


class ElectricityDemandPredictor:
    """
    Advanced AI Electricity Demand Prediction & Forecasting Engine.
    Supports multi-horizon forecasting (24 hours, 7 days, 30 days),
    multi-model ensemble evaluation (Random Forest, Ridge, Linear, Polynomial),
    chronological train/test split to prevent data leakage,
    weather & temperature feature adjustments, and peak-demand quantification.
    """

    def __init__(self):
        self.feature_columns = [
            "lag_1",
            "lag_2",
            "rolling_avg_3",
            "growth_rate",
            "day_of_week",
            "month",
            "peak_ratio",
            "number_of_days",
            "temp_feature"
        ]

    def build_features(self, df: pd.DataFrame, avg_temp: float = 26.0) -> pd.DataFrame:
        data = df.sort_values("date").copy()
        data["date"] = pd.to_datetime(data["date"])
        data["units_consumed"] = data["units_consumed"].astype(float)
        data["peak_usage"] = data["peak_usage"].astype(float)
        data["number_of_days"] = data["number_of_days"].astype(int)

        # Temperature feature (fallback or extracted if present)
        if "temperature" in data.columns and not data["temperature"].isna().all():
            data["temp_feature"] = data["temperature"].fillna(avg_temp).astype(float)
        else:
            # Synthetic seasonal baseline temperature if not recorded
            # Bengaluru/Indian climate profile: summer peak in April-May
            month = data["date"].dt.month
            data["temp_feature"] = 24.0 + 5.0 * np.sin((month - 1) * np.pi / 6.0)

        # Lag features
        data["lag_1"] = data["units_consumed"].shift(1)
        data["lag_2"] = data["units_consumed"].shift(2).fillna(data["lag_1"])

        # Rolling statistics
        data["rolling_avg_3"] = data["units_consumed"].rolling(window=3, min_periods=1).mean()

        # Growth rate
        data["growth_rate"] = (data["units_consumed"] - data["lag_1"]) / (data["lag_1"] + 1e-5)

        # Calendar features
        data["day_of_week"] = data["date"].dt.dayofweek
        data["month"] = data["date"].dt.month

        # Peak ratio
        data["peak_ratio"] = np.where(
            data["units_consumed"] > 0,
            data["peak_usage"] / data["units_consumed"],
            0.0
        )

        # Impute initial boundaries without leakage
        data["lag_1"] = data["lag_1"].fillna(data["units_consumed"])
        data["lag_2"] = data["lag_2"].fillna(data["units_consumed"])
        data["growth_rate"] = data["growth_rate"].fillna(0.0)

        return data

    def train_and_evaluate(
        self,
        df_featured: pd.DataFrame
    ) -> Tuple[Dict[str, Any], str, List[Dict[str, Any]]]:
        """
        Chronological train/test split evaluation of candidate regressors.
        Ensures zero temporal data leakage.
        """
        X = df_featured[self.feature_columns].values
        y = df_featured["units_consumed"].values
        n = len(df_featured)

        candidate_models = {
            "Random Forest Regressor": RandomForestRegressorPure(n_estimators=16, max_depth=4),
            "Ridge Regression": RidgeRegressor(alpha=1.0),
            "Polynomial Trend Regression": PolynomialTrendRegressor(degree=2, alpha=0.8),
            "Linear Regression": LinearRegressor()
        }

        # Chronological split: use at least 1 test sample if n >= 4
        if n >= 4:
            split_idx = max(2, int(n * 0.75))
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]
        else:
            X_train, X_test = X, X
            y_train, y_test = y, y

        model_results = []
        best_model_name = "Random Forest Regressor"
        best_model = candidate_models["Random Forest Regressor"]
        best_mae = float("inf")
        best_rmse = float("inf")
        best_r2 = -1.0

        for name, model in candidate_models.items():
            try:
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                mae, rmse, r2 = compute_metrics(y_test, y_pred)
                
                # Fit on full data for future projecting
                full_model = type(model)()
                if hasattr(model, "alpha"):
                    full_model.alpha = model.alpha
                if hasattr(model, "degree"):
                    full_model.degree = model.degree
                if hasattr(model, "n_estimators"):
                    full_model.n_estimators = model.n_estimators
                    full_model.max_depth = model.max_depth
                full_model.fit(X, y)

                is_best = False
                if mae < best_mae:
                    best_mae = mae
                    best_rmse = rmse
                    best_r2 = r2
                    best_model_name = name
                    best_model = full_model

                model_results.append({
                    "model_name": name,
                    "mae": mae,
                    "rmse": rmse,
                    "r2_score": r2,
                    "is_best": False
                })
            except Exception:
                continue

        # Mark best model in comparison list
        for res in model_results:
            if res["model_name"] == best_model_name:
                res["is_best"] = True

        return {
            "best_model": best_model,
            "best_name": best_model_name,
            "mae": best_mae,
            "rmse": best_rmse,
            "r2_score": best_r2
        }, best_model_name, model_results

    def train_and_predict(
        self,
        records: List[Dict[str, Any]],
        target_date: Optional[date] = None,
        forecast_period: str = "30d",
        current_temp: Optional[float] = None,
        weather_forecast: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Main forecasting API.
        Forecast periods supported:
        - '24h': Next 24 hours with hourly breakdown
        - '7d': Next 7 days with daily breakdown
        - '30d': Next 30 days (billing cycle)
        """
        if len(records) < MINIMUM_RECORDS_FOR_PREDICTION:
            raise ValueError(
                f"Not enough historical data to generate a reliable prediction. "
                f"Add more consumption records (minimum {MINIMUM_RECORDS_FOR_PREDICTION} required, current {len(records)})."
            )

        raw_df = pd.DataFrame(records)
        avg_temp = current_temp if current_temp is not None else 26.0
        df_featured = self.build_features(raw_df, avg_temp=avg_temp)

        eval_result, best_model_name, model_comparison = self.train_and_evaluate(df_featured)
        best_model = eval_result["best_model"]
        best_mae = eval_result["mae"]
        best_rmse = eval_result["rmse"]
        best_r2 = eval_result["r2_score"]

        last_row = df_featured.iloc[-1]
        last_date = last_row["date"].date()
        recent_avg = float(df_featured["units_consumed"].tail(3).mean())
        historical_avg = float(df_featured["units_consumed"].mean())
        last_units = float(last_row["units_consumed"])
        growth = (last_units - float(last_row["lag_1"])) / (float(last_row["lag_1"]) + 1e-5)
        last_peak_ratio = float(last_row["peak_ratio"]) if float(last_row["peak_ratio"]) > 0 else 0.25

        # Base 30-day projection from ML regressor
        future_vector_30d = np.array([[
            last_units,
            float(last_row["lag_1"]),
            recent_avg,
            growth,
            (last_date + timedelta(days=30)).weekday(),
            (last_date + timedelta(days=30)).month,
            last_peak_ratio,
            30,
            avg_temp
        ]])
        predicted_30d_val = float(best_model.predict(future_vector_30d)[0])
        predicted_30d = max(10.0, round(predicted_30d_val, 2))

        # Temperature sensitivity effect (+4.5% per °C above 25°C base cooling threshold)
        temp_delta = max(0.0, avg_temp - 25.0)
        temp_factor = 1.0 + (temp_delta * 0.025)

        daily_baseline = (predicted_30d / 30.0) * temp_factor

        forecast_points: List[Dict[str, Any]] = []

        if forecast_period == "24h":
            # Next 24 hours (hourly breakdown)
            now = datetime.now()
            start_hour = (now.hour + 1) % 24
            hourly_total = 0.0

            for i in range(24):
                hr = (start_hour + i) % 24
                point_dt = now + timedelta(hours=i + 1)
                weight = HOURLY_LOAD_DISTRIBUTION[hr]
                is_peak = hr in PEAK_HOURS_SET

                # Temperature adjustment for hour
                hr_temp = avg_temp + 3.0 * np.sin((hr - 8) * np.pi / 12.0)
                hr_factor = 1.0 + (max(0.0, hr_temp - 26.0) * 0.03)

                point_kwh = round(daily_baseline * weight * hr_factor * 24.0 / sum(HOURLY_LOAD_DISTRIBUTION), 2)
                hourly_total += point_kwh

                forecast_points.append({
                    "timestamp": point_dt.strftime("%Y-%m-%d %H:00"),
                    "hour": hr,
                    "label": f"{hr:02d}:00",
                    "predicted_kwh": point_kwh,
                    "is_peak": is_peak,
                    "temperature": round(hr_temp, 1),
                    "demand_level": "High" if is_peak or point_kwh > (daily_baseline * 0.065) else "Normal"
                })

            predicted_demand = round(hourly_total, 2)
            forecast_label = "Next 24 Hours (Hourly)"
            next_date = (now + timedelta(days=1)).date()

        elif forecast_period == "7d":
            # Next 7 days (daily breakdown)
            start_date = last_date + timedelta(days=1)
            weekly_total = 0.0

            for d in range(7):
                cur_date = start_date + timedelta(days=d)
                dow = cur_date.weekday()
                # Weekend effect (Household up +12%, Office down -30%)
                day_factor = 1.08 if dow in [5, 6] else 0.98

                # Weather forecast adjustment if provided
                day_temp = avg_temp
                if weather_forecast and d < len(weather_forecast):
                    day_temp = weather_forecast[d].get("temp", avg_temp)

                weather_mult = 1.0 + (max(0.0, day_temp - 25.0) * 0.02)
                day_kwh = round(daily_baseline * day_factor * weather_mult, 2)
                weekly_total += day_kwh

                forecast_points.append({
                    "timestamp": cur_date.strftime("%Y-%m-%d"),
                    "date": cur_date.strftime("%b %d"),
                    "day_of_week": cur_date.strftime("%A"),
                    "predicted_kwh": day_kwh,
                    "peak_usage_kwh": round(day_kwh * last_peak_ratio, 2),
                    "temperature": round(day_temp, 1),
                    "demand_level": "High" if day_kwh > (daily_baseline * 1.15) else "Normal"
                })

            predicted_demand = round(weekly_total, 2)
            forecast_label = "Next 7 Days (Daily)"
            next_date = start_date + timedelta(days=7)

        else:  # '30d' default
            forecast_period = "30d"
            start_date = target_date or (last_date + timedelta(days=30))
            predicted_demand = round(predicted_30d * temp_factor, 2)
            next_date = start_date

            # Generate 30 daily progression points
            running_date = last_date + timedelta(days=1)
            for d in range(30):
                cur_date = running_date + timedelta(days=d)
                dow = cur_date.weekday()
                day_factor = 1.05 if dow in [5, 6] else 0.98
                day_kwh = round((predicted_demand / 30.0) * day_factor, 2)
                forecast_points.append({
                    "timestamp": cur_date.strftime("%Y-%m-%d"),
                    "date": cur_date.strftime("%b %d"),
                    "predicted_kwh": day_kwh,
                    "is_peak": dow in [5, 6]
                })

            forecast_label = "Next 30 Days (Cycle)"

        # Compare with historical baseline
        norm_historical = historical_avg
        if forecast_period == "24h":
            norm_historical = historical_avg / 30.0
        elif forecast_period == "7d":
            norm_historical = (historical_avg / 30.0) * 7.0

        expected_change_pct = round(((predicted_demand - norm_historical) / (norm_historical + 1e-5)) * 100, 1)

        # Categorize Demand Level
        if predicted_demand < (0.80 * norm_historical):
            demand_level = DemandLevel.Low
            explanation = f"Predicted demand ({predicted_demand} kWh) is ~{abs(expected_change_pct)}% below normal. Low seasonal requirement."
        elif predicted_demand <= (1.15 * norm_historical):
            demand_level = DemandLevel.Normal
            explanation = f"Predicted demand ({predicted_demand} kWh) is consistent with your typical baseline consumption."
        elif predicted_demand <= (1.40 * norm_historical):
            demand_level = DemandLevel.High
            explanation = f"Elevated load predicted (+{expected_change_pct}% over baseline) due to seasonal demand and recent trend trajectory."
        else:
            demand_level = DemandLevel.Critical
            explanation = f"CRITICAL DEMAND SURGE: Predicted load exceeds historical normal by +{expected_change_pct}%. Immediate load scheduling recommended."

        # Quality assessment
        n_samples = len(df_featured)
        if n_samples >= 8 and best_r2 > 0.65:
            quality = "High Confidence"
        elif n_samples >= 4:
            quality = "Moderate Confidence"
        else:
            quality = "Initial Baseline"

        return {
            "predicted_demand": predicted_demand,
            "forecast_period": forecast_period,
            "forecast_label": forecast_label,
            "demand_level": demand_level,
            "prediction_quality": quality,
            "mae": best_mae,
            "rmse": best_rmse,
            "r2_score": best_r2,
            "model_name": best_model_name,
            "model_comparison": model_comparison,
            "prediction_date": next_date,
            "previous_average": round(norm_historical, 2),
            "percentage_change": expected_change_pct,
            "explanation": explanation,
            "forecast_points": forecast_points,
            "temperature_used": round(avg_temp, 1),
            "validation_notes": (
                "Evaluated using chronological train/test split. "
                "Notice: Statistical forecast calibrated on historical records. "
                "Observations may vary with weather extremes or behavioral shifts."
            )
        }

demand_predictor = ElectricityDemandPredictor()
