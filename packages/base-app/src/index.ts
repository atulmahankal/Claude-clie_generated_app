/**
 * Base App Package
 *
 * Shared utilities, logging, error handling, and monitoring for all microservices
 *
 * Usage:
 * ```typescript
 * import { Logger, ErrorHandler, HealthCheck, Metrics } from '@jam/base-app';
 *
 * // Setup logger
 * const logger = Logger.getInstance('auth-service');
 * logger.info('Service starting...');
 *
 * // Setup error handling
 * ErrorHandler.setupGlobalHandlers();
 *
 * // Setup health checks
 * const healthCheck = HealthCheck.getInstance('auth-service', '1.0.0');
 * healthCheck.register('database', CommonHealthChecks.database(db));
 *
 * // Setup metrics
 * const metrics = Metrics.getInstance('auth-service');
 *
 * // Use in Express app
 * app.use(metrics.httpMiddleware());
 * app.use(ErrorHandler.middleware());
 * app.get('/health', healthCheck.handler());
 * app.get('/metrics', metrics.handler());
 * ```
 */

// Import types for local use in BaseApp class
import { Logger, ChildLogger, requestLoggerMiddleware } from './logger/logger';
import { ErrorHandler } from './error-handling/error-handler';
import { HealthCheck, HealthCheckFunction } from './monitoring/health-check';
import { Metrics } from './monitoring/metrics';

// Logger
export { Logger, ChildLogger, requestLoggerMiddleware };
export type { LogMetadata } from './logger/winston.config';

// Error Handling
export {
  ErrorHandler,
  AsyncHandler,
  ErrorBoundary,
} from './error-handling/error-handler';

export type { ErrorResponse } from './error-handling/error-handler';

export {
  ApplicationError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError as BaseAppDatabaseError,
  ExternalServiceError,
  ServiceUnavailableError,
  BadRequestError,
  InternalServerError,
  TimeoutError,
  TokenError,
  TwoFactorError,
  BusinessLogicError,
  ErrorFactory,
  isApplicationError,
  isValidationError,
  isAuthenticationError,
  isAuthorizationError,
  isNotFoundError,
  isDatabaseError,
} from './error-handling/custom-errors';

// Health Check
export {
  HealthCheck,
  CommonHealthChecks,
} from './monitoring/health-check';

export type {
  HealthCheckResult,
  HealthCheckFunction,
} from './monitoring/health-check';

// Metrics
export { Metrics } from './monitoring/metrics';

/**
 * Initialize base app for a microservice
 *
 * Sets up logging, error handling, health checks, and metrics
 */
export interface BaseAppConfig {
  serviceName: string;
  version?: string;
  enableMetrics?: boolean;
  enableHealthCheck?: boolean;
  enableGlobalErrorHandlers?: boolean;
}

export class BaseApp {
  public logger: Logger;
  public healthCheck?: HealthCheck;
  public metrics?: Metrics;

  constructor(config: BaseAppConfig) {
    const {
      serviceName,
      version = '1.0.0',
      enableMetrics = true,
      enableHealthCheck = true,
      enableGlobalErrorHandlers = true,
    } = config;

    // Initialize logger
    this.logger = Logger.getInstance(serviceName);

    // Setup global error handlers
    if (enableGlobalErrorHandlers) {
      ErrorHandler.setupGlobalHandlers();
    }

    // Initialize health check
    if (enableHealthCheck) {
      this.healthCheck = HealthCheck.getInstance(serviceName, version);
    }

    // Initialize metrics
    if (enableMetrics) {
      this.metrics = Metrics.getInstance(serviceName);
    }

    this.logger.info(`${serviceName} v${version} initialized`);
  }

  /**
   * Register health checks
   */
  registerHealthChecks(checks: Record<string, HealthCheckFunction>): void {
    if (!this.healthCheck) {
      throw new Error('Health check not enabled');
    }

    Object.entries(checks).forEach(([name, check]) => {
      this.healthCheck!.register(name, check);
    });
  }

  /**
   * Get Express/Fastify middleware
   */
  getMiddleware() {
    return {
      requestLogger: requestLoggerMiddleware(),
      errorHandler: ErrorHandler.middleware(),
      metrics: this.metrics?.httpMiddleware(),
      health: this.healthCheck?.handler(),
      liveness: this.healthCheck?.livenessHandler(),
      readiness: this.healthCheck?.readinessHandler(),
      metricsEndpoint: this.metrics?.handler(),
    };
  }
}

// Default export
export default BaseApp;
