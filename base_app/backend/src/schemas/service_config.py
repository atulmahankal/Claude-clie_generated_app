from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


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
    metadata: Dict[str, Any] = Field(default_factory=dict)


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
    metadata: Optional[Dict[str, Any]] = None


class ServiceConfigResponse(ServiceConfigBase):
    """Schema for service configuration response"""
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
