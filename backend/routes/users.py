from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.schemas.user_schema import UserResponse, UserProfileUpdateRequest
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/profile", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
def update_user_profile(
    req: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.name is not None:
        current_user.name = req.name.strip()
    if req.consumer_type is not None:
        current_user.consumer_type = req.consumer_type
    if req.location is not None:
        current_user.location = req.location.strip()
    if req.monthly_budget is not None:
        current_user.monthly_budget = round(req.monthly_budget, 2)
    if req.avg_monthly_consumption is not None:
        current_user.avg_monthly_consumption = round(req.avg_monthly_consumption, 2)
    if req.notification_enabled is not None:
        current_user.notification_enabled = req.notification_enabled

    # Energy intelligence settings
    if req.demand_threshold_low is not None:
        current_user.demand_threshold_low = req.demand_threshold_low
    if req.demand_threshold_medium is not None:
        current_user.demand_threshold_medium = req.demand_threshold_medium
    if req.demand_threshold_high is not None:
        current_user.demand_threshold_high = req.demand_threshold_high
    if req.base_tariff_rate is not None:
        current_user.base_tariff_rate = req.base_tariff_rate
    if req.peak_tariff_multiplier is not None:
        current_user.peak_tariff_multiplier = req.peak_tariff_multiplier
    if req.fixed_charges is not None:
        current_user.fixed_charges = req.fixed_charges
    if req.tax_percentage is not None:
        current_user.tax_percentage = req.tax_percentage
    if req.grid_emission_factor is not None:
        current_user.grid_emission_factor = req.grid_emission_factor
    if req.weather_city is not None:
        current_user.weather_city = req.weather_city.strip()
    if req.weather_latitude is not None:
        current_user.weather_latitude = req.weather_latitude
    if req.weather_longitude is not None:
        current_user.weather_longitude = req.weather_longitude
    if req.demo_mode is not None:
        current_user.demo_mode = req.demo_mode

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
