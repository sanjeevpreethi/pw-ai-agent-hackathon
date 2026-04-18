/**
 * Test Case Parser Agent
 * Converts raw test cases (manual, Jira, Excel) into structured metadata
 */

import { v4 as uuidv4 } from 'uuid';
import {
  RawTestCase,
  TestMetadata,
  Step,
  Assertion,
  ParserResult,
} from '../types';
import logger from '../utils/logger';
import { TestGenerationError } from '../utils/errors';

export class TestCaseParser {
  /**
   * Parse a raw test case into structured metadata
   */
  async parse(rawTestCase: RawTestCase): Promise<ParserResult> {
    const startTime = Date.now();

    try {
      logger.info('Parsing test case', { testCaseId: rawTestCase.testCaseId });

      // Validate required fields
      this.validateRawTestCase(rawTestCase);

      // Parse steps
      const steps = this.parseSteps(rawTestCase.steps);

      // Parse assertions from expected results
      const assertions = this.parseAssertions(rawTestCase.expectedResults);

      // Create test metadata
      const metadata: TestMetadata = {
        id: uuidv4(),
        name: rawTestCase.testName,
        description: rawTestCase.description,
        steps,
        assertions,
        testData: rawTestCase.testData || {},
        locators: rawTestCase.locatorHints || {},
        tags: rawTestCase.tags || [],
        priority: rawTestCase.priority || 'medium',
        browsers: rawTestCase.browsers || ['chrome'],
        preconditions: rawTestCase.preconditions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const duration = Date.now() - startTime;
      logger.info('Test case parsed successfully', {
        testCaseId: rawTestCase.testCaseId,
        duration,
      });

      return {
        success: true,
        testMetadata: metadata,
        executionTime: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error('Failed to parse test case', errorMessage, {
        testCaseId: rawTestCase.testCaseId,
        duration,
      });

      return {
        success: false,
        errors: [errorMessage],
        executionTime: duration,
      };
    }
  }

  /**
   * Parse multiple test cases
   */
  async parseMultiple(rawTestCases: RawTestCase[]): Promise<ParserResult[]> {
    return Promise.all(rawTestCases.map(tc => this.parse(tc)));
  }

  /**
   * Validate raw test case structure
   */
  private validateRawTestCase(testCase: RawTestCase): void {
    if (!testCase.testCaseId) {
      throw new TestGenerationError('Test case ID is required');
    }
    if (!testCase.testName) {
      throw new TestGenerationError('Test name is required');
    }
    if (!testCase.steps || testCase.steps.length === 0) {
      throw new TestGenerationError('At least one test step is required');
    }
    if (!testCase.expectedResults || testCase.expectedResults.length === 0) {
      throw new TestGenerationError('At least one expected result is required');
    }
  }

  /**
   * Convert test case steps to Step objects
   */
  private parseSteps(
    rawSteps: Array<{
      stepNum: number;
      action: string;
      testData?: string | Record<string, unknown>;
      target?: string;
    }>
  ): Step[] {
    return rawSteps.map((rawStep, index) => ({
      id: uuidv4(),
      description: rawStep.action,
      action: this.normalizeAction(rawStep.action),
      target: rawStep.target,
      value:
        typeof rawStep.testData === 'string'
          ? rawStep.testData
          : typeof rawStep.testData === 'object'
            ? JSON.stringify(rawStep.testData)
            : undefined,
      timeout: 5000 + index * 1000, // Incremental timeout
      retryable: true,
    }));
  }

  /**
   * Convert expected results to Assertion objects
   */
  private parseAssertions(expectedResults: string[]): Assertion[] {
    return expectedResults.map((result, _index) => ({
      id: uuidv4(),
      description: result,
      actual: '', // Will be filled by generator
      matcher: this.detectMatcher(result) as any,
      expected: result,
    }));
  }

  /**
   * Normalize action string to ActionType
   */
  private normalizeAction(
    action: string
  ): 'navigate' | 'click' | 'fill' | 'select' | 'wait' | 'execute' | 'hover' | 'doubleClick' | 'rightClick' | 'screenshot' {
    const normalized = action.toLowerCase();

    if (normalized.includes('navigate') || normalized.includes('go to')) return 'navigate';
    if (normalized.includes('click') && normalized.includes('double')) return 'doubleClick';
    if (normalized.includes('click') && normalized.includes('right')) return 'rightClick';
    if (normalized.includes('click')) return 'click';
    if (normalized.includes('fill') || normalized.includes('enter') || normalized.includes('type')) return 'fill';
    if (normalized.includes('select')) return 'select';
    if (normalized.includes('wait')) return 'wait';
    if (normalized.includes('hover')) return 'hover';
    if (normalized.includes('screenshot') || normalized.includes('capture')) return 'screenshot';
    if (normalized.includes('execute') || normalized.includes('run')) return 'execute';

    return 'execute'; // Default
  }

  /**
   * Detect appropriate matcher from expected result text
   */
  private detectMatcher(result: string): string {
    const text = result.toLowerCase();

    if (text.includes('visible') || text.includes('displayed')) return 'visible';
    if (text.includes('enabled')) return 'enabled';
    if (text.includes('exist') || text.includes('present')) return 'exists';
    if (text.includes('contain') || text.includes('show')) return 'contains';
    if (text.includes('=') || text.includes('equals')) return 'equals';
    if (text.includes('text')) return 'hasText';
    if (text.includes('attribute')) return 'hasAttribute';

    return 'contains'; // Default
  }
}

export default new TestCaseParser();
