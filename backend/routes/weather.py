from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models.user import User
from backend.models.electricity_record import ElectricityRecord
from backend.services.weather_service import weather_service
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/weather", tags=["Weather Intelligence"])

@router.get("/current")
def get_current_weather(
    manual_temp: Optional[float] = Query(None, description="Optional manual temperature override"),
    current_user: User = Depends(get_current_user)
):
    lat = current_user.weather_latitude or 12.9716
    lon = current_user.weather_longitude or 77.5946
    city = current_user.weather_city or "Bengaluru"
    return weather_service.fetch_live_weather(lat=lat, lon=lon, city=city, manual_temp=manual_temp)

@router.get("/analysis")
def get_weather_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lat = current_user.weather_latitude or 12.9716
    lon = current_user.weather_longitude or 77.5946
    city = current_user.weather_city or "Bengaluru"

    weather_data = weather_service.fetch_live_weather(lat=lat, lon=lon, city=city)
    records = db.query(ElectricityRecord).filter(ElectricityRecord.user_id == current_user.id).order_by(ElectricityRecord.date.asc()).all()

    avg_consumption = sum(r.units_consumed for r in records) / len(records) if records else 420.0
    cdd = weather_data["current"]["cooling_degree_days"]
    surge_pct = weather_data["weather_warning"]["cooling_surge_pct"]

    # Comparative load estimates across weather categories
    weather_scenarios = [
        {
            "condition": "High Heat (> 32°C)",
            "temperature_range": "32°C – 40°C",
            "cooling_multiplier": 1.25,
            "estimated_daily_kwh": round((avg_consumption / 30.0) * 1.25, 2),
            "air_conditioning_duty_cycle": "High (Compressor ~75% active)"
        },
        {
            "condition": "Warm Ambient (26°C – 32°C)",
            "temperature_range": "26°C – 31°C",
            "cooling_multiplier": 1.10,
            "estimated_daily_kwh": round((avg_consumption / 30.0) * 1.10, 2),
            "air_conditioning_duty_cycle": "Moderate (~45% active)"
        },
        {
            "condition": "Comfortable / Mild (20°C – 25°C)",
            "temperature_range": "20°C – 25°C",
            "cooling_multiplier": 0.95,
            "estimated_daily_kwh": round((avg_consumption / 30.0) * 0.95, 2),
            "air_conditioning_duty_cycle": "Minimal / Passive Fan"
        },
        {
            "condition": "Cool / Rainy (< 20°C)",
            "temperature_range": "14°C – 19°C",
            "cooling_multiplier": 0.98,
            "estimated_daily_kwh": round((avg_consumption / 30.0) * 0.98, 2),
            "air_conditioning_duty_cycle": "Off (Water Geyser Active)"
        }
    ]

    return {
        "weather_data": weather_data,
        "temperature_sensitivity_rate": "Approximately +4.2% electricity consumption per °C above 24°C cooling threshold",
        "current_cooling_degree_days": cdd,
        "current_weather_surge_pct": surge_pct,
        "weather_scenarios_comparison": weather_scenarios
    }
