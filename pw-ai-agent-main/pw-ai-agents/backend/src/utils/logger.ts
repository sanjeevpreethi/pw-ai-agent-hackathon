/**
 * Structured Logging Utility
 */

import winston from 'winston';
import config from '../config';

interface LogContext {
  component?: string;
  operation?: string;
  testId?: string;
  duration?: number;
  [key: string]: unknown;
}

class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: config.logging.level,
      format:
        config.logging.format === 'json'
          ? winston.format.json()
          : winston.format.simple(),
      defaultMeta: { service: 'pw-ai-agents-backend' },
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    });

    // Also log to console in development
    if (config.server.nodeEnv === 'development') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        })
      );
    }
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  error(message: string, error?: Error | string, context?: LogContext): void {
    const errorInfo = typeof error === 'string' ? { error } : { error: error?.message, stack: error?.stack };
    this.logger.error(message, { ...errorInfo, ...context });
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }
}

export default new Logger();
