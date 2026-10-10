from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from backend.models.prediction import DemandLevel

class PredictionRequest(BaseModel):
    record_id: Optional[int] = None
    target_date: Optional[date] = None
    forecast_period: Optional[str] = "30d"  # "24h", "7d", "30d"
    manual_temp: Optional[float] = None

class ModelEvaluationMetrics(BaseModel):
    mae: float
    rmse: float
    r2_score: float
    model_name: str
    samples_trained: int

class PredictionResponse(BaseModel):
    id: int
    user_id: int
    record_id: Optional[int] = None
    predicted_demand: float
    demand_level: DemandLevel
    prediction_quality: str
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2_score: Optional[float] = None
    model_name: str
    prediction_date: date
    forecast_period: Optional[str] = "30d"
    temperature_used: Optional[float] = None
    created_at: datetime
    previous_average: float
    percentage_change: float
    explanation: str
    model_comparison: Optional[List[Dict[str, Any]]] = None
    forecast_points: Optional[List[Dict[str, Any]]] = None
    validation_notes: Optional[str] = None

    class Config:
        from_attributes = True

class ModelComparisonResult(BaseModel):
    model_name: str
    mae: float
    rmse: float
    r2_score: float
    is_best: bool
