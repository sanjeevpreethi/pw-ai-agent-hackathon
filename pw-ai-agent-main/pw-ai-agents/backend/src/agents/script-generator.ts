/**
 * Script Generator Agent
 * Converts test metadata to executable Playwright TypeScript scripts
 * Integrates GrokAPI LLM for intelligent generation and Playwright MCP for locators
 */

import { promises as fs } from 'fs';
import path from 'path';
import { TestMetadata, GeneratorResult } from '../types';
import logger from '../utils/logger';
import { TestGenerationError } from '../utils/errors';
import { retryWithBackoff } from '../utils/retry';
import locatorDiscoveryService from './locator-discovery';
import GrokLLMService from './grok-llm-service';
import config from '../config';

export class ScriptGenerator {
  private useLocatorDiscovery = true;
  private useLLMEnhancement = config.grok.useForEnhancement && config.grok.enabled;
  private llmService?: GrokLLMService;

  constructor() {
    // Initialize LLM service if enabled
    if (config.grok.enabled && config.grok.apiKey) {
      this.llmService = new GrokLLMService({
        apiKey: config.grok.apiKey,
        model: config.grok.model,
        endpoint: config.grok.endpoint,
        maxTokens: config.grok.maxTokens,
        temperature: config.grok.temperature,
      });
      logger.info('GrokAPI LLM service initialized for test generation');
    } else {
      logger.warn('GrokAPI not configured - using rule-based generation only');
    }
  }

  /**
   * Generate Playwright script from test metadata
   * Uses LLM for enhancement if configured, combined with Playwright MCP for locators
   */
  async generate(metadata: TestMetadata): Promise<GeneratorResult> {
    const startTime = Date.now();
    const llmEnabled = Boolean(this.llmService && this.useLLMEnhancement);
    let llmUsed = false;

    try {
      logger.info('Generating test script', { 
        testId: metadata.id, 
        testName: metadata.name,
        llmEnabled
      });

      // Step 1: Enhance metadata with LLM if enabled
      let enhancedMetadata = metadata;
      if (this.llmService && this.useLLMEnhancement) {
        try {
          logger.info('Enhancing test metadata with GrokAPI');
          enhancedMetadata = await this.llmService.enhanceTestMetadata(
            `${metadata.name}: ${metadata.description}`,
            metadata
          );
          llmUsed = enhancedMetadata !== metadata;
          logger.info('Metadata enhancement complete', {
            originalSteps: metadata.steps.length,
            enhancedSteps: enhancedMetadata.steps.length,
          });
        } catch (enhancementError) {
          logger.warn('LLM metadata enhancement failed, continuing with original', {
            error: enhancementError instanceof Error ? enhancementError.message : String(enhancementError),
          });
        }
      }

      // Step 2: Generate script with enhanced metadata
      const script = await retryWithBackoff(
        () => this.generateScript(enhancedMetadata),
        3,
        500
      );

      const duration = Date.now() - startTime;
      logger.info('Script generated successfully', {
        testId: metadata.id,
        duration,
        scriptLength: script.length,
        llmUsed: this.useLLMEnhancement,
      });

      return {
        success: true,
        generatedScript: script,
        executionTime: duration,
        llmEnabled,
        llmUsed,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error('Failed to generate script', errorMessage, {
        testId: metadata.id,
        duration,
      });

      return {
        success: false,
        errors: [errorMessage],
        executionTime: duration,
        llmEnabled,
        llmUsed,
      };
    }
  }

  /**
   * Generate the actual Playwright TypeScript code
   */
  private async generateScript(metadata: TestMetadata): Promise<string> {
    // Validate metadata
    if (!metadata.steps || metadata.steps.length === 0) {
      throw new TestGenerationError('Test metadata must contain at least one step');
    }

    if (!metadata.assertions || metadata.assertions.length === 0) {
      throw new TestGenerationError('Test metadata must contain at least one assertion');
    }

    try {
      // Generate imports
      const imports = this.generateImports(metadata);

      // Generate test description block
      const describe = await this.generateDescribe(metadata);

      // Combine all parts
      const script = `${imports}\n\n${describe}`;

      return script;
    } finally {
      // Cleanup locator discovery resources
      await locatorDiscoveryService.cleanup();
    }
  }

  /**
   * Generate import statements
   */
  private generateImports(_metadata: TestMetadata): string {
    return `import { test, expect } from '@playwright/test';`;
  }

  /**
   * Generate describe block
   */
  private async generateDescribe(metadata: TestMetadata): Promise<string> {
    // Tags and browsers can be used for filtering/documentation
    void metadata.tags;
    void metadata.browsers;

    const body = await this.generateTestBody(metadata);
    return `test.describe('${metadata.name}', () => {
  test('should ${metadata.description || metadata.name.toLowerCase()}', async ({ page }) => {
${body}
  });
});`;
  }

  /**
   * Generate test body
   */
  private async generateTestBody(metadata: TestMetadata): Promise<string> {
    const steps = await this.generateSteps(metadata);
    const assertions = this.generateAssertions(metadata);

    return `${steps}${assertions && assertions.trim() ? '\n\n' + assertions : ''}`;
  }

  /**
   * Generate step implementations with locator discovery
   */
  private async generateSteps(metadata: TestMetadata): Promise<string> {
    const escapeSelector = (selector: string) => {
      // Escape double quotes if selector contains them
      return selector.replace(/"/g, '\\"').replace(/`/g, '\\`');
    };

    // Get the navigation URL (from first Navigate step)
    const navigateStep = metadata.steps.find(s => (s.action || '').toLowerCase() === 'navigate');
    const pageUrl = navigateStep?.value || navigateStep?.target || '';

    const stepsCode: string[] = [];

    for (const step of metadata.steps) {
      const action = (step.action || '').toLowerCase();
      const timeout = step.timeout || 5000;
      const desc = step.description || step.action;

      try {
        switch (action) {
          case 'navigate':
            const urlToNavigate = step.value || step.target || '/';
            const escapedUrl = urlToNavigate.replace(/"/g, '\\"').replace(/`/g, '\\`');
            stepsCode.push(`    await page.goto("${escapedUrl}", { waitUntil: 'networkidle' });`);
            break;

          case 'fill':
          case 'click':
            // Discover locator using Playwright MCP
            let discoveredLocator = step.target; // fallback to provided target
            let isPlaywrightApi = false; // Track if locator is a Playwright API call
            
            if (this.useLocatorDiscovery && pageUrl && step.description) {
              try {
                const discovery = await locatorDiscoveryService.discoverLocator({
                  url: pageUrl,
                  elementDescription: step.description,
                  action: action
                });
                discoveredLocator = discovery.selector;
                // Check if this is a Playwright API call (getBy* or locator)
                isPlaywrightApi = /^(getBy|locator)/.test(discoveredLocator);
                
                logger.info('Discovered locator', {
                  description: step.description,
                  selector: discoveredLocator,
                  method: discovery.method,
                  confidence: discovery.confidence
                });
              } catch (discoveryError) {
                logger.warn('Locator discovery failed, attempting LLM suggestions', {
                  description: step.description,
                  error: discoveryError instanceof Error ? discoveryError.message : String(discoveryError)
                });
                
                // Try LLM-based locator suggestion as fallback
                if (this.llmService) {
                  try {
                    const suggestions = await this.llmService.suggestLocators(
                      step.description,
                      pageUrl,
                      action
                    );
                    
                    if (suggestions.length > 0) {
                      discoveredLocator = suggestions[0]; // Use first suggestion
                      isPlaywrightApi = /^(getBy|locator)/.test(discoveredLocator);
                      logger.info('LLM locator suggestion used', {
                        description: step.description,
                        selector: discoveredLocator,
                      });
                    }
                  } catch (llmError) {
                    logger.warn('LLM locator suggestion also failed', {
                      error: llmError instanceof Error ? llmError.message : String(llmError)
                    });
                  }
                }
              }
            }

            // Build the locator accessor
            let locatorAccessor: string;
            if (isPlaywrightApi) {
              // Direct Playwright API call (e.g., getByTestId('username'))
              locatorAccessor = `page.${discoveredLocator}`;
            } else {
              // CSS selector, wrap in locator()
              const escapedSelector = escapeSelector(discoveredLocator || 'body');
              locatorAccessor = `page.locator("${escapedSelector}")`;
            }

            if (action === 'fill') {
              const escapedValue = (step.value || '').replace(/"/g, '\\"').replace(/`/g, '\\`');
              stepsCode.push(`    await ${locatorAccessor}.fill("${escapedValue}", { timeout: ${timeout} });`);
            } else if (action === 'click') {
              stepsCode.push(`    await ${locatorAccessor}.click({ timeout: ${timeout} });`);
            }
            break;

          case 'hover':
            const hoverSelector = `"${escapeSelector(step.target || 'body')}"`;
            stepsCode.push(`    await page.locator(${hoverSelector}).hover({ timeout: ${timeout} });`);
            break;

          case 'wait':
            const waitSelector = `"${escapeSelector(step.target || 'body')}"`;
            stepsCode.push(`    await page.waitForSelector(${waitSelector}, { timeout: ${timeout} });`);
            break;

          case 'screenshot':
            stepsCode.push(`    await page.screenshot({ path: './test-results/${metadata.id}-screenshot.png' });`);
            break;

          default:
            stepsCode.push(`    // Step: ${desc}`);
        }
      } catch (error) {
        logger.error('Error generating step', error instanceof Error ? error.message : String(error), { step });
        stepsCode.push(`    // Error generating step: ${desc}`);
      }
    }

    return stepsCode.map(step => step.trim()).join('\n');
  }

  /**
   * Generate assertion implementations
   */
  private generateAssertions(metadata: TestMetadata): string {
    const escapeSelector = (selector: string) => {
      return selector.replace(/"/g, '\\"').replace(/`/g, '\\`');
    };

    return metadata.assertions
      .map((assertion: any) => {
        const escapedExpected = (assertion.expected || '').replace(/"/g, '\\"').replace(/`/g, '\\`');
        const expected = `"${escapedExpected}"`;
        const matcher = (assertion.matcher || '').toLowerCase();
        
        // Handle URL assertions
        if (assertion.type === 'url') {
          switch (matcher) {
            case 'contains':
              return `    await expect(page).toHaveURL(/.*${escapedExpected}.*/);`;
            case 'equals':
            case 'exact':
              return `    await expect(page).toHaveURL("${escapedExpected}");`;
            default:
              return `    // URL assertion: ${matcher} ${escapedExpected}`;
          }
        }
        
        // Handle text assertions (page-level text)
        if (assertion.type === 'text') {
          switch (matcher) {
            case 'contains':
              return `    await expect(page.locator('body')).toContainText(${expected});`;
            case 'equals':
              return `    await expect(page.locator('body')).toHaveText(${expected});`;
            default:
              return `    // Text assertion: ${matcher} ${escapedExpected}`;
          }
        }
        
        // Handle element/standard assertions
        const escapedSelector = escapeSelector(assertion.actual || 'body');
        const selector = `"${escapedSelector}"`;
        
        switch (matcher) {
          case 'visible':
            return `    await expect(page.locator(${selector})).toBeVisible();`;
          case 'exists':
            return `    await expect(page.locator(${selector})).toBeTruthy();`;
          case 'contains':
            return `    await expect(page.locator(${selector})).toContainText(${expected});`;
          case 'equals':
            return `    await expect(page.locator(${selector})).toHaveText(${expected});`;
          case 'hastext':
            return `    await expect(page.locator(${selector})).toContainText(${expected});`;
          case 'enabled':
            return `    await expect(page.locator(${selector})).toBeEnabled();`;
          default:
            return `    await expect(page.locator(${selector})).toBeTruthy();`;
        }
      })
      .map(assertion => `    ${assertion.trim()}`)
      .join('\n');
  }

  /**
   * Save generated script to file system
   */
  async saveScript(testId: string, script: string): Promise<string> {
    try {
      // Construct the path to tests/ui folder
      const projectRoot = path.join(__dirname, '../../..');
      const testDir = path.join(projectRoot, 'tests', 'ui');
      const filePath = path.join(testDir, `${testId}.spec.ts`);

      // Create directory if it doesn't exist
      await fs.mkdir(testDir, { recursive: true });

      // Write script to file
      await fs.writeFile(filePath, script, 'utf-8');

      logger.info('Test script saved to disk', { testId, filePath });

      // Return relative path from project root
      const relativePath = path.relative(projectRoot, filePath);
      return relativePath.replace(/\\\\/g, '/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to save script to disk', errorMessage, { testId });
      throw new TestGenerationError(`Failed to save script: ${errorMessage}`);
    }
  }
}

export default new ScriptGenerator();
