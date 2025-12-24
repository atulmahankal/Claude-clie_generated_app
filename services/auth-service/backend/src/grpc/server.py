import asyncio
import logging

logger = logging.getLogger(__name__)

class GrpcServer:
    """Minimal gRPC server stub used for bootstrapping during development.

    This lightweight implementation intentionally does not require the grpc package so
    services can be started for local development even if full gRPC handlers are not
    yet implemented. When a real grpc.aio server is available, this class can be
    replaced with a proper implementation that registers protobuf services.
    """
    def __init__(self, port: int = 50051):
        self.port = port
        self._stop_event = asyncio.Event()

    async def serve(self):
        logger.info(f"Starting dummy gRPC server on port {self.port}")
        # Wait until stop() is called
        await self._stop_event.wait()
        logger.info("Dummy gRPC server shutting down")

    async def stop(self):
        logger.info("Stopping dummy gRPC server")
        self._stop_event.set()
