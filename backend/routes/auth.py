from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from backend.database import get_db
from backend.models.user import User, UserRole, ConsumerType
from backend.schemas.user_schema import (
    UserRegisterRequest,
    UserLoginRequest,
    ForgotPasswordRequest,
    UserResponse,
    TokenResponse
)
from backend.utils.security import hash_password, verify_password, create_access_token
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Determine role (allow admin email override for system bootstrap)
    role = UserRole.ADMIN if req.email.lower() == "admin@smartenergy.com" else UserRole.USER

    user = User(
        name=req.name.strip(),
        email=req.email.lower().strip(),
        phone=(req.phone or "").strip(),
        password_hash=hash_password(req.password),
        role=role,
        consumer_type=req.consumer_type or ConsumerType.Household,
        monthly_budget=0.0,
        avg_monthly_consumption=0.0,
        notification_enabled=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.email, "role": user.role.value, "id": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": user.email, "role": user.role.value, "id": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found matching this email address."
        )

    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password reset successfully. You can now login with your new password."}

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
