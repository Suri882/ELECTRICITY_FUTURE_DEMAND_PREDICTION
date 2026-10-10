import logging
from typing import Optional, List
from sqlalchemy.orm import Session
from backend.models.alert import Alert, AlertType, AlertSeverity
from backend.models.notification_token import NotificationToken
from backend.models.user import User
from backend.config import settings

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Manages in-app alerts and Firebase Cloud Messaging (FCM) push notifications.
    Safely delivers alerts and prevents duplicate bursts.
    """

    def send_notification(
        self,
        db: Session,
        user_id: int,
        alert_type: AlertType,
        title: str,
        message: str,
        severity: AlertSeverity = AlertSeverity.Info
    ) -> Optional[Alert]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.notification_enabled:
            return None

        # Check duplicate recent alert within the same alert_type with exact title
        existing = db.query(Alert).filter(
            Alert.user_id == user_id,
            Alert.alert_type == alert_type,
            Alert.title == title,
            Alert.is_read == False
        ).first()

        if existing:
            # Avoid flooding the user with duplicate unread alerts
            return existing

        # Create in-app alert record
        alert = Alert(
            user_id=user_id,
            alert_type=alert_type,
            title=title,
            message=message,
            severity=severity,
            is_read=False
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        # Dispatch FCM push notification if credentials and tokens exist
        self._dispatch_fcm_push(db, user_id, title, message)

        return alert

    def _dispatch_fcm_push(self, db: Session, user_id: int, title: str, message: str):
        """
        Pushes to Firebase Cloud Messaging if configured.
        Falls back gracefully without disrupting user flow.
        """
        tokens = db.query(NotificationToken).filter(NotificationToken.user_id == user_id).all()
        if not tokens:
            return

        if not settings.FIREBASE_CREDENTIALS_PATH:
            logger.info(f"[Mock FCM Push to {len(tokens)} devices for User {user_id}]: {title} - {message}")
            return

        try:
            # If Firebase Admin SDK is configured with service credentials
            import firebase_admin
            from firebase_admin import messaging, credentials
            
            if not firebase_admin._apps:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)

            registration_tokens = [t.device_token for t in tokens]
            multicast_message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=message,
                ),
                tokens=registration_tokens,
            )
            response = messaging.send_each_for_multicast(multicast_message)
            logger.info(f"FCM multicast success count: {response.success_count}")
        except Exception as e:
            logger.warning(f"FCM dispatch error: {str(e)}")

notification_service = NotificationService()
