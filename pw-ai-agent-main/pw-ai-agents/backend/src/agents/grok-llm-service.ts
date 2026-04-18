/**
 * GrokAPI LLM Service
 * Integrates with xAI's Grok API for intelligent test generation
 */

import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';
import { TestMetadata, Step, Assertion, MatcherType } from '../types';

export interface GrokConfig {
  apiKey: string;
  model: string;
  endpoint: string;
  maxTokens: number;
  temperature: number;
}

export interface TestGenerationPrompt {
  testMetadata: TestMetadata;
  userDescription: string;
  pageUrl: string;
}

export interface GrokResponse {
  content: string;
  tokens: number;
  model: string;
}

export class GrokLLMService {
  private client: AxiosInstance;
  private config: GrokConfig;

  constructor(grokConfig: GrokConfig) {
    this.config = grokConfig;
    this.client = axios.create({
      baseURL: grokConfig.endpoint,
      headers: {
        'Authorization': `Bearer ${grokConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Generate enhanced test case understanding from user description
   * Uses LLM to extract intent, test data, and expected scenarios
   */
  async enhanceTestMetadata(
    userDescription: string,
    testMetadata: TestMetadata
  ): Promise<TestMetadata> {
    try {
      const prompt = this.buildEnhancementPrompt(userDescription, testMetadata);
      const response = await this.callGrokAPI(prompt);

      const enhanced = this.parseEnhancedMetadata(response.content, testMetadata);
      
      logger.info('Test metadata enhanced with LLM', {
        testId: testMetadata.id,
        inputTokens: response.tokens,
        enhancedSteps: enhanced.steps.length,
      });

      return enhanced;
    } catch (error) {
      logger.warn('LLM enhancement failed, using original metadata', {
        error: error instanceof Error ? error.message : String(error),
        testId: testMetadata.id,
      });
      return testMetadata;
    }
  }

  /**
   * Generate optimized assertion selectors based on context
   */
  async optimizeAssertions(
    assertions: Assertion[],
    pageUrl: string,
    pageContent?: string
  ): Promise<Assertion[]> {
    try {
      const prompt = this.buildAssertionPrompt(assertions, pageUrl, pageContent);
      const response = await this.callGrokAPI(prompt);

      const optimized = this.parseAssertionResponse(response.content, assertions);

      logger.info('Assertions optimized with LLM', {
        originalCount: assertions.length,
        optimizedCount: optimized.length,
      });

      return optimized;
    } catch (error) {
      logger.warn('Assertion optimization failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return assertions;
    }
  }

  /**
   * Generate intelligent step descriptions and test data
   */
  async enrichSteps(steps: Step[], pageUrl: string): Promise<Step[]> {
    try {
      const prompt = this.buildStepEnrichmentPrompt(steps, pageUrl);
      const response = await this.callGrokAPI(prompt);

      const enriched = this.parseEnrichedSteps(response.content, steps);

      logger.info('Steps enriched with LLM', {
        stepCount: steps.length,
        enhancedSteps: enriched.length,
      });

      return enriched;
    } catch (error) {
      logger.warn('Step enrichment failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return steps;
    }
  }

  /**
   * Generate locator suggestions for fallback when Playwright discovery fails
   */
  async suggestLocators(
    elementDescription: string,
    pageUrl: string,
    action: string,
    pageHtml?: string
  ): Promise<string[]> {
    try {
      const prompt = this.buildLocatorSuggestionPrompt(
        elementDescription,
        pageUrl,
        action,
        pageHtml
      );
      const response = await this.callGrokAPI(prompt);

      const suggestions = this.parseLocatorSuggestions(response.content);

      logger.info('Locator suggestions generated', {
        element: elementDescription,
        action,
        suggestionsCount: suggestions.length,
      });

      return suggestions;
    } catch (error) {
      logger.warn('Locator suggestion failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Generate test script structure and complexity analysis
   */
  async analyzeTestComplexity(testMetadata: TestMetadata): Promise<{
    complexity: 'simple' | 'moderate' | 'complex';
    recommendations: string[];
    riskAreas: string[];
  }> {
    try {
      const prompt = `Analyze this test case for complexity:
ID: ${testMetadata.id}
Name: ${testMetadata.name}
Description: ${testMetadata.description}
Steps: ${testMetadata.steps.length}
Assertions: ${testMetadata.assertions.length}

Provide JSON response with:
{
  "complexity": "simple|moderate|complex",
  "recommendations": ["recommendation1", "recommendation2"],
  "riskAreas": ["risk1", "risk2"]
}`;

      const response = await this.callGrokAPI(prompt);
      const analysis = JSON.parse(response.content);

      logger.info('Test complexity analyzed', {
        testId: testMetadata.id,
        complexity: analysis.complexity,
      });

      return analysis;
    } catch (error) {
      logger.warn('Complexity analysis failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        complexity: 'moderate',
        recommendations: [],
        riskAreas: [],
      };
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Build prompt for metadata enhancement
   */
  private buildEnhancementPrompt(
    userDescription: string,
    metadata: TestMetadata
  ): string {
    return `You are a test automation expert. Enhance this test case:

Test Name: ${metadata.name}
User Description: ${userDescription}
Current Steps: ${metadata.steps.length}

Current steps:
${metadata.steps
  .map(
    (s) =>
      `- ${s.description} (action: ${s.action}, value: ${s.value || 'none'})`
  )
  .join('\n')}

Current assertions:
${metadata.assertions.map((a) => `- ${a.description} (matcher: ${a.matcher})`).join('\n')}

Provide a JSON response with:
{
  "improvedDescription": "Better test description",
  "additionalSteps": [
    {"description": "step desc", "action": "navigate|fill|click|select|wait", "value": "value if needed"}
  ],
  "improvedAssertions": [
    {"description": "assertion desc", "matcher": "visible|enabled|exists|contains|equals|hasText|hasAttribute"}
  ],
  "testDataSuggestions": {"key": "value"},
  "preconditions": "Any preconditions needed",
  "tags": ["tag1", "tag2"]
}`;
  }

  /**
   * Build prompt for assertion optimization
   */
  private buildAssertionPrompt(
    assertions: Assertion[],
    pageUrl: string,
    pageContent?: string
  ): string {
    return `You are a test automation expert. Optimize these test assertions for ${pageUrl}:

Assertions:
${assertions.map((a) => `- ${a.description} (matcher: ${a.matcher})`).join('\n')}

${pageContent ? `Page content preview:\n${pageContent.substring(0, 500)}\n...` : ''}

Provide JSON with selector suggestions:
{
  "assertions": [
    {"originalDescription": "desc", "selector": "CSS/XPath", "confidence": 0.9, "matcher": "visible|hasText|etc"}
  ]
}`;
  }

  /**
   * Build prompt for step enrichment
   */
  private buildStepEnrichmentPrompt(steps: Step[], pageUrl: string): string {
    return `Enrich these test steps for ${pageUrl}:

${steps
  .map(
    (s, i) =>
      `Step ${i + 1}: ${s.description}\nAction: ${s.action}\nValue: ${s.value || 'none'}`
  )
  .join('\n\n')}

Provide JSON:
{
  "enrichedSteps": [
    {
      "index": 0,
      "enhancedDescription": "More detailed description",
      "suggestedTestData": "if needed",
      "waitConditions": "what to wait for",
      "errorHandler": "how to handle errors"
    }
  ]
}`;
  }

  /**
   * Build prompt for locator suggestions
   */
  private buildLocatorSuggestionPrompt(
    elementDescription: string,
    pageUrl: string,
    action: string,
    pageHtml?: string
  ): string {
    return `Find element selectors for testing ${pageUrl}:

Element: ${elementDescription}
Action: ${action}
${pageHtml ? `Page HTML sample:\n${pageHtml.substring(0, 300)}` : ''}

Suggest best CSS/XPath selectors in priority order.

Provide JSON:
{
  "selectors": [
    {"selector": "CSS or XPath", "type": "css|xpath", "confidence": 0.95},
    {"selector": "...", "type": "css|xpath", "confidence": 0.8}
  ],
  "playwright": ["getByTestId(...)", "getByRole(...)", "getByLabel(...)"]
}`;
  }

  /**
   * Call Grok API
   */
  private async callGrokAPI(prompt: string): Promise<GrokResponse> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert test automation engineer specializing in Playwright and test generation. Provide JSON responses when requested.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const content =
        response.data.choices?.[0]?.message?.content || '';
      const tokens = response.data.usage?.total_tokens || 0;

      return {
        content,
        tokens,
        model: this.config.model,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Grok API call failed', errorMessage, {
        model: this.config.model,
      });
      throw error;
    }
  }

  /**
   * Parse enhanced metadata from LLM response
   */
  private parseEnhancedMetadata(
    content: string,
    original: TestMetadata
  ): TestMetadata {
    try {
      const data = JSON.parse(content);

      // Add new steps suggested by LLM
      const newSteps = (data.additionalSteps || []).map((step: any) => ({
        id: require('uuid').v4(),
        description: step.description,
        action: step.action,
        target: step.target || '',
        value: step.value,
        timeout: 5000,
        retryable: true,
      }));

      // Merge assertions
      const newAssertions = (data.improvedAssertions || []).map(
        (assertion: any) => ({
          id: require('uuid').v4(),
          description: assertion.description,
          matcher: assertion.matcher,
          actual: '',
          expected: assertion.expected || assertion.description,
        })
      );

      return {
        ...original,
        description: data.improvedDescription || original.description,
        steps: [...original.steps, ...newSteps],
        assertions: [...original.assertions, ...newAssertions],
        testData: {
          ...original.testData,
          ...(data.testDataSuggestions || {}),
        },
        tags: [...new Set([...(original.tags || []), ...(data.tags || [])])],
        preconditions: data.preconditions || original.preconditions,
      };
    } catch (error) {
      logger.warn('Failed to parse enhanced metadata', {
        error: error instanceof Error ? error.message : String(error),
      });
      return original;
    }
  }

  /**
   * Parse assertion optimization response
   */
  private parseAssertionResponse(
    content: string,
    original: Assertion[]
  ): Assertion[] {
    try {
      const data = JSON.parse(content);
      const assertionMap = new Map(
        (data.assertions || []).map((a: any) => [a.originalDescription, a])
      );

      return original.map((assertion) => {
        const optimized = assertionMap.get(assertion.description) as any;
        if (optimized) {
          return {
            ...assertion,
            actual: (optimized.selector as string) || assertion.actual,
            matcher: (optimized.matcher as MatcherType) || assertion.matcher,
          };
        }
        return assertion;
      });
    } catch (error) {
      logger.warn('Failed to parse assertion response', {
        error: error instanceof Error ? error.message : String(error),
      });
      return original;
    }
  }

  /**
   * Parse enriched steps response
   */
  private parseEnrichedSteps(content: string, original: Step[]): Step[] {
    try {
      const data = JSON.parse(content);
      const enrichmentMap = new Map(
        (data.enrichedSteps || []).map((s: any) => [s.index, s])
      );

      return original.map((step, index) => {
        const enrichment = enrichmentMap.get(index) as any;
        if (enrichment) {
          return {
            ...step,
            description: (enrichment.enhancedDescription as string) || step.description,
            value: (enrichment.suggestedTestData as string) || step.value,
          };
        }
        return step;
      });
    } catch (error) {
      logger.warn('Failed to parse enriched steps', {
        error: error instanceof Error ? error.message : String(error),
      });
      return original;
    }
  }

  /**
   * Parse locator suggestions response
   */
  private parseLocatorSuggestions(content: string): string[] {
    try {
      const data = JSON.parse(content);

      // Combine CSS/XPath and Playwright selectors
      const cssXpath = (data.selectors || [])
        .filter((s: any) => s.confidence > 0.7)
        .map((s: any) => s.selector);

      const playwrightSelectors = (data.playwright || []).filter(
        (s: any) => s && s.length > 0
      );

      return [...cssXpath, ...playwrightSelectors];
    } catch (error) {
      logger.warn('Failed to parse locator suggestions', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}

export default GrokLLMService;
