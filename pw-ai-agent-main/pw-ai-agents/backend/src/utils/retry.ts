/**
 * Retry and Circuit Breaker Utilities
 */

import logger from './logger';

/**
 * Determines if an error is retriable
 */
export function isRetriableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const retriablePatterns = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'stale element',
    'timeout',
    'transient',
    'temporarily unavailable',
  ];

  const message = error.message.toLowerCase();
  return retriablePatterns.some(pattern => message.includes(pattern));
}

/**
 * Retry an async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetriableError(error) || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = Math.pow(2, attempt - 1) * baseDelay;
      logger.warn(`Retrying after ${delay}ms (attempt ${attempt}/${maxRetries})`, {
        error: lastError.message,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Circuit Breaker Pattern
 */
export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime: number | null = null;

  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 5 * 60 * 1000 // 5 minutes
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
        logger.info('Circuit breaker transitioning to half-open');
      } else {
        throw new Error('Circuit breaker is open - too many failures');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
      logger.info('Circuit breaker recovered - transitioning to closed');
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      logger.warn('Circuit breaker opened due to failure threshold', {
        failureCount: this.failureCount,
      });
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime >= this.resetTimeout
    );
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}
