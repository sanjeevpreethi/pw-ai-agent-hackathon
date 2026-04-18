/**
 * Data Validation Utilities
 */

import { z } from 'zod';
import { RawTestCase, TestMetadata } from '../types';

// Zod schemas for validation
export const StepSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  action: z.enum(['navigate', 'click', 'fill', 'select', 'wait', 'execute', 'hover', 'doubleClick', 'rightClick', 'screenshot']),
  target: z.string().optional(),
  value: z.string().optional(),
  timeout: z.number().positive().optional(),
  retryable: z.boolean().optional(),
});

export const AssertionSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  actual: z.string().min(1),
  matcher: z.enum(['equals', 'contains', 'exists', 'visible', 'enabled', 'hasText', 'hasAttribute']),
  expected: z.string(),
});

export const TestMetadataSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  steps: z.array(StepSchema).min(1),
  assertions: z.array(AssertionSchema).min(1),
  testData: z.record(z.unknown()),
  locators: z.record(z.string()),
  tags: z.array(z.string()),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  browsers: z.array(z.enum(['chrome', 'firefox', 'safari', 'edge'])).min(1),
  dependencies: z.array(z.string()).optional(),
  preconditions: z.string().optional(),
  postconditions: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const RawTestCaseSchema = z.object({
  testCaseId: z.string().min(1),
  testName: z.string().min(1),
  description: z.string().optional(),
  preconditions: z.string().optional(),
  steps: z.array(z.object({
    stepNum: z.number().positive(),
    action: z.string(),
    testData: z.union([z.string(), z.record(z.unknown())]).optional(),
    target: z.string().optional(),
  })).min(1),
  expectedResults: z.array(z.string()).min(1),
  testData: z.record(z.unknown()),
  locatorHints: z.record(z.string()).optional(),
  browsers: z.array(z.enum(['chrome', 'firefox', 'safari', 'edge'])).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Validate raw test case input
 */
export function validateRawTestCase(data: unknown): RawTestCase {
  return RawTestCaseSchema.parse(data);
}

/**
 * Validate test metadata
 */
export function validateTestMetadata(data: unknown): TestMetadata {
  return TestMetadataSchema.parse(data);
}

/**
 * Safe validation with error details
 */
export function safeValidate<T>(schema: z.ZodSchema, data: unknown): { valid: true; data: T } | { valid: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { valid: true, data: result as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { valid: false, errors };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}
