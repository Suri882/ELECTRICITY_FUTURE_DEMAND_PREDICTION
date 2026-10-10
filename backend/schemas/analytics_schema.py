from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SummaryCardsResponse(BaseModel):
    has_data: bool
    current_consumption: Optional[float] = None
    predicted_demand: Optional[float] = None
    demand_level: Optional[str] = None
    efficiency_score: Optional[int] = None
    previous_average: Optional[float] = None
    percentage_change: Optional[float] = None
    records_count: int = 0

class ScoreFactorDetail(BaseModel):
    name: str
    weight: int
    score: float
    description: str

class EfficiencyScoreResponse(BaseModel):
    overall_score: int
    category: str  # Excellent, Good, Moderate, Needs Improvement
    factors: List[ScoreFactorDetail]
    summary: str

class CostAnalysisResponse(BaseModel):
    current_bill: float
    previous_bill: float
    cost_difference: float
    consumption_difference: float
    monthly_budget: float
    is_budget_exceeded: bool
    budget_usage_percent: float
    message: str

class PeakDemandPeriod(BaseModel):
    date: str
    units_consumed: float
    peak_usage: float
    peak_ratio_percent: float

class PeakDemandAnalysisResponse(BaseModel):
    peak_demand: float
    average_demand: float
    peak_percentage: float
    peak_periods: List[PeakDemandPeriod]
    historical_peak_comparison: str

class HistoricalChartPoint(BaseModel):
    date: str
    units_consumed: float
    bill_amount: float
    peak_usage: float

class PredictedVsActualPoint(BaseModel):
    date: str
    actual: Optional[float] = None
    predicted: Optional[float] = None

class MonthlyBillPoint(BaseModel):
    month: str
    bill_amount: float
    units_consumed: float
    budget: float

class AnalyticsDashboardData(BaseModel):
    summary: SummaryCardsResponse
    historical_consumption: List[HistoricalChartPoint]
    predicted_vs_actual: List[PredictedVsActualPoint]
    monthly_bill: List[MonthlyBillPoint]
    peak_analysis: Optional[PeakDemandAnalysisResponse] = None
    efficiency_breakdown: Optional[EfficiencyScoreResponse] = None
    cost_analysis: Optional[CostAnalysisResponse] = None
