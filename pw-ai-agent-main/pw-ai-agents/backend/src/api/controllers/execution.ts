/**
 * Test Execution Controller
 * Handles test execution orchestration and result retrieval
 */

import { Request, Response } from 'express';
import {
  TestExecutionRequest,
  ApiResponse,
  HealthCheckStatus,
} from '../../types';
import logger from '../../utils/logger';
import testRunner from '../../orchestration/test-runner';
import browserManager from '../../orchestration/browser-manager';

export async function executeTests(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const request = req.body as TestExecutionRequest;

    logger.info('Test execution request received', {
      testCount: request.testIds.length,
      parallel: request.parallel,
      maxWorkers: request.maxWorkers,
    });

    // Execute tests
    const result = await testRunner.executeTests(request);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        executionId: result.executionId,
        tests: result.tests,
        summary: result.summary,
        reportPath: result.reportPath,
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = (error as any).statusCode || 500;
    logger.error('Test execution failed', errorMessage, { component: 'executeTests' });
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    });
  }
}

export async function getExecutionStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { executionId } = req.params;

    logger.info('Fetching execution status', { executionId });

    // Placeholder: In production, would fetch from database
    const response: ApiResponse<any> = {
      success: true,
      data: {
        executionId,
        status: 'completed',
        metrics: testRunner.getMetrics(),
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = (error as any).statusCode || 500;
    logger.error('Get execution status failed', errorMessage, { component: 'getExecutionStatus' });
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    });
  }
}

export async function getTestResults(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { executionId } = req.params;
    const { page = '1', pageSize = '10' } = req.query;

    logger.info('Fetching test results', {
      executionId,
      page,
      pageSize,
    });

    // Placeholder: In production, would fetch from database
    const response: ApiResponse<any> = {
      success: true,
      data: {
        executionId,
        results: [],
        pagination: {
          page: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total: 0,
          totalPages: 0,
        },
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = (error as any).statusCode || 500;
    logger.error('Get test results failed', errorMessage, { component: 'getTestResults' });
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    });
  }
}

export async function cancelExecution(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { executionId } = req.params;

    logger.info('Cancelling execution', { executionId });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        executionId,
        status: 'cancelled',
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = (error as any).statusCode || 500;
    logger.error('Cancel execution failed', errorMessage, { component: 'cancelExecution' });
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    });
  }
}

export async function getHealthStatus(
  _req: Request,
  res: Response
): Promise<void> {
  const status: HealthCheckStatus = {
    status: 'healthy',
    timestamp: new Date(),
    services: {
      database: true,
      cache: true,
      ai_model: true,
      playwright_mcp: true,
    },
    metrics: {
      uptime: process.uptime(),
      requestCount: 0,
      errorCount: 0,
    },
  };

  res.status(200).json(status);
}

export async function getMetrics(
  _req: Request,
  res: Response
): Promise<void> {
  const metrics = {
    testRunner: testRunner.getMetrics(),
    browserPool: browserManager.getMetrics(),
    timestamp: new Date(),
  };

  res.status(200).json(metrics);
}
