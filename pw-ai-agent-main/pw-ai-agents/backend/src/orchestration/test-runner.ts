/**
 * Test Runner Orchestrator
 * Central coordination of test execution across parallel workers
 */

import { v4 as uuidv4 } from 'uuid';
import {
  TestExecutionRequest,
  TestExecutionResponse,
  TestResult,
  ExecutionSummary,
  ExecutionQueueItem,
  TestStatus,
  Browser,
} from '../types';
import logger from '../utils/logger';
import browserManager from './browser-manager';
import retryHandler from './retry-handler';
import config from '../config';

export class TestRunner {
  private executionQueue: ExecutionQueueItem[] = [];
  private runningTests = new Map<string, Promise<TestResult>>();
  private completedResults: TestResult[] = [];

  /**
   * Execute tests with orchestration
   */
  async executeTests(request: TestExecutionRequest): Promise<TestExecutionResponse> {
    const executionId = uuidv4();
    const startTime = Date.now();

    try {
      logger.info('Starting test execution', {
        executionId,
        testCount: request.testIds.length,
        parallel: request.parallel ?? true,
      });

      // Build execution queue
      this.buildExecutionQueue(request);

      // Execute tests
      const testResults: TestResult[] = [];

      if (request.parallel ?? true) {
        const parallel = await this.executeParallel(request);
        testResults.push(...parallel);
      } else {
        const sequential = await this.executeSequential(request);
        testResults.push(...sequential);
      }

      // Generate summary
      const summary = this.generateSummary(testResults, Date.now() - startTime);

      const response: TestExecutionResponse = {
        executionId,
        tests: testResults,
        summary,
        reportPath: this.generateReportPath(executionId),
        timestamp: new Date(),
      };

      logger.info('Test execution completed', {
        executionId,
        passedCount: summary.passed,
        failedCount: summary.failed,
        duration: summary.duration,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Test execution failed', errorMessage, { executionId });

      throw error;
    }
  }

  /**
   * Execute tests in parallel with worker pool
   */
  private async executeParallel(request: TestExecutionRequest): Promise<TestResult[]> {
    const maxWorkers = request.maxWorkers || config.test.maxParallelWorkers;

    // Divide tests among workers
    const testsPerWorker = Math.ceil(request.testIds.length / maxWorkers);

    const workerPromises = Array.from({ length: maxWorkers }, async (_, workerIndex) => {
      const startIdx = workerIndex * testsPerWorker;
      const endIdx = Math.min(startIdx + testsPerWorker, request.testIds.length);
      const workerTests = request.testIds.slice(startIdx, endIdx);

      const workerResults: TestResult[] = [];

      for (const testId of workerTests) {
        const scriptPath = request.scriptPaths[request.testIds.indexOf(testId)];
        const browser = request.browsers?.[0] || 'chrome';
        const isHeadless = request.headless ?? true;

        try {
          const result = await this.executeTest(
            testId,
            scriptPath,
            browser,
            isHeadless
          );

          workerResults.push(result);

          // Retry if failed
          if (result.status === 'failed' && result.retryCount < config.test.retryAttempts) {
            const retryResult = await this.retryTest(
              testId,
              scriptPath,
              browser,
              isHeadless,
              result.retryCount + 1
            );

            workerResults[workerResults.length - 1] = retryResult;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          workerResults.push({
            testId,
            testName: testId,
            status: 'error' as TestStatus,
            duration: 0,
            browser,
            error: { message: errorMessage },
            artifacts: {},
            retryCount: 0,
            timestamp: new Date(),
          });
        }
      }

      return workerResults;
    });

    const allResults = await Promise.all(workerPromises);
    return allResults.flat();
  }

  /**
   * Execute tests sequentially
   */
  private async executeSequential(request: TestExecutionRequest): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (let i = 0; i < request.testIds.length; i++) {
      const testId = request.testIds[i];
      const scriptPath = request.scriptPaths[i];
      const browser = request.browsers?.[0] || 'chrome';

      try {
        const result = await this.executeTest(
          testId,
          scriptPath,
          browser,
          request.headless ?? true
        );

        results.push(result);

        // Retry if failed
        if (result.status === 'failed' && result.retryCount < config.test.retryAttempts) {
          const retryResult = await this.retryTest(
            testId,
            scriptPath,
            browser,
            request.headless ?? true,
            result.retryCount + 1
          );

          results[results.length - 1] = retryResult;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          testId,
          testName: testId,
          status: 'error' as TestStatus,
          duration: 0,
          browser,
          error: { message: errorMessage },
          artifacts: {},
          retryCount: 0,
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Execute a single test
   */
  private async executeTest(
    testId: string,
    _scriptPath: string,
    browser: Browser,
    _headless: boolean
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Allocate browser
      const browserId = await browserManager.allocateBrowser(browser);

      // Simulate test execution
      // In production, this would actually run the Playwright script
      const duration = Math.random() * 5000 + 1000; // Simulate 1-6 second test
      await new Promise(resolve => setTimeout(resolve, duration));

      // Release browser
      await browserManager.releaseBrowser(browserId);

      const actualDuration = Date.now() - startTime;

      // Return result
      const isSuccess = Math.random() > 0.1; // 90% success rate
      return {
        testId,
        testName: testId,
        status: isSuccess ? 'passed' : 'failed',
        duration: actualDuration,
        browser,
        error: isSuccess ? undefined : { message: 'Assertion failed' },
        artifacts: {
          screenshot: `./artifacts/${testId}-screenshot.png`,
        },
        retryCount: 0,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        testId,
        testName: testId,
        status: 'error',
        duration: Date.now() - startTime,
        browser,
        error: { message: errorMessage },
        artifacts: {},
        retryCount: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Retry a failed test
   */
  private async retryTest(
    testId: string,
    scriptPath: string,
    browser: Browser,
    headless: boolean,
    attempt: number
  ): Promise<TestResult> {
    const delay = retryHandler.calculateBackoffDelay(attempt);

    logger.info('Retrying test', {
      testId,
      attempt,
      delay,
    });

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));

    // Execute test again
    const result = await this.executeTest(testId, scriptPath, browser, headless);
    result.retryCount = attempt;

    return result;
  }

  /**
   * Build execution queue
   */
  private buildExecutionQueue(request: TestExecutionRequest): void {
    this.executionQueue = request.testIds.map((testId, index) => ({
      testId,
      scriptPath: request.scriptPaths[index],
      priority: 'high',
      browser: request.browsers?.[0] || 'chrome',
      retryCount: 0,
      maxRetries: config.test.retryAttempts,
      status: 'pending',
    }));
  }

  /**
   * Generate execution summary
   */
  private generateSummary(results: TestResult[], duration: number): ExecutionSummary {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const errors = results.filter(r => r.status === 'error').length;

    return {
      totalTests: results.length,
      passed,
      failed,
      skipped,
      errors,
      duration: Math.round(duration / 1000),
      successRate: (passed / results.length) * 100,
      timestamp: new Date(),
    };
  }

  /**
   * Generate report path
   */
  private generateReportPath(executionId: string): string {
    return `./reports/execution-${executionId}.html`;
  }

  /**
   * Get execution metrics
   */
  getMetrics() {
    return {
      queueLength: this.executionQueue.length,
      runningTests: this.runningTests.size,
      completedTests: this.completedResults.length,
      browserPoolMetrics: browserManager.getMetrics(),
    };
  }
}

export default new TestRunner();
