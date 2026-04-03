// utils/logger.ts
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Define the logger type with stream property
export interface LoggerWithStream {
  info: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
  http: (message: string, meta?: any) => void;
  child: (bindings: any) => any;
  getWinstonLogger: () => winston.Logger;
  stream: {
    write: (message: string) => void;
  };
}

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Custom format for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// JSON format for files
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

// Define transports
const transports = [
  // Write all logs to console
  new winston.transports.Console({ format: consoleFormat }),

  // Write all logs with level 'error' and below to error.log
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Write all logs with level 'info' and below to combined.log
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Add HTTP logging in development
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 3,
    })
  );
}

// Create the logger
const winstonLogger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

// Create a wrapper for backward compatibility
export const logger: LoggerWithStream = {
  info: (message: string, meta?: any) => {
    if (meta) winstonLogger.info(message, meta);
    else winstonLogger.info(message);
  },
  error: (message: string, meta?: any) => {
    if (meta) winstonLogger.error(message, meta);
    else winstonLogger.error(message);
  },
  warn: (message: string, meta?: any) => {
    if (meta) winstonLogger.warn(message, meta);
    else winstonLogger.warn(message);
  },
  debug: (message: string, meta?: any) => {
    if (meta) winstonLogger.debug(message, meta);
    else winstonLogger.debug(message);
  },
  http: (message: string, meta?: any) => {
    if (meta) winstonLogger.http(message, meta);
    else winstonLogger.http(message);
  },
  child: (bindings: any) => {
    const childLogger = winstonLogger.child(bindings);
    return {
      info: (message: string, meta?: any) => childLogger.info(message, meta),
      error: (message: string, meta?: any) => childLogger.error(message, meta),
      warn: (message: string, meta?: any) => childLogger.warn(message, meta),
      debug: (message: string, meta?: any) => childLogger.debug(message, meta),
      http: (message: string, meta?: any) => childLogger.http(message, meta),
    };
  },
  getWinstonLogger: () => winstonLogger,
  stream: {
    write: (message: string) => {
      logger.http(message.trim());
    },
  },
};

// Log unhandled rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
});

// Log uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
});

export default logger;