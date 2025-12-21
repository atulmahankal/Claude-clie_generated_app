from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from ..database import Base


class User(Base):
    """User model"""
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(255))
    avatar_url = Column(String(500))
    phone_number = Column(String(20))
    bio = Column(Text)

    # 2FA fields
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255))

    # Email verification
    pending_email = Column(String(255))
    email_verification_code = Column(String(10))
    email_verification_expires_at = Column(DateTime)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'email': self.email,
            'display_name': self.display_name,
            'avatar_url': self.avatar_url,
            'phone_number': self.phone_number,
            'bio': self.bio,
            'two_factor_enabled': self.two_factor_enabled,
            'pending_email': self.pending_email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
