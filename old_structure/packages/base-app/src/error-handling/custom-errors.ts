/**
 * Custom Error Classes
 *
 * Provides standardized error types for all microservices
 */

/**
 * Base Application Error
 */
export class ApplicationError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Validation Error (400)
 *
 * Thrown when request validation fails
 */
export class ValidationError extends ApplicationError {
  public errors: Record<string, string[]>;

  constructor(message: string = 'Validation failed', errors: Record<string, string[]> = {}) {
    super(message, 400, true, { errors });
    this.errors = errors;
  }

  static fromZodError(zodError: any): ValidationError {
    const errors: Record<string, string[]> = {};

    zodError.errors?.forEach((err: any) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });

    return new ValidationError('Validation failed', errors);
  }
}

/**
 * Authentication Error (401)
 *
 * Thrown when authentication fails or is required
 */
export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true);
  }
}

/**
 * Authorization Error (403)
 *
 * Thrown when user doesn't have permission to access a resource
 */
export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true);
  }
}

/**
 * Not Found Error (404)
 *
 * Thrown when a requested resource is not found
 */
export class NotFoundError extends ApplicationError {
  constructor(resource: string = 'Resource', id?: string | number) {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(message, 404, true);
  }
}

/**
 * Conflict Error (409)
 *
 * Thrown when there's a conflict with existing resources (e.g., duplicate entry)
 */
export class ConflictError extends ApplicationError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, true);
  }
}

/**
 * Rate Limit Error (429)
 *
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends ApplicationError {
  public retryAfter?: number;

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 429, true);
    this.retryAfter = retryAfter;
  }
}

/**
 * Database Error (500)
 *
 * Thrown when database operations fail
 */
export class DatabaseError extends ApplicationError {
  public query?: string;
  public params?: any[];

  constructor(message: string, query?: string, params?: any[]) {
    super(message, 500, true, { query, params });
    this.query = query;
    this.params = params;
  }
}

/**
 * External Service Error (502)
 *
 * Thrown when an external service call fails
 */
export class ExternalServiceError extends ApplicationError {
  public serviceName: string;

  constructor(serviceName: string, message: string = 'External service error') {
    super(`${serviceName}: ${message}`, 502, true);
    this.serviceName = serviceName;
  }
}

/**
 * Service Unavailable Error (503)
 *
 * Thrown when a service is temporarily unavailable
 */
export class ServiceUnavailableError extends ApplicationError {
  public retryAfter?: number;

  constructor(message: string = 'Service temporarily unavailable', retryAfter?: number) {
    super(message, 503, true);
    this.retryAfter = retryAfter;
  }
}

/**
 * Bad Request Error (400)
 *
 * Thrown when request data is invalid but not a validation error
 */
export class BadRequestError extends ApplicationError {
  constructor(message: string = 'Bad request') {
    super(message, 400, true);
  }
}

/**
 * Internal Server Error (500)
 *
 * Generic server error
 */
export class InternalServerError extends ApplicationError {
  constructor(message: string = 'Internal server error', context?: Record<string, any>) {
    super(message, 500, false, context);
  }
}

/**
 * Timeout Error (408)
 *
 * Thrown when an operation times out
 */
export class TimeoutError extends ApplicationError {
  constructor(message: string = 'Request timeout') {
    super(message, 408, true);
  }
}

/**
 * Token Error (401)
 *
 * Thrown when token validation or processing fails
 */
export class TokenError extends ApplicationError {
  constructor(message: string = 'Invalid or expired token') {
    super(message, 401, true);
  }
}

/**
 * 2FA Error (401)
 *
 * Thrown when 2FA verification fails
 */
export class TwoFactorError extends ApplicationError {
  constructor(message: string = 'Two-factor authentication failed') {
    super(message, 401, true);
  }
}

/**
 * Business Logic Error (422)
 *
 * Thrown when business rules are violated
 */
export class BusinessLogicError extends ApplicationError {
  constructor(message: string) {
    super(message, 422, true);
  }
}

/**
 * Error Type Guards
 */
export function isApplicationError(error: any): error is ApplicationError {
  return error instanceof ApplicationError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(error: any): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error: any): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isNotFoundError(error: any): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isDatabaseError(error: any): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Error Factory
 *
 * Creates appropriate error instances based on error codes or types
 */
export class ErrorFactory {
  static fromStatusCode(statusCode: number, message?: string): ApplicationError {
    switch (statusCode) {
      case 400:
        return new BadRequestError(message);
      case 401:
        return new AuthenticationError(message);
      case 403:
        return new AuthorizationError(message);
      case 404:
        return new NotFoundError(message || 'Resource');
      case 408:
        return new TimeoutError(message);
      case 409:
        return new ConflictError(message);
      case 422:
        return new BusinessLogicError(message || 'Business logic error');
      case 429:
        return new RateLimitError(message);
      case 500:
        return new InternalServerError(message);
      case 502:
        return new ExternalServiceError('External Service', message);
      case 503:
        return new ServiceUnavailableError(message);
      default:
        return new ApplicationError(message || 'Unknown error', statusCode);
    }
  }

  static fromDatabaseError(error: any): DatabaseError {
    let message = 'Database operation failed';

    // PostgreSQL error codes
    if (error.code === '23505') {
      throw new ConflictError('Duplicate entry');
    }
    if (error.code === '23503') {
      throw new ConflictError('Foreign key constraint violation');
    }
    if (error.code === '23502') {
      throw new ValidationError('Required field missing');
    }

    return new DatabaseError(message, error.query, error.params);
  }
}
