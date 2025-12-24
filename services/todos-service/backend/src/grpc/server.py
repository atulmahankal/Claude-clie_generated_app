import asyncio
import logging

logger = logging.getLogger(__name__)

class GrpcServer:
    """Minimal gRPC server stub used for bootstrapping during development.

    See auth-service implementation for details.
    """
    def __init__(self, port: int = 50052):
        self.port = port
        self._stop_event = asyncio.Event()

    async def serve(self):
        logger.info(f"Starting dummy gRPC server on port {self.port}")
        await self._stop_event.wait()
        logger.info("Dummy gRPC server shutting down")

    async def stop(self):
        logger.info("Stopping dummy gRPC server")
        self._stop_event.set()
