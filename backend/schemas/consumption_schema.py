from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class ConsumptionCreate(BaseModel):
    date: date
    units_consumed: float = Field(..., gt=0, description="Electricity consumption in kWh/units")
    bill_amount: float = Field(..., ge=0, description="Billed amount in currency units")
    number_of_days: int = Field(30, gt=0, le=366, description="Billing cycle duration in days")
    peak_usage: float = Field(0.0, ge=0, description="Peak hours consumption in units")

class ConsumptionResponse(BaseModel):
    id: int
    user_id: int
    date: date
    units_consumed: float
    bill_amount: float
    number_of_days: int
    peak_usage: float
    created_at: datetime

    class Config:
        from_attributes = True

class CSVErrorDetail(BaseModel):
    row: int
    field: str
    message: str

class CSVUploadSummary(BaseModel):
    total_rows: int
    successful_rows: int
    failed_rows: int
    error_details: List[CSVErrorDetail] = []
    message: str
