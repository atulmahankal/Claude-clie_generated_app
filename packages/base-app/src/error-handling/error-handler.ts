import { Logger } from '../logger/logger';
import {
  ApplicationError,
  InternalServerError,
  isApplicationError,
  ErrorFactory,
} from './custom-errors';

/**
 * Error Handler
 *
 * Centralized error handling for all microservices
 */

export interface ErrorResponse {
  success: false;
  error: {
    name: string;
    message: string;
    statusCode: number;
    requestId?: string;
    context?: Record<string, any>;
    stack?: string;
  };
}

export class ErrorHandler {
  private static logger = Logger.getInstance();

  /**
   * Handle application errors
   */
  static handle(error: Error | ApplicationError, requestId?: string): ErrorResponse {
    let appError: ApplicationError;

    // Convert unknown errors to ApplicationError
    if (isApplicationError(error)) {
      appError = error;
    } else {
      appError = new InternalServerError(error.message);
      appError.stack = error.stack;
    }

    // Log the error
    this.logError(appError, requestId);

    // Create response
    const response: ErrorResponse = {
      success: false,
      error: {
        name: appError.name,
        message: appError.message,
        statusCode: appError.statusCode,
        requestId,
        context: appError.context,
      },
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.error.stack = appError.stack;
    }

    return response;
  }

  /**
   * Log error with appropriate level
   */
  private static logError(error: ApplicationError, requestId?: string): void {
    const metadata = {
      requestId,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      context: error.context,
    };

    if (error.isOperational) {
      // Operational errors (expected errors)
      if (error.statusCode >= 500) {
        this.logger.error(error.message, error, metadata);
      } else if (error.statusCode >= 400) {
        this.logger.warn(error.message, metadata);
      }
    } else {
      // Programming errors (unexpected errors)
      this.logger.error(error.message, error, metadata);
    }
  }

  /**
   * Express/Fastify error handling middleware
   */
  static middleware() {
    return (err: Error | ApplicationError, req: any, res: any, next: any) => {
      const requestId = req.requestId || req.headers['x-request-id'];
      const errorResponse = ErrorHandler.handle(err, requestId);

      res.status(errorResponse.error.statusCode).json(errorResponse);
    };
  }

  /**
   * gRPC error handler
   */
  static handleGrpcError(error: Error | ApplicationError): {
    success: false;
    error: string;
  } {
    let appError: ApplicationError;

    if (isApplicationError(error)) {
      appError = error;
    } else {
      appError = new InternalServerError(error.message);
    }

    this.logError(appError);

    return {
      success: false,
      error: appError.message,
    };
  }

  /**
   * Handle unhandled promise rejections
   */
  static handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    this.logger.error('Unhandled Promise Rejection', reason, {
      promise: String(promise),
    });

    // In production, you might want to exit the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  /**
   * Handle uncaught exceptions
   */
  static handleUncaughtException(error: Error): void {
    this.logger.error('Uncaught Exception', error, {
      fatal: true,
    });

    // Always exit on uncaught exceptions
    process.exit(1);
  }

  /**
   * Setup global error handlers
   */
  static setupGlobalHandlers(): void {
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
    process.on('uncaughtException', this.handleUncaughtException.bind(this));

    this.logger.info('Global error handlers registered');
  }

  /**
   * Async error wrapper for Express/Fastify routes
   */
  static asyncHandler(fn: Function) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Try-catch wrapper for gRPC handlers
   */
  static async grpcHandler<T>(
    fn: () => Promise<T>,
    defaultValue?: Partial<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const grpcError = this.handleGrpcError(error);
      return {
        ...defaultValue,
        ...grpcError,
      } as T;
    }
  }
}

/**
 * Async error wrapper decorator
 */
export function AsyncHandler(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      throw error;
    }
  };

  return descriptor;
}

/**
 * Error boundary for React-style error handling in async operations
 */
export class ErrorBoundary {
  private static handlers: Map<string, (error: Error) => void> = new Map();

  static register(name: string, handler: (error: Error) => void): void {
    this.handlers.set(name, handler);
  }

  static unregister(name: string): void {
    this.handlers.delete(name);
  }

  static async execute<T>(name: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const handler = this.handlers.get(name);
      if (handler) {
        handler(error);
      }
      throw error;
    }
  }
}

// Export default instance
export default ErrorHandler;
