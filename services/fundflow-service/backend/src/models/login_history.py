from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from ..database import Base


class LoginHistory(Base):
    """Login history audit log"""
    __tablename__ = "login_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    device_info = Column(Text)
    success = Column(Boolean, default=False)
    failure_reason = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'device_info': self.device_info,
            'success': self.success,
            'failure_reason': self.failure_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
