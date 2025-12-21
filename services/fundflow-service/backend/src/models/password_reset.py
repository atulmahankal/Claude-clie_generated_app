from sqlalchemy import Column, String, DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from ..database import Base


class PasswordResetCode(Base):
    """Password reset code model"""
    __tablename__ = "password_reset_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'code': self.code,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'attempts': self.attempts,
            'max_attempts': self.max_attempts,
            'used': self.used,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
