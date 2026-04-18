/**
 * Request/Response logging middleware
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = uuidv4();
  const startTime = Date.now();

  // Attach request ID to request
  req.id = requestId;

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;

    logger.info('Outgoing response', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Error handling middleware
 */
export function errorHandler(
  error: Error | any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id || 'unknown';

  logger.error('Request error', error, {
    requestId,
    method: req.method,
    path: req.path,
  });

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      requestId,
      timestamp: new Date(),
    },
  });
}

/**
 * Validate request body middleware
 */
export function validateRequest(schema: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.errors || [],
          timestamp: new Date(),
        },
      });
    }
  };
}

/**
 * Authentication middleware (placeholder)
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing authorization token',
        timestamp: new Date(),
      },
    });
    return;
  }

  // For development/testing, accept a simple test token
  if (process.env.NODE_ENV === 'development' && token === 'test-token') {
    next();
    return;
  }

  // In production, verify JWT token
  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}
