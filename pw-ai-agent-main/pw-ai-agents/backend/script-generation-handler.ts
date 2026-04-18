/**
 * Playwright Test Script Generation API Handler
 * Endpoint: POST /api/v1/scripts/generate
 * 
 * This handler:
 * 1. Receives test metadata (steps and assertions)
 * 2. Uses the MCP-based automation agent to execute the test
 * 3. Captures accessibility snapshots
 * 4. Generates accessibility-first Playwright code
 * 5. Returns both the test code and locator mappings
 */

import { Request, Response } from 'express';
import { TestScriptGenerator, TestMetadata } from '../test-generator';

interface ScriptGenerationRequest {
  testMetadata: TestMetadata;
}

interface ScriptGenerationResponse {
  success: boolean;
  testCode?: string;
  accessibilitySnapshot?: string;
  executionLog?: Array<{
    step: number;
    action: string;
    duration: number;
    result: string;
  }>;
  locators?: Array<{
    step: number;
    oldLocator: string;
    newLocator: string;
    strategy: string;
  }>;
  filePath?: string;
  error?: string;
}

/**
 * Main handler for test script generation
 */
export async function generateScript(
  req: Request,
  res: Response<ScriptGenerationResponse>
): Promise<void> {
  try {
    // Validate request
    if (!req.body || !req.body.testMetadata) {
      res.status(400).json({
        success: false,
        error: 'Missing testMetadata in request body',
      });
      return;
    }

    const request = req.body as ScriptGenerationRequest;
    const { testMetadata } = request;

    // Validate metadata
    if (!testMetadata.id || !testMetadata.name || !testMetadata.steps) {
      res.status(400).json({
        success: false,
        error: 'testMetadata must include id, name, and steps',
      });
      return;
    }

    console.log(`\n📝 Generating script for test: ${testMetadata.id}`);
    console.log(`📌 Test name: ${testMetadata.name}`);

    // Initialize generator
    const generator = new TestScriptGenerator();

    // Generate script using MCP and automation agent
    console.log('\n🚀 Starting MCP-based test generation...');
    const generated = await generator.generateScript(testMetadata);

    // Save to file
    const filePath = await generator.saveScriptToFile(testMetadata.id);

    // Return response
    res.status(200).json({
      success: true,
      testCode: generated.testCode,
      accessibilitySnapshot: generated.accessibilitySnapshot,
      executionLog: generated.executionLog,
      locators: generated.locators,
      filePath,
    });

    console.log(
      '\n✅ Script generation completed successfully\n'
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Error generating script: ${errorMsg}\n`);

    res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
}

/**
 * Validate and transform locators from data-testid to accessibility-based
 */
export function validateAndTransformLocators(
  steps: TestMetadata['steps']
): TestMetadata['steps'] {
  return steps.map(step => ({
    ...step,
    // Add validation warnings if using brittle selectors
    target: validateLocator(step.target, step.action),
  }));
}

/**
 * Check locator for potential brittleness
 */
function validateLocator(locator: string, action: string): string {
  const brittlePatterns = [
    /data-testid/,
    /data-qa/,
    /class=\\"[\w-]*-\d+\\"/, // Classes with numbers
    /\[id=\\"[\w-]*-\d+\\"\]/, // IDs with numbers
  ];

  const isBrittle = brittlePatterns.some(pattern => pattern.test(locator));

  if (isBrittle && action.toLowerCase() !== 'navigate') {
    console.warn(
      `⚠️  Warning: Potential brittle locator detected: ${locator}\n   Recommend using: accessibility-based selectors (role, label, placeholder, text)`
    );
  }

  return locator;
}

/**
 * Generate detailed report with locator analysis
 */
export async function generateAnalysisReport(
  testMetadata: TestMetadata
): Promise<{
  brittleLocators: string[];
  recommendations: string[];
  summary: string;
}> {
  const brittleLocators: string[] = [];
  const recommendations: string[] = [];

  for (const step of testMetadata.steps) {
    if (step.target.includes('data-testid') || step.target.includes('data-qa')) {
      brittleLocators.push(step.target);

      // Add recommendations
      if (step.action.toLowerCase() === 'click') {
        recommendations.push(
          `Step ${step.stepNumber}: Use getByRole() for "${step.target}"`
        );
      } else if (step.action.toLowerCase() === 'fill') {
        recommendations.push(
          `Step ${step.stepNumber}: Use getByLabel() or getByPlaceholder() for "${step.target}"`
        );
      }
    }
  }

  return {
    brittleLocators,
    recommendations,
    summary:
      brittleLocators.length > 0
        ? `Found ${brittleLocators.length} brittle locators. Recommend using accessibility-based selectors.`
        : 'All locators look good!',
  };
}

/**
 * Express middleware to parse and validate script generation requests
 */
export function validateScriptRequest(
  req: Request,
  res: Response,
  next: Function
): void {
  try {
    if (!req.body) {
      throw new Error('Request body is empty');
    }

    const { testMetadata } = req.body;

    if (!testMetadata) {
      throw new Error('testMetadata is required');
    }

    // Validate required fields
    const requiredFields = ['id', 'name', 'steps'];
    for (const field of requiredFields) {
      if (!testMetadata[field]) {
        throw new Error(`testMetadata.${field} is required`);
      }
    }

    // Validate steps structure
    if (!Array.isArray(testMetadata.steps)) {
      throw new Error('testMetadata.steps must be an array');
    }

    for (const step of testMetadata.steps) {
      if (!step.action || !step.target) {
        throw new Error('Each step must have action and target');
      }
    }

    // Validation passed
    next();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(400).json({
      success: false,
      error: `Validation error: ${errorMsg}`,
    });
  }
}

export default { generateScript, validateScriptRequest, generateAnalysisReport };
