import express from 'express';
import { DatabaseFactory, createDatabaseFromEnv } from '@jam/database-engine';
import { BaseApp, CommonHealthChecks } from '@jam/base-app';
import { GrpcServer } from './grpc/server';

/**
 * Fundflow Service
 *
 * Microservice for financial transaction tracking, recurring transactions, and analytics
 */

class FundflowService {
  private app: express.Application;
  private baseApp: BaseApp;
  private grpcServer: GrpcServer;
  private httpPort: number;
  private grpcPort: number;

  constructor() {
    this.httpPort = parseInt(process.env.HTTP_PORT || '3003');
    this.grpcPort = parseInt(process.env.GRPC_PORT || '50053');

    // Initialize base app
    this.baseApp = new BaseApp({
      serviceName: 'fundflow-service',
      version: process.env.SERVICE_VERSION || '1.0.0',
      enableMetrics: true,
      enableHealthCheck: true,
      enableGlobalErrorHandlers: true,
    });

    // Create Express app
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();

    // Initialize gRPC server (will be started after DB connection)
    this.grpcServer = null as any; // Will be set in start()
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Parse JSON
    this.app.use(express.json());

    // Request logging
    const middleware = this.baseApp.getMiddleware();
    if (middleware.requestLogger) {
      this.app.use(middleware.requestLogger);
    }

    // Metrics collection
    if (middleware.metrics) {
      this.app.use(middleware.metrics);
    }

    this.baseApp.logger.info('Middleware configured');
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    const middleware = this.baseApp.getMiddleware();

    // Health check endpoints
    if (middleware.health) {
      this.app.get('/health', middleware.health);
    }

    if (middleware.liveness) {
      this.app.get('/liveness', middleware.liveness);
    }

    if (middleware.readiness) {
      this.app.get('/readiness', middleware.readiness);
    }

    // Metrics endpoint
    if (middleware.metricsEndpoint) {
      this.app.get('/metrics', middleware.metricsEndpoint);
    }

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'fundflow-service',
        version: process.env.SERVICE_VERSION || '1.0.0',
        status: 'running',
      });
    });

    // Error handling middleware (must be last)
    if (middleware.errorHandler) {
      this.app.use(middleware.errorHandler);
    }

    this.baseApp.logger.info('Routes configured');
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    try {
      this.baseApp.logger.info('Starting fundflow service...');

      // Connect to database
      const db = createDatabaseFromEnv();
      await db.connect();
      this.baseApp.logger.info('Database connected', {
        type: process.env.DB_TYPE || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'fundflow',
      });

      // Register health checks
      if (this.baseApp.healthCheck) {
        this.baseApp.registerHealthChecks({
          database: CommonHealthChecks.database(db),
          memory: CommonHealthChecks.memory(500),
        });
      }

      // Initialize and start gRPC server
      this.grpcServer = new GrpcServer(db, this.grpcPort);
      await this.grpcServer.start();

      // Start HTTP server
      await new Promise<void>((resolve) => {
        this.app.listen(this.httpPort, () => {
          this.baseApp.logger.info(`HTTP server started on port ${this.httpPort}`);
          resolve();
        });
      });

      this.baseApp.logger.info('Fundflow service started successfully', {
        httpPort: this.httpPort,
        grpcPort: this.grpcPort,
      });
    } catch (error) {
      this.baseApp.logger.error('Failed to start fundflow service', error);
      process.exit(1);
    }
  }

  /**
   * Stop the service
   */
  async stop(): Promise<void> {
    this.baseApp.logger.info('Stopping fundflow service...');

    if (this.grpcServer) {
      await this.grpcServer.stop();
    }

    this.baseApp.logger.info('Fundflow service stopped');
  }
}

// Create and start service
const service = new FundflowService();
service.start();

// Handle shutdown signals
process.on('SIGTERM', async () => {
  await service.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await service.stop();
  process.exit(0);
});

export default service;
