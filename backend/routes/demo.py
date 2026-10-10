from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.services.demo_data_service import demo_data_service
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/demo", tags=["Demonstration Mode"])

@router.get("/status")
def get_demo_status(current_user: User = Depends(get_current_user)):
    return {
        "demo_mode": bool(current_user.demo_mode),
        "user_email": current_user.email
    }

@router.post("/load", status_code=status.HTTP_200_OK)
def load_demo_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    loaded_count = demo_data_service.load_demo_data(db, current_user)
    return {
        "status": "success",
        "demo_mode": True,
        "records_loaded": loaded_count,
        "message": f"Successfully loaded {loaded_count} months of realistic DEMO DATA for evaluation. All AI prediction, weather, peak, and simulator features are now calibrated."
    }

@router.post("/clear", status_code=status.HTTP_200_OK)
def clear_demo_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cleared_count = demo_data_service.clear_demo_data(db, current_user)
    return {
        "status": "success",
        "demo_mode": False,
        "records_cleared": cleared_count,
        "message": "Demo data cleared. Switched to clean real-data mode."
    }
