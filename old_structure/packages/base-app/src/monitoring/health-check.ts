import { Logger } from '../logger/logger';

/**
 * Health Check Service
 *
 * Provides health check endpoints for all microservices
 */

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  service: string;
  version?: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      responseTime?: number;
      [key: string]: any;
    };
  };
}

export type HealthCheckFunction = () => Promise<{
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  [key: string]: any;
}>;

export class HealthCheck {
  private static instance: HealthCheck;
  private logger = Logger.getInstance();
  private checks: Map<string, HealthCheckFunction> = new Map();
  private serviceName: string;
  private version: string;
  private startTime: number;

  private constructor(serviceName: string, version: string = '1.0.0') {
    this.serviceName = serviceName;
    this.version = version;
    this.startTime = Date.now();
  }

  static getInstance(serviceName?: string, version?: string): HealthCheck {
    if (!HealthCheck.instance) {
      const name = serviceName || process.env.SERVICE_NAME || 'app';
      const ver = version || process.env.SERVICE_VERSION || '1.0.0';
      HealthCheck.instance = new HealthCheck(name, ver);
    }
    return HealthCheck.instance;
  }

  /**
   * Register a health check
   */
  register(name: string, check: HealthCheckFunction): void {
    this.checks.set(name, check);
    this.logger.debug(`Health check registered: ${name}`);
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): void {
    this.checks.delete(name);
    this.logger.debug(`Health check unregistered: ${name}`);
  }

  /**
   * Execute all health checks
   */
  async execute(): Promise<HealthCheckResult> {
    const checkResults: HealthCheckResult['checks'] = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Execute all checks concurrently
    const checkPromises = Array.from(this.checks.entries()).map(async ([name, check]) => {
      const startTime = Date.now();

      try {
        const result = await Promise.race([
          check(),
          this.timeout(5000), // 5 second timeout
        ]);

        checkResults[name] = {
          ...result,
          responseTime: Date.now() - startTime,
        };

        // Update overall status
        if (result.status === 'fail') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'warn' && overallStatus !== 'unhealthy') {
          overallStatus = 'degraded';
        }
      } catch (error: any) {
        checkResults[name] = {
          status: 'fail',
          message: error.message || 'Health check failed',
          responseTime: Date.now() - startTime,
        };
        overallStatus = 'unhealthy';
      }
    });

    await Promise.all(checkPromises);

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      service: this.serviceName,
      version: this.version,
      checks: checkResults,
    };

    // Log if unhealthy (type assertion needed due to async mutation in callbacks)
    const status = overallStatus as 'healthy' | 'degraded' | 'unhealthy';
    if (status === 'unhealthy') {
      this.logger.error('Service health check failed', undefined, { result });
    } else if (status === 'degraded') {
      this.logger.warn('Service health degraded', { result });
    }

    return result;
  }

  /**
   * Timeout helper
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), ms)
    );
  }

  /**
   * Express/Fastify middleware for /health endpoint
   */
  handler() {
    return async (req: any, res: any) => {
      const result = await this.execute();

      const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(result);
    };
  }

  /**
   * Liveness probe (simple check that service is running)
   */
  livenessHandler() {
    return (req: any, res: any) => {
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
      });
    };
  }

  /**
   * Readiness probe (check if service is ready to accept traffic)
   */
  readinessHandler() {
    return async (req: any, res: any) => {
      const result = await this.execute();

      const isReady = result.status === 'healthy' || result.status === 'degraded';
      const statusCode = isReady ? 200 : 503;

      res.status(statusCode).json({
        status: isReady ? 'ready' : 'not-ready',
        timestamp: new Date().toISOString(),
        checks: result.checks,
      });
    };
  }
}

/**
 * Common Health Checks
 */
export class CommonHealthChecks {
  /**
   * Database health check
   */
  static database(db: { ping: () => Promise<boolean> }): HealthCheckFunction {
    return async () => {
      try {
        const isConnected = await db.ping();

        if (isConnected) {
          return { status: 'pass', message: 'Database connection is healthy' };
        } else {
          return { status: 'fail', message: 'Database connection failed' };
        }
      } catch (error: any) {
        return { status: 'fail', message: error.message };
      }
    };
  }

  /**
   * Memory health check
   */
  static memory(thresholdMB: number = 500): HealthCheckFunction {
    return async () => {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;

      if (heapUsedMB > thresholdMB) {
        return {
          status: 'warn',
          message: `High memory usage: ${heapUsedMB.toFixed(2)}MB`,
          heapUsedMB: heapUsedMB.toFixed(2),
        };
      }

      return {
        status: 'pass',
        message: 'Memory usage is normal',
        heapUsedMB: heapUsedMB.toFixed(2),
      };
    };
  }

  /**
   * Disk space health check (Node.js doesn't have built-in disk check)
   */
  static disk(): HealthCheckFunction {
    return async () => {
      // This would require a library like 'diskusage' or 'check-disk-space'
      // For now, we'll just return a pass
      return { status: 'pass', message: 'Disk check not implemented' };
    };
  }

  /**
   * External service health check
   */
  static externalService(
    name: string,
    checkFn: () => Promise<boolean>
  ): HealthCheckFunction {
    return async () => {
      try {
        const isHealthy = await checkFn();

        if (isHealthy) {
          return { status: 'pass', message: `${name} is reachable` };
        } else {
          return { status: 'fail', message: `${name} is unreachable` };
        }
      } catch (error: any) {
        return { status: 'fail', message: `${name} check failed: ${error.message}` };
      }
    };
  }

  /**
   * gRPC service health check
   */
  static grpcService(
    name: string,
    client: any,
    method: string = 'ping'
  ): HealthCheckFunction {
    return async () => {
      try {
        await new Promise((resolve, reject) => {
          if (client[method]) {
            client[method]({}, (error: any, response: any) => {
              if (error) reject(error);
              else resolve(response);
            });
          } else {
            reject(new Error(`Method ${method} not found on client`));
          }
        });

        return { status: 'pass', message: `${name} gRPC service is healthy` };
      } catch (error: any) {
        return { status: 'fail', message: `${name} gRPC service failed: ${error.message}` };
      }
    };
  }
}

export default HealthCheck;
