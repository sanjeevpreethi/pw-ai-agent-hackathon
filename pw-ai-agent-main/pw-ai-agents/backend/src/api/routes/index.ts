/**
 * API Routes
 */

import { Router } from 'express';
import * as generationController from '../controllers/generation';
import * as executionController from '../controllers/execution';
import { authenticate } from '../middleware';

const router = Router();

// ============================================================================
// Test Generation Routes
// ============================================================================

/**
 * POST /api/v1/test-cases/upload
 * Upload and parse test cases
 */
router.post('/test-cases/upload', authenticate, generationController.uploadTestCases);

/**
 * POST /api/v1/scripts/generate
 * Generate a single test script
 */
router.post('/scripts/generate', authenticate, generationController.generateScript);

/**
 * POST /api/v1/scripts/generate-batch
 * Generate multiple test scripts
 */
router.post(
  '/scripts/generate-batch',
  authenticate,
  generationController.generateScriptBatch
);

// ============================================================================
// Test Execution Routes
// ============================================================================

/**
 * POST /api/v1/executions/run
 * Execute tests
 */
router.post('/executions/run', authenticate, executionController.executeTests);

/**
 * GET /api/v1/executions/:executionId
 * Get execution status
 */
router.get('/executions/:executionId', authenticate, executionController.getExecutionStatus);

/**
 * GET /api/v1/executions/:executionId/results
 * Get test results for an execution
 */
router.get(
  '/executions/:executionId/results',
  authenticate,
  executionController.getTestResults
);

/**
 * POST /api/v1/executions/:executionId/cancel
 * Cancel an execution
 */
router.post(
  '/executions/:executionId/cancel',
  authenticate,
  executionController.cancelExecution
);

// ============================================================================
// Health & Monitoring Routes
// ============================================================================

/**
 * GET /api/v1/health
 * Health check endpoint
 */
router.get('/health', executionController.getHealthStatus);

/**
 * GET /api/v1/metrics
 * Get system metrics
 */
router.get('/metrics', authenticate, executionController.getMetrics);

export default router;
