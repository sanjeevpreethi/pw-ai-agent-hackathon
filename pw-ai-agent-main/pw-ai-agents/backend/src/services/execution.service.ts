/**
 * Execution Service
 * Service for managing test executions
 */

import { StoredExecution, TestExecutionResponse } from '../types';
import logger from '../utils/logger';

class ExecutionService {
  private storage = new Map<string, StoredExecution>();

  /**
   * Save execution result
   */
  async save(
    projectId: string,
    testId: string,
    executionResponse: TestExecutionResponse
  ): Promise<StoredExecution> {
    const execution: StoredExecution = {
      id: executionResponse.executionId,
      testId,
      projectId,
      results: executionResponse.tests,
      summary: executionResponse.summary,
      reportPath: executionResponse.reportPath,
      createdAt: new Date(),
    };

    this.storage.set(execution.id, execution);

    logger.info('Execution saved', {
      executionId: execution.id,
      projectId,
      testCount: execution.results.length,
    });

    return execution;
  }

  /**
   * Get execution by ID
   */
  async getById(executionId: string): Promise<StoredExecution | null> {
    return this.storage.get(executionId) || null;
  }

  /**
   * Get all executions for a project
   */
  async getByProject(projectId: string): Promise<StoredExecution[]> {
    return Array.from(this.storage.values()).filter(
      e => e.projectId === projectId
    );
  }

  /**
   * Get execution history for a test
   */
  async getTestHistory(testId: string, limit: number = 10): Promise<StoredExecution[]> {
    return Array.from(this.storage.values())
      .filter(e => e.testId === testId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get latest execution result
   */
  async getLatestResult(testId: string): Promise<StoredExecution | null> {
    const history = await this.getTestHistory(testId, 1);
    return history.length > 0 ? history[0] : null;
  }

  /**
   * Get success rate for a test
   */
  async getSuccessRate(testId: string, limit: number = 20): Promise<number> {
    const history = await this.getTestHistory(testId, limit);

    if (history.length === 0) {
      return 0;
    }

    const successful = history.filter(e => e.summary.successRate >= 100).length;
    return (successful / history.length) * 100;
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<object> {
    const executions = await this.getByProject(projectId);

    return {
      totalExecutions: executions.length,
      totalTests: executions.reduce((sum, e) => sum + e.summary.totalTests, 0),
      totalPassed: executions.reduce((sum, e) => sum + e.summary.passed, 0),
      totalFailed: executions.reduce((sum, e) => sum + e.summary.failed, 0),
      averageSuccessRate:
        executions.length > 0
          ? executions.reduce((sum, e) => sum + e.summary.successRate, 0) /
            executions.length
          : 0,
    };
  }
}

export default new ExecutionService();
