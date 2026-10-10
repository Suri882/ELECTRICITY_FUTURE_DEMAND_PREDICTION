from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from backend.models.user import UserRole, ConsumerType

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: Optional[str] = ""
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None
    consumer_type: Optional[ConsumerType] = ConsumerType.Household

    @field_validator("confirm_password")
    def passwords_match(cls, v, values):
        if v is not None and "password" in values.data and v != values.data["password"]:
            raise ValueError("Passwords do not match")
        return v

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)
    confirm_new_password: str = Field(..., min_length=6)

    @field_validator("confirm_new_password")
    def passwords_match(cls, v, values):
        if "new_password" in values.data and v != values.data["new_password"]:
            raise ValueError("New passwords do not match")
        return v

class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    consumer_type: Optional[ConsumerType] = None
    location: Optional[str] = None
    monthly_budget: Optional[float] = Field(None, ge=0.0)
    avg_monthly_consumption: Optional[float] = Field(None, ge=0.0)
    notification_enabled: Optional[bool] = None

    # Energy intelligence settings
    demand_threshold_low: Optional[float] = None
    demand_threshold_medium: Optional[float] = None
    demand_threshold_high: Optional[float] = None
    base_tariff_rate: Optional[float] = None
    peak_tariff_multiplier: Optional[float] = None
    fixed_charges: Optional[float] = None
    tax_percentage: Optional[float] = None
    grid_emission_factor: Optional[float] = None
    weather_city: Optional[str] = None
    weather_latitude: Optional[float] = None
    weather_longitude: Optional[float] = None
    demo_mode: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = ""
    role: UserRole
    consumer_type: ConsumerType
    location: Optional[str] = None
    monthly_budget: float
    avg_monthly_consumption: float
    notification_enabled: bool
    demand_threshold_low: Optional[float] = 250.0
    demand_threshold_medium: Optional[float] = 450.0
    demand_threshold_high: Optional[float] = 700.0
    base_tariff_rate: Optional[float] = 7.50
    peak_tariff_multiplier: Optional[float] = 1.40
    fixed_charges: Optional[float] = 120.0
    tax_percentage: Optional[float] = 5.0
    grid_emission_factor: Optional[float] = 0.82
    weather_city: Optional[str] = "Bengaluru"
    weather_latitude: Optional[float] = 12.9716
    weather_longitude: Optional[float] = 77.5946
    demo_mode: Optional[bool] = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
