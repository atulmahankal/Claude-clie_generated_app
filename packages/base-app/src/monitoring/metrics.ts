import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

/**
 * Metrics Service
 *
 * Provides Prometheus-compatible metrics for all microservices
 */

export class Metrics {
  private static instance: Metrics;
  private registry: Registry;
  private serviceName: string;

  // HTTP Metrics
  public httpRequestsTotal!: Counter;
  public httpRequestDuration!: Histogram;
  public httpRequestsInProgress!: Gauge;

  // gRPC Metrics
  public grpcRequestsTotal!: Counter;
  public grpcRequestDuration!: Histogram;
  public grpcRequestsInProgress!: Gauge;

  // Database Metrics
  public dbQueryTotal!: Counter;
  public dbQueryDuration!: Histogram;
  public dbConnectionsActive!: Gauge;

  // Business Metrics
  public businessOperationsTotal!: Counter;
  public businessOperationDuration!: Histogram;

  // Error Metrics
  public errorsTotal!: Counter;

  private constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.registry = new Registry();

    // Set default labels
    this.registry.setDefaultLabels({
      service: serviceName,
      environment: process.env.NODE_ENV || 'development',
    });

    // Collect default metrics (CPU, memory, event loop, etc.)
    collectDefaultMetrics({ register: this.registry });

    // Initialize custom metrics
    this.initializeMetrics();
  }

  static getInstance(serviceName?: string): Metrics {
    if (!Metrics.instance) {
      const name = serviceName || process.env.SERVICE_NAME || 'app';
      Metrics.instance = new Metrics(name);
    }
    return Metrics.instance;
  }

  private initializeMetrics(): void {
    // HTTP Metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.httpRequestsInProgress = new Gauge({
      name: 'http_requests_in_progress',
      help: 'Number of HTTP requests currently being processed',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });

    // gRPC Metrics
    this.grpcRequestsTotal = new Counter({
      name: 'grpc_requests_total',
      help: 'Total number of gRPC requests',
      labelNames: ['service', 'method', 'status'],
      registers: [this.registry],
    });

    this.grpcRequestDuration = new Histogram({
      name: 'grpc_request_duration_seconds',
      help: 'Duration of gRPC requests in seconds',
      labelNames: ['service', 'method', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.grpcRequestsInProgress = new Gauge({
      name: 'grpc_requests_in_progress',
      help: 'Number of gRPC requests currently being processed',
      labelNames: ['service', 'method'],
      registers: [this.registry],
    });

    // Database Metrics
    this.dbQueryTotal = new Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table', 'status'],
      registers: [this.registry],
    });

    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.dbConnectionsActive = new Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry],
    });

    // Business Metrics
    this.businessOperationsTotal = new Counter({
      name: 'business_operations_total',
      help: 'Total number of business operations',
      labelNames: ['operation', 'status'],
      registers: [this.registry],
    });

    this.businessOperationDuration = new Histogram({
      name: 'business_operation_duration_seconds',
      help: 'Duration of business operations in seconds',
      labelNames: ['operation'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    // Error Metrics
    this.errorsTotal = new Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'severity'],
      registers: [this.registry],
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics registry
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Express/Fastify middleware for /metrics endpoint
   */
  handler() {
    return async (req: any, res: any) => {
      res.set('Content-Type', this.registry.contentType);
      const metrics = await this.getMetrics();
      res.send(metrics);
    };
  }

  /**
   * HTTP request tracking middleware
   */
  httpMiddleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const route = req.route?.path || req.url;

      this.httpRequestsInProgress.inc({ method: req.method, route });

      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;

        this.httpRequestsTotal.inc({
          method: req.method,
          route,
          status_code: res.statusCode,
        });

        this.httpRequestDuration.observe(
          {
            method: req.method,
            route,
            status_code: res.statusCode,
          },
          duration
        );

        this.httpRequestsInProgress.dec({ method: req.method, route });
      });

      next();
    };
  }

  /**
   * Track a business operation
   */
  async trackOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = (Date.now() - start) / 1000;

      this.businessOperationsTotal.inc({ operation, status: 'success' });
      this.businessOperationDuration.observe({ operation }, duration);

      return result;
    } catch (error) {
      const duration = (Date.now() - start) / 1000;

      this.businessOperationsTotal.inc({ operation, status: 'error' });
      this.businessOperationDuration.observe({ operation }, duration);
      this.errorsTotal.inc({ type: 'business_operation', severity: 'error' });

      throw error;
    }
  }

  /**
   * Track a database query
   */
  async trackQuery<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = (Date.now() - start) / 1000;

      this.dbQueryTotal.inc({ operation, table, status: 'success' });
      this.dbQueryDuration.observe({ operation, table }, duration);

      return result;
    } catch (error) {
      const duration = (Date.now() - start) / 1000;

      this.dbQueryTotal.inc({ operation, table, status: 'error' });
      this.dbQueryDuration.observe({ operation, table }, duration);
      this.errorsTotal.inc({ type: 'database_query', severity: 'error' });

      throw error;
    }
  }

  /**
   * Create a custom counter
   */
  createCounter(name: string, help: string, labelNames: string[] = []): Counter {
    return new Counter({
      name,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Create a custom gauge
   */
  createGauge(name: string, help: string, labelNames: string[] = []): Gauge {
    return new Gauge({
      name,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Create a custom histogram
   */
  createHistogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[]
  ): Histogram {
    return new Histogram({
      name,
      help,
      labelNames,
      buckets,
      registers: [this.registry],
    });
  }
}

export default Metrics;
