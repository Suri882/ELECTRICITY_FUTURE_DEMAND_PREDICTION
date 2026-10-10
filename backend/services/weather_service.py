import os
import json
import urllib.request
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

# Weather code mapping according to WMO standard (used by Open-Meteo)
WMO_WEATHER_MAP = {
    0: ("Clear sky", "☀️", "clear"),
    1: ("Mainly clear", "🌤️", "clear"),
    2: ("Partly cloudy", "⛅", "cloudy"),
    3: ("Overcast", "☁️", "cloudy"),
    45: ("Foggy", "🌫️", "fog"),
    48: ("Depositing rime fog", "🌫️", "fog"),
    51: ("Light drizzle", "🌦️", "rain"),
    53: ("Moderate drizzle", "🌦️", "rain"),
    55: ("Dense drizzle", "🌧️", "rain"),
    61: ("Slight rain", "🌧️", "rain"),
    63: ("Moderate rain", "🌧️", "rain"),
    65: ("Heavy rain", "🌧️", "rain"),
    71: ("Slight snow", "🌨️", "snow"),
    80: ("Rain showers", "🌦️", "rain"),
    81: ("Moderate showers", "🌧️", "rain"),
    82: ("Violent rain showers", "⛈️", "storm"),
    95: ("Thunderstorm", "⛈️", "storm"),
}

class WeatherIntelligenceService:
    """
    Production Weather Integration & Demand Correlation Service.
    Queries live meteorological APIs (Open-Meteo / OpenWeatherMap)
    or falls back gracefully to manual input / seasonal baselines.
    Distinguishes actual observations from forecast data.
    """

    def __init__(self):
        self.openweather_api_key = os.getenv("OPENWEATHER_API_KEY", None)

    def fetch_live_weather(
        self,
        lat: float = 12.9716,
        lon: float = 77.5946,
        city: str = "Bengaluru",
        manual_temp: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Fetches current weather observations + 7-day forecast.
        Falls back safely to manual_temp or seasonal normal if network fails.
        """
        # If manual temperature is explicitly forced
        if manual_temp is not None:
            return self._build_manual_weather(manual_temp, city, lat, lon)

        try:
            url = (
                f"https://api.open-meteo.com/v1/forecast?"
                f"latitude={lat}&longitude={lon}&"
                f"current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&"
                f"hourly=temperature_2m,weather_code&"
                f"daily=temperature_2m_max,temperature_2m_min,weather_code&"
                f"timezone=auto&forecast_days=7"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "SmartEnergyForecast/2.0"})
            with urllib.request.urlopen(req, timeout=6) as response:
                data = json.loads(response.read().decode())

            current_raw = data.get("current", {})
            hourly_raw = data.get("hourly", {})
            daily_raw = data.get("daily", {})

            w_code = current_raw.get("weather_code", 0)
            condition_desc, emoji, category = WMO_WEATHER_MAP.get(w_code, ("Clear", "☀️", "clear"))
            current_temp = float(current_raw.get("temperature_2m", 26.0))
            humidity = float(current_raw.get("relative_humidity_2m", 55.0))
            apparent_temp = float(current_raw.get("apparent_temperature", current_temp))

            # Parse next 24 hourly points
            hourly_forecast = []
            h_times = hourly_raw.get("time", [])[:24]
            h_temps = hourly_raw.get("temperature_2m", [])[:24]
            h_codes = hourly_raw.get("weather_code", [])[:24]
            for i in range(len(h_times)):
                code = h_codes[i] if i < len(h_codes) else 0
                desc, em, _ = WMO_WEATHER_MAP.get(code, ("Clear", "☀️", "clear"))
                t_val = float(h_temps[i]) if i < len(h_temps) else current_temp
                time_str = h_times[i]
                hour_label = time_str.split("T")[-1] if "T" in time_str else f"{i:02d}:00"
                hourly_forecast.append({
                    "time": time_str,
                    "hour": hour_label,
                    "temperature": round(t_val, 1),
                    "condition": desc,
                    "icon": em,
                    "cooling_degree_days": round(max(0.0, t_val - 24.0), 2)
                })

            # Parse 7-day daily forecast
            daily_forecast = []
            d_times = daily_raw.get("time", [])[:7]
            d_max = daily_raw.get("temperature_2m_max", [])[:7]
            d_min = daily_raw.get("temperature_2m_min", [])[:7]
            d_codes = daily_raw.get("weather_code", [])[:7]
            for i in range(len(d_times)):
                max_t = float(d_max[i]) if i < len(d_max) else current_temp + 3
                min_t = float(d_min[i]) if i < len(d_min) else current_temp - 4
                avg_t = (max_t + min_t) / 2.0
                code = d_codes[i] if i < len(d_codes) else 0
                desc, em, _ = WMO_WEATHER_MAP.get(code, ("Partly Cloudy", "⛅", "cloudy"))
                daily_forecast.append({
                    "date": d_times[i],
                    "temp_max": round(max_t, 1),
                    "temp_min": round(min_t, 1),
                    "temp_avg": round(avg_t, 1),
                    "temp": round(avg_t, 1),
                    "condition": desc,
                    "icon": em
                })

            return self._synthesize_weather_intelligence(
                city=city,
                lat=lat,
                lon=lon,
                current_temp=current_temp,
                humidity=humidity,
                apparent_temp=apparent_temp,
                condition=condition_desc,
                icon=emoji,
                source="Live Open-Meteo Meteorological Service",
                is_live=True,
                hourly_forecast=hourly_forecast,
                daily_forecast=daily_forecast
            )

        except Exception as e:
            logger.warning(f"Live weather API fetch failed ({e}). Falling back to seasonal profile.")
            return self._build_manual_weather(27.5, city, lat, lon, is_fallback=True)

    def _build_manual_weather(
        self,
        temp: float,
        city: str,
        lat: float,
        lon: float,
        is_fallback: bool = False
    ) -> Dict[str, Any]:
        """Constructs synthetic hourly and 7-day weather when manual or fallback is active."""
        source = "Seasonal Regional Baseline" if is_fallback else "Manual User Input"
        now = datetime.now()

        hourly_forecast = []
        for h in range(24):
            h_temp = temp + 4.0 * ((h - 12) / 12.0 if h <= 12 else (24 - h) / 12.0)
            hourly_forecast.append({
                "time": f"Hour {h:02d}:00",
                "hour": f"{h:02d}:00",
                "temperature": round(h_temp, 1),
                "condition": "Manual Profile",
                "icon": "🌡️",
                "cooling_degree_days": round(max(0.0, h_temp - 24.0), 2)
            })

        daily_forecast = []
        for d in range(7):
            daily_forecast.append({
                "date": f"Day +{d+1}",
                "temp_max": round(temp + 3.0, 1),
                "temp_min": round(temp - 4.0, 1),
                "temp_avg": round(temp, 1),
                "temp": round(temp, 1),
                "condition": "Estimated Normal",
                "icon": "🌤️"
            })

        return self._synthesize_weather_intelligence(
            city=city,
            lat=lat,
            lon=lon,
            current_temp=temp,
            humidity=50.0,
            apparent_temp=temp,
            condition="User Specified / Fallback",
            icon="🌡️",
            source=source,
            is_live=False,
            hourly_forecast=hourly_forecast,
            daily_forecast=daily_forecast
        )

    def _synthesize_weather_intelligence(
        self,
        city: str,
        lat: float,
        lon: float,
        current_temp: float,
        humidity: float,
        apparent_temp: float,
        condition: str,
        icon: str,
        source: str,
        is_live: bool,
        hourly_forecast: List[Dict[str, Any]],
        daily_forecast: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Computes energy impact warnings, cooling/heating degree days,
        and demand sensitivity metrics.
        """
        # Baseline threshold for cooling is 24°C; heating is 18°C
        cdd = max(0.0, current_temp - 24.0)
        hdd = max(0.0, 18.0 - current_temp)

        # Estimate HVAC load multiplier (air conditioner efficiency drops & runs longer with higher heat)
        # Empirical rule: ~3.5% to 5.0% electricity increase per °C above 24°C
        cooling_load_impact_pct = round(cdd * 4.2, 1)

        # Classify weather alert severity
        if current_temp >= 35.0:
            severity = "Critical"
            warning_title = "🔥 Heatwave Alert: Heavy Cooling Surge Anticipated"
            warning_msg = (
                f"Observed temperature is {current_temp}°C (Heat Index: {apparent_temp}°C). "
                f"Air conditioning systems will operate at high duty cycle, adding an estimated "
                f"+{cooling_load_impact_pct}% to baseline daily consumption. Pre-cooling before 12:00 is advised."
            )
        elif current_temp >= 30.0:
            severity = "Warning"
            warning_title = "☀️ High Temperature Notice"
            warning_msg = (
                f"Temperature of {current_temp}°C increases cooling demand by approximately "
                f"+{cooling_load_impact_pct}%. Consider raising AC setpoints by 1–2°C."
            )
        elif current_temp <= 15.0:
            severity = "Info"
            warning_title = "❄️ Cool Weather Notice"
            warning_msg = (
                f"Temperature of {current_temp}°C indicates potential water heater and space heating usage."
            )
        else:
            severity = "Optimal"
            warning_title = "🌿 Optimal Weather Zone"
            warning_msg = (
                f"Comfortable ambient temperature of {current_temp}°C. Natural ventilation can "
                f"minimize HVAC and refrigeration electricity load."
            )

        # Weather condition demand category
        if current_temp >= 32.0:
            condition_category = "High Heat (Elevated AC Demand)"
        elif current_temp >= 26.0:
            condition_category = "Warm (Moderate Demand)"
        elif current_temp >= 20.0:
            condition_category = "Mild / Comfortable (Low HVAC Load)"
        else:
            condition_category = "Cool (Heating / Geyser Demand)"

        return {
            "city": city,
            "latitude": lat,
            "longitude": lon,
            "data_source": source,
            "is_live_observation": is_live,
            "observation_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "current": {
                "temperature": round(current_temp, 1),
                "apparent_temperature": round(apparent_temp, 1),
                "humidity": round(humidity, 1),
                "condition": condition,
                "icon": icon,
                "cooling_degree_days": round(cdd, 2),
                "heating_degree_days": round(hdd, 2),
                "condition_category": condition_category
            },
            "weather_warning": {
                "severity": severity,
                "title": warning_title,
                "message": warning_msg,
                "cooling_surge_pct": cooling_load_impact_pct
            },
            "hourly_forecast": hourly_forecast,
            "daily_forecast": daily_forecast
        }

weather_service = WeatherIntelligenceService()
