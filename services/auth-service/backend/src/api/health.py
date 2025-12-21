from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..database import get_db
from ..config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "auth-service",
        "version": settings.APP_VERSION
    }


@router.get("/health/db")
async def database_health_check(db: Session = Depends(get_db)):
    """Database health check"""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


@router.get("/readiness")
async def readiness_check(db: Session = Depends(get_db)):
    """Kubernetes readiness probe"""
    try:
        db.execute(text("SELECT 1"))
        return {"ready": True}
    except:
        return {"ready": False}


@router.get("/liveness")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"alive": True}
