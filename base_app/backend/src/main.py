import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .api import service_config, health

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting base application...")

    # Initialize database
    init_db()
    logger.info("Database initialized")

    # Seed initial services if needed
    from .database import SessionLocal
    from .models.service_config import ServiceConfig

    db = SessionLocal()
    try:
        # Check if services exist
        count = db.query(ServiceConfig).count()
        if count == 0:
            logger.info("Seeding initial services...")
            services = [
                ServiceConfig(
                    service_name="auth",
                    display_name="Authentication",
                    description="User authentication and security settings",
                    path="/auth",
                    color="#3B82F6",
                    enabled=True,
                    sort_order=1,
                    icon_url="/icons/auth.svg"
                ),
                ServiceConfig(
                    service_name="todos",
                    display_name="Todo Lists",
                    description="Manage your tasks and todo lists",
                    path="/todos",
                    color="#10B981",
                    enabled=True,
                    sort_order=2,
                    icon_url="/icons/todos.svg"
                ),
                ServiceConfig(
                    service_name="fundflow",
                    display_name="FundFlow",
                    description="Track your finances and transactions",
                    path="/fundflow",
                    color="#F59E0B",
                    enabled=True,
                    sort_order=3,
                    icon_url="/icons/fundflow.svg"
                ),
            ]
            for service in services:
                db.add(service)
            db.commit()
            logger.info("Initial services seeded")
    finally:
        db.close()

    logger.info(f"Base application started on port {settings.HTTP_PORT}")

    yield

    # Shutdown
    logger.info("Shutting down base application...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Base application for JAM Stack micro-frontend architecture",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(service_config.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "base-app",
        "version": settings.APP_VERSION,
        "status": "running",
        "endpoints": {
            "health": "/health",
            "services": "/api/config/services",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.HTTP_PORT,
        reload=settings.DEBUG
    )
