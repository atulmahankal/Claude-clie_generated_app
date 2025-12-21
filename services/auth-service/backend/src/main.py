import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .api import health

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global gRPC server instance
grpc_server = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global grpc_server

    # Startup
    logger.info("Starting auth service...")

    # Initialize database
    init_db()
    logger.info("Database initialized")

    # TODO: Start gRPC server
    # from .grpc.server import GrpcServer
    # grpc_server = GrpcServer(port=settings.GRPC_PORT)
    # asyncio.create_task(grpc_server.serve())
    logger.info(f"gRPC server would start on port {settings.GRPC_PORT}")

    logger.info(f"Auth service started on HTTP port {settings.HTTP_PORT}")

    yield

    # Shutdown
    logger.info("Shutting down auth service...")
    # if grpc_server:
    #     await grpc_server.stop()


# Create FastAPI application
app = FastAPI(
    title="Auth Service",
    description="Authentication microservice with 2FA support",
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


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "auth-service",
        "version": settings.APP_VERSION,
        "status": "running",
        "ports": {
            "http": settings.HTTP_PORT,
            "grpc": settings.GRPC_PORT
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
