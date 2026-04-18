/**
 * Script Generation Service Using MCP and Automation Agent
 * This service generates Playwright tests using accessibility-first locators
 * by leveraging the automation-agent with MCP integration
 */

import { BrowserAutomationAgent } from './automation-agent';
import * as fs from 'fs';
import * as path from 'path';

interface TestMetadata {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    stepNumber: number;
    action: string;
    target: string;
    value: string;
  }>;
  assertions: Array<{
    type: string;
    matcher: string;
    expected: string;
  }>;
}

interface GeneratedScript {
  testCode: string;
  accessibilitySnapshot: string;
  executionLog: Array<{
    step: number;
    action: string;
    duration: number;
    result: string;
  }>;
  locators: Array<{
    step: number;
    oldLocator: string;
    newLocator: string;
    strategy: string;
  }>;
}

class TestScriptGenerator {
  private agent: BrowserAutomationAgent;

  constructor() {
    this.agent = new BrowserAutomationAgent();
  }

  /**
   * Convert test metadata steps into user-friendly intent
   */
  private buildUserIntent(steps: TestMetadata['steps']): string {
    const descriptions: string[] = [];

    for (const step of steps) {
      switch (step.action.toLowerCase()) {
        case 'navigate':
          descriptions.push(`Navigate to ${step.target}`);
          break;
        case 'fill':
          descriptions.push(`Fill ${step.target} with "${step.value}"`);
          break;
        case 'click':
          descriptions.push(`Click ${step.target}`);
          break;
        case 'wait':
          descriptions.push(`Wait for ${step.target}`);
          break;
        case 'select':
          descriptions.push(`Select "${step.value}" from ${step.target}`);
          break;
        default:
          descriptions.push(`${step.action} on ${step.target}`);
      }
    }

    return descriptions.join(', then ');
  }

  /**
   * Extract URL from steps
   */
  private extractUrl(steps: TestMetadata['steps']): string | undefined {
    const navigateStep = steps.find(s => s.action.toLowerCase() === 'navigate');
    return navigateStep?.target;
  }

  /**
   * Generate test using automation agent with MCP
   */
  async generateScript(testMetadata: TestMetadata): Promise<GeneratedScript> {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║   Test Script Generation with MCP & Automation Agent   ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log(`📋 Test: ${testMetadata.name}`);
    console.log(`📝 Description: ${testMetadata.description}`);
    console.log(`🔢 Steps: ${testMetadata.steps.length}`);

    try {
      // Initialize browser
      await this.agent.initialize();

      // Build user intent from steps
      const userIntent = this.buildUserIntent(testMetadata.steps);
      const targetUrl = this.extractUrl(testMetadata.steps);

      console.log(`\n🎯 User Intent: ${userIntent}`);
      console.log(`🌐 Target URL: ${targetUrl}`);

      // Execute automation with MCP
      console.log('\n⚙️  Executing test scenario with MCP...\n');
      const result = await this.agent.executeUserRequest(userIntent, targetUrl);

      if (!result.success) {
        throw new Error(`Automation failed: ${result.log[0]?.result || 'Unknown error'}`);
      }

      // Extract locator mappings
      const locatorMappings = this.extractLocatorMappings(
        testMetadata.steps,
        result.executedSteps
      );

      // Generate enhanced test code with proper assertions
      const enhancedTestCode = this.enhanceTestCode(
        result.testCode,
        testMetadata,
        locatorMappings
      );

      // Capture accessibility snapshot from last execution
      const accessibilitySnapshot = await this.agent.captureAccessibilitySnapshot();

      return {
        testCode: enhancedTestCode,
        accessibilitySnapshot,
        executionLog: result.log.map((entry, idx) => ({
          step: idx + 1,
          action: entry.action.action,
          duration: entry.duration,
          result: entry.result,
        })),
        locators: locatorMappings,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Error: ${errorMsg}`);
      throw error;
    } finally {
      await this.agent.cleanup();
    }
  }

  /**
   * Map old locators to new accessibility-based locators
   */
  private extractLocatorMappings(
    steps: TestMetadata['steps'],
    executedSteps: Array<{ step: number; action: { selector: string } }>
  ): Array<{
    step: number;
    oldLocator: string;
    newLocator: string;
    strategy: string;
  }> {
    const mappings: Array<{
      step: number;
      oldLocator: string;
      newLocator: string;
      strategy: string;
    }> = [];

    let stepIndex = 0;
    for (const step of steps) {
      if (step.action.toLowerCase() !== 'navigate') {
        const executedStep = executedSteps[stepIndex];
        if (executedStep) {
          mappings.push({
            step: step.stepNumber,
            oldLocator: step.target,
            newLocator: executedStep.action.selector,
            strategy: this.detectStrategy(executedStep.action.selector),
          });
        }
        stepIndex++;
      }
    }

    return mappings;
  }

  /**
   * Detect selector strategy
   */
  private detectStrategy(selector: string): string {
    if (selector.includes('role=')) return 'role-based';
    if (selector.includes('aria-label')) return 'aria-label';
    if (selector.includes('[placeholder')) return 'placeholder';
    if (selector.includes('text=')) return 'text-based';
    if (selector.includes('getByRole')) return 'getByRole';
    if (selector.includes('getByLabel')) return 'getByLabel';
    if (selector.includes('getByText')) return 'getByText';
    if (selector.includes('getByPlaceholder')) return 'getByPlaceholder';
    return 'css-selector';
  }

  /**
   * Enhance test code with proper structure and assertions
   */
  private enhanceTestCode(
    baseTestCode: string,
    metadata: TestMetadata,
    locatorMappings: Array<any>
  ): string {
    const assertions = this.generateAssertions(metadata.assertions);
    const locatorComments = this.generateLocatorComments(locatorMappings);

    return `import { test, expect } from '@playwright/test';

test.describe('${metadata.name}', () => {
  test('should ${metadata.description}', async ({ page }) => {
    // Generated with MCP-based Automation Agent
    // Accessibility-first locators • Dynamic selector strategy
    
${locatorComments}

${baseTestCode}

${assertions}
  });
});`;
  }

  /**
   * Generate locator mapping comments
   */
  private generateLocatorComments(
    mappings: Array<{ step: number; oldLocator: string; newLocator: string; strategy: string }>
  ): string {
    if (mappings.length === 0) return '';

    const comments = mappings
      .map(
        m =>
          `    // Step ${m.step}: ${m.strategy}
    // Old locator: ${m.oldLocator}
    // New locator: ${m.newLocator}`
      )
      .join('\n');

    return `    // Locator Mapping (Accessibility-First)\n${comments}\n`;
  }

  /**
   * Generate assertion code from metadata
   */
  private generateAssertions(assertions: TestMetadata['assertions']): string {
    const assertionLines = assertions
      .map(assertion => {
        switch (assertion.type) {
          case 'url':
            if (assertion.matcher === 'contains') {
              return `    await expect(page).toHaveURL(/${assertion.expected}.*/)`;
            } else {
              return `    await expect(page).toHaveURL('${assertion.expected}')`;
            }

          case 'text':
            if (assertion.matcher === 'contains') {
              return `    await expect(page.locator('body')).toContainText('${assertion.expected}')`;
            } else {
              return `    await expect(page.locator('body')).toHaveText('${assertion.expected}')`;
            }

          case 'element':
            return `    await expect(page.locator('${assertion.expected}')).toBeVisible()`;

          case 'title':
            return `    await expect(page).toHaveTitle('${assertion.expected}')`;

          default:
            return `    // TODO: Add assertion for ${assertion.type}`;
        }
      })
      .join(';\n');

    return `// Assertions\n${assertionLines};`;
  }

  /**
   * Save generated script to file
   */
  async saveScriptToFile(
    testId: string,
    generated: GeneratedScript,
    outputDir: string = './tests/ui'
  ): Promise<string> {
    const filename = `${testId}.spec.ts`;
    const filepath = path.join(outputDir, filename);

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save test code
    fs.writeFileSync(filepath, generated.testCode);
    console.log(`\n✅ Test code saved to: ${filepath}`);

    // Save accessibility snapshot
    const snapshotPath = path.join(outputDir, `${testId}-accessibility.txt`);
    fs.writeFileSync(snapshotPath, generated.accessibilitySnapshot);
    console.log(`✅ Accessibility snapshot saved to: ${snapshotPath}`);

    // Save execution log
    const logPath = path.join(outputDir, `${testId}-execution.json`);
    fs.writeFileSync(logPath, JSON.stringify(generated.executionLog, null, 2));
    console.log(`✅ Execution log saved to: ${logPath}`);

    // Save locator mappings
    const mappingsPath = path.join(outputDir, `${testId}-locators.json`);
    fs.writeFileSync(mappingsPath, JSON.stringify(generated.locators, null, 2));
    console.log(`✅ Locator mappings saved to: ${mappingsPath}`);

    return filepath;
  }
}

// Extended BrowserAutomationAgent to support snapshot capture
export class BrowserAutomationAgent {
  private page: any = null;
  private browser: any = null;

  async initialize() {
    const { chromium } = require('playwright');
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
  }

  async executeUserRequest(intent: string, url?: string) {
    // This will be provided by automation-agent.ts
    const { default: agent } = await import('./automation-agent');
    return agent.executeUserRequest(intent, url);
  }

  async captureAccessibilitySnapshot(): Promise<string> {
    if (!this.page) return '';

    return await this.page.evaluate(() => {
      const traverseNode = (node: Element, depth = 0): string => {
        const indent = '  '.repeat(depth);
        const role = node.getAttribute('role') || (node.tagName.toLowerCase() as string);
        const ariaLabel = node.getAttribute('aria-label') || '';
        const placeholder = node.getAttribute('placeholder') || '';
        const name = (node as any).innerText?.substring(0, 50) || '';

        let descriptor = `${indent}[${role}]`;
        if (ariaLabel) descriptor += ` (${ariaLabel})`;
        if (placeholder) descriptor += ` placeholder="${placeholder}"`;
        if (name && !ariaLabel) descriptor += ` "${name}"`;

        let result = descriptor + '\n';

        if (depth < 3) {
          const children = Array.from(node.children).slice(0, 10);
          for (const child of children) {
            result += traverseNode(child, depth + 1);
          }
        }

        return result;
      };

      return traverseNode(document.body);
    });
  }

  async cleanup() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }
}

// Export for API usage
export { TestScriptGenerator, GeneratedScript, TestMetadata };
