from pydantic import BaseModel, Field, field_serializer
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class ServiceConfigBase(BaseModel):
    """Base schema for service configuration"""
    service_name: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    icon_url: Optional[str] = None
    path: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#3B82F6", max_length=20)
    enabled: bool = True
    sort_order: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict, validation_alias="service_metadata")


class ServiceConfigCreate(ServiceConfigBase):
    """Schema for creating service configuration"""
    pass


class ServiceConfigUpdate(BaseModel):
    """Schema for updating service configuration"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    icon_url: Optional[str] = None
    color: Optional[str] = Field(None, max_length=20)
    enabled: Optional[bool] = None
    sort_order: Optional[int] = None
    service_metadata: Optional[Dict[str, Any]] = Field(None, alias="metadata")


class ServiceConfigResponse(ServiceConfigBase):
    """Schema for service configuration response"""
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }

    @field_serializer("id")
    def serialize_id(self, id: UUID) -> str:
        return str(id)
