from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from ..database import Base


class RateLimit(Base):
    """Rate limit tracking model"""
    __tablename__ = "rate_limits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    identifier = Column(String(255), nullable=False, index=True)  # email or IP
    action = Column(String(50), nullable=False, index=True)  # type of operation
    attempt_count = Column(Integer, default=1)
    window_start = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'identifier': self.identifier,
            'action': self.action,
            'attempt_count': self.attempt_count,
            'window_start': self.window_start.isoformat() if self.window_start else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
