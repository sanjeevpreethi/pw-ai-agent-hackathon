/**
 * Retry Handler
 * Handles retry logic with exponential backoff and error classification
 */

import { TestResult } from '../types';

export interface RetryableTestResult extends TestResult {
  shouldRetry: boolean;
  retryReason?: string;
}

/**
 * Categorize error and determine if retriable
 */
export function classifyError(error: unknown): {
  isRetriable: boolean;
  category: 'infrastructure' | 'test_failure' | 'permanent_issue';
  shouldEscalate: boolean;
} {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Infrastructure issues (retriable)
  const infrastructurePatterns = [
    'timeout',
    'connection refused',
    'connection reset',
    'host unreachable',
    'network error',
    'stale element',
    'element not attached',
    'navigation timeout',
    'browser crash',
  ];

  if (infrastructurePatterns.some(pattern => errorMessage.includes(pattern))) {
    return {
      isRetriable: true,
      category: 'infrastructure',
      shouldEscalate: false,
    };
  }

  // Permanent issues (non-retriable)
  const permanentPatterns = [
    'assertion failed',
    'not found',
    'unauthorized',
    'forbidden',
    'syntax error',
    'missing helper',
    'invalid api',
  ];

  if (permanentPatterns.some(pattern => errorMessage.includes(pattern))) {
    return {
      isRetriable: false,
      category: 'permanent_issue',
      shouldEscalate: true,
    };
  }

  // Unknown error - treat as retriable once
  return {
    isRetriable: true,
    category: 'infrastructure',
    shouldEscalate: errorMessage.includes('circuit open'),
  };
}

export class RetryHandler {
  /**
   * Evaluate test result and determine retry strategy
   */
  evaluateRetryStrategy(
    result: TestResult,
    attempt: number,
    maxRetries: number
  ): RetryableTestResult {
    const retriable = result.status === 'failed' && attempt < maxRetries;

    if (retriable && result.error) {
      const classification = classifyError(result.error.message);

      return {
        ...result,
        shouldRetry: classification.isRetriable,
        retryReason: classification.isRetriable
          ? `Infrastructure issue: ${result.error.message}`
          : `Permanent failure: ${result.error.message}`,
      };
    }

    return {
      ...result,
      shouldRetry: false,
      retryReason: result.status !== 'failed' ? 'Test passed or skipped' : undefined,
    };
  }

  /**
   * Calculate backoff delay for retry
   */
  calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.pow(2, attempt - 1) * baseDelay;
  }

  /**
   * Determine if result should be logged for manual review
   */
  shouldEscalateForReview(result: TestResult, maxRetries: number): boolean {
    if (result.status !== 'failed') return false;
    if (result.retryCount < maxRetries) return false;

    if (result.error) {
      const classification = classifyError(result.error.message);
      return classification.shouldEscalate;
    }

    return true;
  }

  /**
   * Generate retry report
   */
  generateRetryReport(originalResult: TestResult, retryResults: TestResult[]): object {
    const allResults = [originalResult, ...retryResults];
    const successfulRetry = retryResults.find(r => r.status === 'passed');

    return {
      testId: originalResult.testId,
      testName: originalResult.testName,
      totalAttempts: allResults.length,
      successfulAttempt: successfulRetry ? retryResults.indexOf(successfulRetry) + 2 : null,
      finalStatus: successfulRetry ? 'passed_on_retry' : originalResult.status,
      timeline: allResults.map((r, i) => ({
        attempt: i + 1,
        status: r.status,
        duration: r.duration,
        error: r.error?.message,
      })),
      recoveryRate: allResults.filter(r => r.status === 'passed').length / allResults.length,
    };
  }
}

export default new RetryHandler();
