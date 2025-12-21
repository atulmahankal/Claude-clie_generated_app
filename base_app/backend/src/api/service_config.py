from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.service_config import ServiceConfig
from ..schemas.service_config import (
    ServiceConfigCreate,
    ServiceConfigUpdate,
    ServiceConfigResponse
)

router = APIRouter(prefix="/api/config", tags=["service-config"])


@router.get("/services", response_model=List[ServiceConfigResponse])
async def get_enabled_services(db: Session = Depends(get_db)):
    """Get all enabled services"""
    services = db.query(ServiceConfig).filter(
        ServiceConfig.enabled == True
    ).order_by(ServiceConfig.sort_order).all()

    return services


@router.get("/services/all", response_model=List[ServiceConfigResponse])
async def get_all_services(db: Session = Depends(get_db)):
    """Get all services (including disabled)"""
    services = db.query(ServiceConfig).order_by(
        ServiceConfig.sort_order
    ).all()

    return services


@router.get("/services/{service_name}", response_model=ServiceConfigResponse)
async def get_service(service_name: str, db: Session = Depends(get_db)):
    """Get service by name"""
    service = db.query(ServiceConfig).filter(
        ServiceConfig.service_name == service_name
    ).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{service_name}' not found"
        )

    return service


@router.post("/services", response_model=ServiceConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_data: ServiceConfigCreate,
    db: Session = Depends(get_db)
):
    """Create a new service configuration"""
    # Check if service already exists
    existing = db.query(ServiceConfig).filter(
        ServiceConfig.service_name == service_data.service_name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Service '{service_data.service_name}' already exists"
        )

    # Create new service
    service = ServiceConfig(**service_data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)

    return service


@router.put("/services/{service_name}", response_model=ServiceConfigResponse)
async def update_service(
    service_name: str,
    update_data: ServiceConfigUpdate,
    db: Session = Depends(get_db)
):
    """Update service configuration"""
    service = db.query(ServiceConfig).filter(
        ServiceConfig.service_name == service_name
    ).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{service_name}' not found"
        )

    # Update fields
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)

    return service


@router.post("/services/{service_name}/toggle", response_model=ServiceConfigResponse)
async def toggle_service(
    service_name: str,
    db: Session = Depends(get_db)
):
    """Enable/disable a service"""
    service = db.query(ServiceConfig).filter(
        ServiceConfig.service_name == service_name
    ).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{service_name}' not found"
        )

    service.enabled = not service.enabled
    db.commit()
    db.refresh(service)

    return service


@router.delete("/services/{service_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_name: str,
    db: Session = Depends(get_db)
):
    """Delete a service configuration"""
    service = db.query(ServiceConfig).filter(
        ServiceConfig.service_name == service_name
    ).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{service_name}' not found"
        )

    db.delete(service)
    db.commit()

    return None
