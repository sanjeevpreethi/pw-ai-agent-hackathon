import { Browser, Page, chromium } from "playwright";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface AccessibilityElement {
  role: string;
  name?: string;
  label?: string;
  text?: string;
}

interface ActionStep {
  action: string;
  selector: string;
  value?: string;
  expectedOutcome: string;
}

interface ExecutionLog {
  step: number;
  action: ActionStep;
  result: string;
  duration: number;
  timestamp: string;
}

class BrowserAutomationAgent {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private client: Anthropic;
  private executionLog: ExecutionLog[] = [];
  private maxRetries = 3;
  private mcpClient: Client | null = null;

  constructor() {
    this.client = new Anthropic();
  }

  async initialize(): Promise<void> {
    console.log("🚀 Initializing browser via MCP...");

    // Initialize MCP client
    this.mcpClient = new Client(
      {
        name: "browser-automation-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    // Connect to MCP server
    const transport = new StdioClientTransport({
      command: "node",
      args: ["c:\\Users\\prathb\\Downloads\\pw-ai-agent-main\\MCP\\dist\\index.js"],
    });

    await this.mcpClient.connect(transport);
    console.log("✓ MCP client connected");

    // Initialize browser via MCP
    await this.mcpClient.request(
      { method: "tools/call", params: { name: "browserinitialize", arguments: {} } },
      { timeout: 10000 }
    );
    console.log("✓ Browser initialized via MCP");
  }

  async executeUserRequest(
    userInput: string,
    targetUrl?: string
  ): Promise<{ success: boolean; log: ExecutionLog[]; testCode: string }> {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║   UI Automation Orchestration Started   ║");
    console.log("╚════════════════════════════════════════╝\n");

    try {
      if (!this.page) throw new Error("Browser not initialized");

      // Navigate to URL if provided
      if (targetUrl) {
        console.log(`📍 Navigating to: ${targetUrl}`);
        await this.mcpClient!.request(
          {
            method: "tools/call",
            params: {
              name: "browsernavigate",
              arguments: { url: targetUrl }
            }
          },
          { timeout: 10000 }
        );
        console.log("✓ Page loaded via MCP");
      }

      // Get initial accessibility tree
      console.log("\n📸 Capturing page accessibility snapshot...");
      let axTree = await this.getAccessibilityTree();
      console.log(`✓ Captured ${axTree.split("\n").length} lines of accessibility data`);

      // Analyze with LLM
      console.log("\n🤖 Sending to LLM for analysis...");
      const analysis = await this.analyzePage(userInput, axTree);

      console.log("\n📋 Analysis Results:");
      console.log(`   Intent: ${analysis.intent}`);
      console.log(`   Actions identified: ${analysis.actions.length}`);
      console.log(`   Reasoning: ${analysis.reasoning}`);

      // Execute actions in loop
      console.log("\n🔄 Executing automation loop...");
      let currentActions = analysis.actions;
      let actionIndex = 0;
      let retryCount = 0;

      while (actionIndex < currentActions.length && retryCount < this.maxRetries * 3) {
        const action = currentActions[actionIndex];
        const stepNumber = actionIndex + 1;

        console.log(`\n   Step ${stepNumber}/${currentActions.length}: ${action.action}`);
        console.log(`   └─ Selector: ${action.selector}`);
        if (action.value) console.log(`   └─ Value: ${action.value}`);

        const startTime = Date.now();

        try {
          await this.executeAction(action);
          const duration = Date.now() - startTime;

          // Record success
          this.executionLog.push({
            step: stepNumber,
            action,
            result: "Success",
            duration,
            timestamp: new Date().toISOString(),
          });

          console.log(`   ✓ Completed in ${duration}ms`);

          // Capture updated snapshot
          await this.page.waitForTimeout(500); // Wait for potential re-renders
          axTree = await this.getAccessibilityTree();

          actionIndex++;
          retryCount = 0;
        } catch (error) {
          console.log(
            `   ✗ Failed: ${error instanceof Error ? error.message : String(error)}`
          );

          if (retryCount < this.maxRetries) {
            console.log(`   🔄 Evaluating alternative...\n`);
            retryCount++;

            // Re-evaluate with LLM
            const evaluation = await this.evaluateAndRetry(
              userInput,
              axTree,
              action,
              error instanceof Error ? error.message : String(error)
            );

            if (evaluation.updatedAction) {
              console.log(`   💡 Suggestion: ${evaluation.reason}`);
              console.log(`   └─ New selector: ${evaluation.updatedAction.selector}`);
              currentActions[actionIndex] = evaluation.updatedAction;
            } else {
              throw error;
            }
          } else {
            throw new Error(
              `Failed after ${this.maxRetries} retries: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      }

      // Generate test code
      console.log("\n📝 Generating Playwright test code...");
      const testCode = await this.generateTestCode(userInput, currentActions);

      console.log("\n╔════════════════════════════════════════╗");
      console.log("║   ✓ Automation Completed Successfully  ║");
      console.log("╚════════════════════════════════════════╝\n");

      return {
        success: true,
        log: this.executionLog,
        testCode,
      };
    } catch (error) {
      console.error(
        `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        success: false,
        log: this.executionLog,
        testCode: "",
      };
    }
  }

  private async getAccessibilityTree(): Promise<string> {
    if (!this.page) throw new Error("Page not available");

    const axTree = await this.page.evaluate(() => {
      const traverseNode = (node: Element, depth = 0): string => {
        const indent = "  ".repeat(depth);
        const role = node.getAttribute("role") || "div";
        const ariaLabel = node.getAttribute("aria-label") || "";
        const ariaLabelledBy = node.getAttribute("aria-labelledby") || "";
        const placeholder = node.getAttribute("placeholder") || "";
        const name = (node as HTMLElement).innerText?.substring(0, 50) || "";

        let descriptor = `${indent}[${role}]`;
        if (ariaLabel) descriptor += ` (${ariaLabel})`;
        if (placeholder) descriptor += ` placeholder="${placeholder}"`;
        if (name && !ariaLabel) descriptor += ` "${name}"`;

        let result = descriptor + "\n";

        // Only traverse first 3 levels and first 10 children to keep it manageable
        if (depth < 3) {
          const children = Array.from(node.children).slice(0, 10);
          for (const child of children) {
            result += traverseNode(child, depth + 1);
          }
        }

        return result;
      };

      const bodyTree = traverseNode(document.body);
      const visibleText = document.body.innerText.substring(0, 1000);

      return `=== Page Accessibility Tree ===\n${bodyTree}\n\n=== Page Content ===\n${visibleText}`;
    });

    return axTree;
  }

  private async analyzePage(
    userInput: string,
    axTree: string
  ): Promise<{
    intent: string;
    actions: ActionStep[];
    reasoning: string;
  }> {
    const response = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are an expert test automation engineer. Analyze this user request and page structure.

User Request: "${userInput}"

Current Page Structure:
${axTree}

Respond in JSON format (ONLY JSON, no markdown):
{
  "intent": "What the user wants to accomplish",
  "reasoning": "Your step-by-step analysis",
  "actions": [
    {
      "action": "click|type|select|wait|validate|presskey",
      "selector": "CSS selector or role/text identifier",
      "value": "optional value for type/select",
      "expectedOutcome": "what should happen"
    }
  ]
}

Rules:
- Use CSS selectors like: button[name="Submit"], input[placeholder="Email"]
- Or use text selectors: text=Submit Button
- Or use role selectors: role=button name="Submit"
- Be specific and realistic
- Include all necessary steps`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from LLM");
    }

    try {
      return JSON.parse(content.text);
    } catch {
      // Try to extract JSON if there's markdown formatting
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse LLM response as JSON");
      return JSON.parse(jsonMatch[0]);
    }
  }

  private async evaluateAndRetry(
    userInput: string,
    currentAxTree: string,
    failedAction: ActionStep,
    errorMessage: string
  ): Promise<{
    updatedAction?: ActionStep;
    reason: string;
  }> {
    const response = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `An automation action failed. Provide an alternative selector.

Failed Action: ${JSON.stringify(failedAction)}
Error: ${errorMessage}

Current Page:
${currentAxTree}

User Goal: "${userInput}"

Respond in JSON (ONLY JSON):
{
  "reason": "Why the selector failed and what the alternative does",
  "updatedAction": {
    "action": "click|type|select|wait|validate|presskey",
    "selector": "new selector to try",
    "value": "optional value",
    "expectedOutcome": "what should happen"
  }
}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from LLM");
    }

    try {
      return JSON.parse(content.text);
    } catch {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { reason: "Could not parse response" };
      return JSON.parse(jsonMatch[0]);
    }
  }

  private async executeAction(action: ActionStep): Promise<void> {
    if (!this.mcpClient) throw new Error("MCP client not available");

    switch (action.action.toLowerCase()) {
      case "click":
        await this.mcpClient.request(
          {
            method: "tools/call",
            params: {
              name: "browserclick",
              arguments: { selector: action.selector }
            }
          },
          { timeout: 10000 }
        );
        break;

      case "type":
        if (!action.value) throw new Error("Type action requires a value");
        await this.mcpClient.request(
          {
            method: "tools/call",
            params: {
              name: "browsertype",
              arguments: {
                selector: action.selector,
                text: action.value,
                submit: false
              }
            }
          },
          { timeout: 10000 }
        );
        break;

      case "select":
        if (!action.value) throw new Error("Select action requires a value");
        // For select, we'll use a combination of click and type
        await this.mcpClient.request(
          {
            method: "tools/call",
            params: {
              name: "browserclick",
              arguments: { selector: action.selector }
            }
          },
          { timeout: 10000 }
        );
        await this.mcpClient.request(
          {
            method: "tools/call",
            params: {
              name: "browsertype",
              arguments: {
                selector: action.selector,
                text: action.value,
                submit: false
              }
            }
          },
          { timeout: 10000 }
        );
        break;

      case "wait":
        const timeout = action.value ? parseInt(action.value, 10) : 5000;
        await this.mcpClient.request(
          {
            method: "tools/call",
            params: {
              name: "browserwaitfor",
              arguments: {
                selector: action.selector,
                timeout: timeout
              }
            }
          },
          { timeout: timeout + 1000 }
        );
        break;

      case "validate":
        await this.mcpClient.request(
          {
            method: "tools/call",
            params: {
              name: "browserwaitfor",
              arguments: {
                selector: action.selector,
                timeout: 5000
              }
            }
          },
          { timeout: 6000 }
        );
        break;

      case "presskey":
        // For key presses, we'll use the keyboard functionality
        // This might need to be implemented in the MCP server
        console.log(`Key press action: ${action.value}`);
        break;

      default:
        throw new Error(`Unknown action: ${action.action}`);
    }
  }

  private async generateTestCode(
    userInput: string,
    actions: ActionStep[]
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `Generate a professional Playwright test based on these executed actions.

User Goal: "${userInput}"

Executed Actions:
${JSON.stringify(actions, null, 2)}

Generate ONLY valid TypeScript Playwright test code (no markdown, no explanation):
- Use locator strategies: getByRole, getByLabel, getByText, getByPlaceholder
- Include assertions
- Add comments
- Handle waits properly
- Make it maintainable

Start directly with: import { test, expect } from '@playwright/test';`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from LLM");
    }

    return content.text;
  }

  async cleanup(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }
}

// Main execution
(async () => {
  const agent = new BrowserAutomationAgent();

  try {
    await agent.initialize();

    // Example usage
    const userInput = process.argv[2] || "Fill in the login form with email and password";
    const targetUrl = process.argv[3] || "https://example.com";

    const result = await agent.executeUserRequest(userInput, targetUrl);

    if (result.success) {
      console.log("\n📊 Execution Summary:");
      console.log(`   Total steps: ${result.log.length}`);
      console.log(`   Total time: ${result.log.reduce((a, b) => a + b.duration, 0)}ms`);

      // Save test code
      const testFilePath = "generated-test.ts";
      fs.writeFileSync(testFilePath, result.testCode);
      console.log(`\n💾 Test code saved to: ${testFilePath}`);

      // Save execution log
      const logFilePath = "execution-log.json";
      fs.writeFileSync(logFilePath, JSON.stringify(result.log, null, 2));
      console.log(`💾 Execution log saved to: ${logFilePath}`);

      console.log("\n✨ Generated Playwright Test:");
      console.log("─".repeat(50));
      console.log(result.testCode);
    }
  } catch (error) {
    console.error("Fatal error:", error);
  } finally {
    await agent.cleanup();
  }
})();
