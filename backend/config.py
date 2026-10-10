import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ElectroWise — Smart Energy Intelligence Platform"
    PROJECT_VERSION: str = "2.0.0"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smart_energy.db")
    
    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smart-energy-platform-super-secret-key-2026-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Tariff Defaults
    BASE_TARIFF_RATE: float = float(os.getenv("BASE_TARIFF_RATE", "7.50"))
    PEAK_TARIFF_MULTIPLIER: float = float(os.getenv("PEAK_TARIFF_MULTIPLIER", "1.40"))
    TAX_PERCENTAGE: float = float(os.getenv("TAX_PERCENTAGE", "5.00"))
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: Optional[str] = os.getenv("FIREBASE_CREDENTIALS_PATH", None)
    FIREBASE_PROJECT_ID: Optional[str] = os.getenv("FIREBASE_PROJECT_ID", None)
    
    # Server
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
