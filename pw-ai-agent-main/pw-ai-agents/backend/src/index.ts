/**
 * Main Application Entry Point
 * Initializes Express server and integrates all backend components
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import config from './config';
import logger from './utils/logger';
import database from './database';
import apiRoutes from './api/routes';
import {
  requestLogger,
  errorHandler,
} from './api/middleware';

const app = express();

// ============================================================================
// Configuration & Middleware Setup
// ============================================================================

// Parse JSON bodies
app.use(express.json());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);

// Request logging
app.use(requestLogger);

// ============================================================================
// Health & Status Routes (No auth required)
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
  });
});

app.get('/status', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'pw-ai-agents-backend',
    version: '1.0.0',
    environment: config.server.nodeEnv,
    uptime: process.uptime(),
    database: database.getStatus(),
    timestamp: new Date(),
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/api/v1', apiRoutes);

// ============================================================================
// 404 Handler
// ============================================================================

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      timestamp: new Date(),
    },
  });
});

// ============================================================================
// Error Handler (Must be last)
// ============================================================================

app.use(errorHandler);

// ============================================================================
// Server Startup
// ============================================================================

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await database.connect();

    // Start server
    const server = app.listen(config.server.port, () => {
      logger.info('Server started successfully', {
        port: config.server.port,
        environment: config.server.nodeEnv,
      });

      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║        PW-AI-Agents Backend Service Started                   ║
║                                                                ║
║  Port: ${config.server.port}                                              ║
║  Environment: ${config.server.nodeEnv.toUpperCase()}                              ║
║  API Base: ${config.server.apiBaseUrl}    ║
║                                                                ║
║  Health: http://localhost:${config.server.port}/health                  ║
║  Status: http://localhost:${config.server.port}/status                  ║
║  Docs: http://localhost:${config.server.port}/docs                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (): Promise<void> => {
      logger.info('Graceful shutdown initiated');

      server.close(async () => {
        logger.info('Server closed');
        await database.disconnect();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.warn('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at Promise', String(reason), { promise });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', error);
      process.exit(1);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to start server', errorMessage);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
