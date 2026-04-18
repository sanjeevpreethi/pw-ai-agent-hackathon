/**
 * Script Validator Agent
 * Validates generated TypeScript scripts for syntax and compliance
 */

import { ValidatorResult, ValidationError } from '../types';
import logger from '../utils/logger';

export class ScriptValidator {
  /**
   * Validate a generated Playwright script
   */
  async validate(script: string): Promise<ValidatorResult> {
    const startTime = Date.now();

    try {
      logger.info('Validating generated script', { scriptLength: script.length });

      const validationResult: ValidatorResult = {
        isValid: true,
        validationResult: {
          isValid: true,
          errors: [],
          warnings: [],
          report: {
            syntaxValid: true,
            lintValid: true,
            helperReferencesValid: true,
            playwrightAPIValid: true,
          },
        },
        executionTime: Date.now() - startTime,
      };

      // 1. Syntax Check
      const syntaxErrors = this.checkSyntax(script);
      if (syntaxErrors.length > 0) {
        validationResult.isValid = false;
        validationResult.validationResult.isValid = false;
        validationResult.validationResult.errors.push(...syntaxErrors);
        validationResult.validationResult.report.syntaxValid = false;
      }

      // 2. Playwright API Validation
      const apiErrors = this.validatePlaywrightAPI(script);
      if (apiErrors.length > 0) {
        validationResult.isValid = false;
        validationResult.validationResult.isValid = false;
        validationResult.validationResult.errors.push(...apiErrors);
        validationResult.validationResult.report.playwrightAPIValid = false;
      }

      // 3. Helper References Validation
      const helperErrors = this.validateHelperReferences(script);
      if (helperErrors.length > 0) {
        validationResult.isValid = false;
        validationResult.validationResult.isValid = false;
        validationResult.validationResult.errors.push(...helperErrors);
        validationResult.validationResult.report.helperReferencesValid = false;
      }

      // 4. Code Quality Checks
      const warnings = this.performQualityChecks(script);
      validationResult.validationResult.warnings.push(...warnings);

      const duration = Date.now() - startTime;
      logger.info('Script validation completed', {
        isValid: validationResult.isValid,
        errorCount: validationResult.validationResult.errors.length,
        warningCount: validationResult.validationResult.warnings.length,
        duration,
      });

      validationResult.executionTime = duration;
      return validationResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error('Failed to validate script', errorMessage, {
        duration,
      });

      return {
        isValid: false,
        validationResult: {
          isValid: false,
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: errorMessage,
            },
          ],
          warnings: [],
          report: {
            syntaxValid: false,
            lintValid: false,
            helperReferencesValid: false,
            playwrightAPIValid: false,
          },
        },
        executionTime: duration,
      };
    }
  }

  /**
   * Check basic syntax
   */
  private checkSyntax(script: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for common syntax issues
    if (!script.includes('import') && !script.includes('require')) {
      errors.push({
        code: 'MISSING_IMPORTS',
        message: 'Script must have import or require statements',
      });
    }

    if (!script.includes('test(') && !script.includes('test.describe')) {
      errors.push({
        code: 'MISSING_TEST',
        message: 'Script must contain test() or test.describe() block',
      });
    }

    // Check for unmatched braces
    if (this.countChar(script, '{') !== this.countChar(script, '}')) {
      errors.push({
        code: 'UNMATCHED_BRACES',
        message: 'Unmatched curly braces detected',
      });
    }

    // Check for unmatched parentheses
    if (this.countChar(script, '(') !== this.countChar(script, ')')) {
      errors.push({
        code: 'UNMATCHED_PARENTHESES',
        message: 'Unmatched parentheses detected',
      });
    }

    return errors;
  }

  /**
   * Validate Playwright API usage
   */
  private validatePlaywrightAPI(script: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Valid Playwright methods for reference
    void [
      'page.goto',
      'page.click',
      'page.fill',
      'page.type',
      'page.press',
      'page.locator',
      'page.waitForSelector',
      'page.waitForNavigation',
      'page.screenshot',
      'page.evaluate',
      'expect',
      'toBeVisible',
      'toContainText',
      'toHaveText',
      'toBeEnabled',
    ];

    // Check for commonly misused methods
    if (script.includes('page.driver') || script.includes('page.querySelector')) {
      errors.push({
        code: 'INVALID_API',
        message: 'Using non-Playwright methods. Use Playwright locators instead.',
      });
    }

    if (script.includes('driver.') && !script.includes('// driver')) {
      errors.push({
        code: 'SELENIUM_CODE',
        message: 'Selenium WebDriver code detected. Use Playwright API instead.',
      });
    }

    return errors;
  }

  /**
   * Validate helper references
   */
  private validateHelperReferences(script: string): ValidationError[] {
    const errors: ValidationError[] = [];

    const references: { [key: string]: boolean } = {
      AuthHelper: script.includes('AuthHelper'),
      NavigationHelper: script.includes('NavigationHelper'),
      ApiClient: script.includes('ApiClient'),
    };

    // Check that referenced helpers are imported
    for (const [helper, referenced] of Object.entries(references)) {
      if (referenced && !script.includes(`import { ${helper.replace(/Helper|Client/, '')} }`)) {
        if (
          !script.includes(`from '../helpers`) &&
          !script.includes('new ' + helper)
        ) {
          errors.push({
            code: 'MISSING_IMPORT',
            message: `Helper ${helper} is used but not imported properly`,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Perform code quality checks
   */
  private performQualityChecks(script: string): string[] {
    const warnings: string[] = [];

    // Check script length
    if (script.length > 10000) {
      warnings.push('Script is very large (>10KB). Consider breaking into smaller tests.');
    }

    // Check indentation consistency
    const lines = script.split('\n');
    const indentations = lines.map(line => {
      const match = line.match(/^(\s*)/);
      return match ? match[1].length : 0;
    });

    const hasInconsistentIndent = indentations.some((indent, i) => {
      if (i === 0) return false;
      const diff = Math.abs(indent - indentations[i - 1]);
      return diff > 4 && indentations[i - 1] !== 0;
    });

    if (hasInconsistentIndent) {
      warnings.push('Inconsistent indentation detected. Ensure consistent spacing.');
    }

    // Check for hardcoded waits
    if (script.match(/setTimeout|wait\(\s*\d+\s*\)/)) {
      warnings.push('Hardcoded wait times detected. Use page.waitForSelector or explicit waits.');
    }

    // Check for missing assertions
    if (!script.includes('expect(')) {
      warnings.push('No assertions found in test. Add expect() statements for test validation.');
    }

    return warnings;
  }

  /**
   * Helper: count character occurrences
   */
  private countChar(str: string, char: string): number {
    return str.split(char).length - 1;
  }
}

export default new ScriptValidator();
