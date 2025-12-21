from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from ..database import Base


class Session(Base):
    """Active session model"""
    __tablename__ = "active_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    token = Column(Text, nullable=False, unique=True, index=True)
    refresh_token = Column(Text, nullable=False, unique=True, index=True)

    # Device information
    device_type = Column(String(50))
    device_info = Column(Text)
    ip_address = Column(String(45))
    user_agent = Column(Text)

    # Session management
    expires_at = Column(DateTime, nullable=False)
    last_active = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Revocation
    revoked_at = Column(DateTime)
    revoke_reason = Column(String(255))

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'device_type': self.device_type,
            'device_info': self.device_info,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'last_active': self.last_active.isoformat() if self.last_active else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'revoked_at': self.revoked_at.isoformat() if self.revoked_at else None,
            'revoke_reason': self.revoke_reason,
        }
