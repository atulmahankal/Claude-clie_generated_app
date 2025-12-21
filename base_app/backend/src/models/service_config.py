from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from ..database import Base


class ServiceConfig(Base):
    """Service configuration model"""
    __tablename__ = "service_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_name = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)
    icon_url = Column(String(500))
    path = Column(String(100), nullable=False)
    color = Column(String(20), default="#3B82F6")
    enabled = Column(Boolean, default=True, index=True)
    sort_order = Column(Integer, default=0, index=True)
    metadata = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'service_name': self.service_name,
            'display_name': self.display_name,
            'description': self.description,
            'icon_url': self.icon_url,
            'path': self.path,
            'color': self.color,
            'enabled': self.enabled,
            'sort_order': self.sort_order,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class UserRole(Base):
    """User roles model"""
    __tablename__ = "user_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
