import winston from 'winston';
import path from 'path';

/**
 * Winston Logger Configuration
 *
 * Provides structured logging across all microservices
 */

// Define log levels
export const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
export const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

// Apply colors to winston
winston.addColors(colors);

// Determine log level based on environment
export const level = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, requestId, ...meta } = info;

    let log = `${timestamp} [${service || 'app'}] ${level}: ${message}`;

    if (requestId) {
      log += ` (reqId: ${requestId})`;
    }

    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// JSON format for file output and production
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports based on environment
export const createTransports = (serviceName: string): winston.transport[] => {
  const env = process.env.NODE_ENV || 'development';
  const transports: winston.transport[] = [];

  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      format: env === 'development' ? consoleFormat : jsonFormat,
    })
  );

  // File transports (production and staging)
  if (env !== 'development') {
    const logsDir = process.env.LOGS_DIR || 'logs';

    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, `${serviceName}-error.log`),
        level: 'error',
        format: jsonFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, `${serviceName}-combined.log`),
        format: jsonFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );
  }

  return transports;
};

// Exception handlers
export const exceptionHandlers = (serviceName: string): winston.transport[] => {
  const env = process.env.NODE_ENV || 'development';
  const handlers: winston.transport[] = [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ];

  if (env !== 'development') {
    const logsDir = process.env.LOGS_DIR || 'logs';
    handlers.push(
      new winston.transports.File({
        filename: path.join(logsDir, `${serviceName}-exceptions.log`),
        format: jsonFormat,
      })
    );
  }

  return handlers;
};

// Rejection handlers
export const rejectionHandlers = (serviceName: string): winston.transport[] => {
  const env = process.env.NODE_ENV || 'development';
  const handlers: winston.transport[] = [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ];

  if (env !== 'development') {
    const logsDir = process.env.LOGS_DIR || 'logs';
    handlers.push(
      new winston.transports.File({
        filename: path.join(logsDir, `${serviceName}-rejections.log`),
        format: jsonFormat,
      })
    );
  }

  return handlers;
};

// Default metadata to include in all logs
export interface LogMetadata {
  service?: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}
