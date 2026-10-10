from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.database import Base

class NotificationToken(Base):
    __tablename__ = "notification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_token = Column(String(255), nullable=False)
    platform = Column(String(50), default="web", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'device_token', name='uq_user_device'),
    )

    # Relationships
    user = relationship("User", back_populates="notification_tokens")
