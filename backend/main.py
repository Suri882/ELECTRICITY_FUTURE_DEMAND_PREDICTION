from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.models.user import User, UserRole, ConsumerType
from backend.utils.security import hash_password

# Import routers
from backend.routes.auth import router as auth_router
from backend.routes.users import router as users_router
from backend.routes.consumption import router as consumption_router
from backend.routes.predictions import router as predictions_router
from backend.routes.analytics import router as analytics_router
from backend.routes.anomalies import router as anomalies_router
from backend.routes.recommendations import router as recommendations_router
from backend.routes.alerts import router as alerts_router
from backend.routes.reports import router as reports_router
from backend.routes.admin import router as admin_router
from backend.routes.weather import router as weather_router
from backend.routes.peak_demand import router as peak_demand_router
from backend.routes.billing import router as billing_router
from backend.routes.simulator import router as simulator_router
from backend.routes.carbon import router as carbon_router
from backend.routes.demo import router as demo_router
from backend.routes.projects import router as projects_router
from backend.database_migration import run_migrations

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables and columns exist safely
    Base.metadata.create_all(bind=engine)
    try:
        run_migrations()
    except Exception as e:
        print(f"Migration check notice: {e}")

    # Seed initial Admin user if not present
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@smartenergy.com").first()
        if not admin_user:
            admin_user = User(
                name="System Administrator",
                email="admin@smartenergy.com",
                phone="+91 9876543210",
                password_hash=hash_password("Admin@12345"),
                role=UserRole.ADMIN,
                consumer_type=ConsumerType.Office,
                monthly_budget=50000.0,
                avg_monthly_consumption=5000.0,
                notification_enabled=True
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()

    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=(
        "Production-grade software platform for smart electricity demand prediction, "
        "consumption analytics, statistical anomaly detection, cost intelligence, and "
        "energy optimization recommendations."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route controllers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(consumption_router)
app.include_router(predictions_router)
app.include_router(analytics_router)
app.include_router(anomalies_router)
app.include_router(recommendations_router)
app.include_router(alerts_router)
app.include_router(reports_router)
app.include_router(admin_router)
app.include_router(weather_router)
app.include_router(peak_demand_router)
app.include_router(billing_router)
app.include_router(simulator_router)
app.include_router(carbon_router)
app.include_router(demo_router)
app.include_router(projects_router)

@app.get("/", tags=["System"])
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
