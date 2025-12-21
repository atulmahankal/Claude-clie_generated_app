import winston from 'winston';
import {
  levels,
  level,
  createTransports,
  exceptionHandlers,
  rejectionHandlers,
  LogMetadata,
} from './winston.config';

/**
 * Logger Service
 *
 * Provides structured logging across all microservices
 * Singleton pattern ensures consistent logging throughout the application
 */
export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;
  private serviceName: string;
  private defaultMetadata: LogMetadata = {};

  private constructor(serviceName: string) {
    this.serviceName = serviceName;

    this.logger = winston.createLogger({
      level: level(),
      levels,
      transports: createTransports(serviceName),
      exceptionHandlers: exceptionHandlers(serviceName),
      rejectionHandlers: rejectionHandlers(serviceName),
      exitOnError: false,
    });
  }

  /**
   * Get logger instance (singleton)
   */
  static getInstance(serviceName?: string): Logger {
    if (!Logger.instance) {
      const name = serviceName || process.env.SERVICE_NAME || 'app';
      Logger.instance = new Logger(name);
    }
    return Logger.instance;
  }

  /**
   * Set default metadata that will be included in all logs
   */
  setDefaultMetadata(metadata: LogMetadata): void {
    this.defaultMetadata = { ...this.defaultMetadata, ...metadata };
  }

  /**
   * Merge metadata with default metadata
   */
  private mergeMetadata(metadata?: LogMetadata): LogMetadata {
    return {
      service: this.serviceName,
      ...this.defaultMetadata,
      ...metadata,
    };
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | any, metadata?: LogMetadata): void {
    const meta = this.mergeMetadata(metadata);

    if (error instanceof Error) {
      this.logger.error(message, {
        ...meta,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...error,
        },
      });
    } else if (error) {
      this.logger.error(message, { ...meta, error });
    } else {
      this.logger.error(message, meta);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.logger.warn(message, this.mergeMetadata(metadata));
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: LogMetadata): void {
    this.logger.info(message, this.mergeMetadata(metadata));
  }

  /**
   * Log an HTTP request
   */
  http(message: string, metadata?: LogMetadata): void {
    this.logger.http(message, this.mergeMetadata(metadata));
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.logger.debug(message, this.mergeMetadata(metadata));
  }

  /**
   * Create a child logger with additional context
   */
  child(metadata: LogMetadata): ChildLogger {
    return new ChildLogger(this, metadata);
  }

  /**
   * Get the underlying Winston logger
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

/**
 * Child Logger
 *
 * A logger instance with additional context metadata
 */
export class ChildLogger {
  constructor(
    private parent: Logger,
    private context: LogMetadata
  ) {}

  error(message: string, error?: Error | any, metadata?: LogMetadata): void {
    this.parent.error(message, error, { ...this.context, ...metadata });
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.parent.warn(message, { ...this.context, ...metadata });
  }

  info(message: string, metadata?: LogMetadata): void {
    this.parent.info(message, { ...this.context, ...metadata });
  }

  http(message: string, metadata?: LogMetadata): void {
    this.parent.http(message, { ...this.context, ...metadata });
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.parent.debug(message, { ...this.context, ...metadata });
  }
}

/**
 * Express/Fastify middleware for request logging
 */
export interface RequestLoggerOptions {
  skip?: (req: any) => boolean;
  requestIdHeader?: string;
}

export function requestLoggerMiddleware(options: RequestLoggerOptions = {}) {
  const logger = Logger.getInstance();
  const requestIdHeader = options.requestIdHeader || 'x-request-id';

  return (req: any, res: any, next: any) => {
    if (options.skip && options.skip(req)) {
      return next();
    }

    const startTime = Date.now();
    const requestId = req.headers[requestIdHeader] || generateRequestId();

    // Add request ID to headers
    req.requestId = requestId;
    res.setHeader(requestIdHeader, requestId);

    // Create request logger
    req.logger = logger.child({
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    // Log request
    req.logger.http(`${req.method} ${req.url}`);

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'error' : 'http';

      req.logger[level](`${req.method} ${req.url} ${res.statusCode}`, {
        statusCode: res.statusCode,
        duration,
      });
    });

    next();
  };
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export default instance
export default Logger.getInstance();
