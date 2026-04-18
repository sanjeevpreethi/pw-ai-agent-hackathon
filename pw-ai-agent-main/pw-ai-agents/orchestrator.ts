import { MCPClient } from "./helpers/mcp-client";
import {
  analyzePage,
  generatePlaywrightTest,
  evaluateNextAction,
  ActionStep,
  LLMAnalysisResult,
} from "./helpers/llm";

interface ExecutionState {
  userInput: string;
  url?: string;
  currentActionIndex: number;
  actions: ActionStep[];
  executedActions: ActionStep[];
  retryCount: number;
  maxRetries: number;
}

interface ExecutionResult {
  success: boolean;
  summary: string;
  executedSteps: Array<{
    step: number;
    action: ActionStep;
    result: string;
    duration: number;
  }>;
  testCode: string;
  errors?: string[];
}

class UIAutomationOrchestrator {
  private mcpClient: MCPClient;
  private state: ExecutionState | null = null;
  private executionLog: ExecutionResult["executedSteps"] = [];
  private errors: string[] = [];

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
  }

  async executeUserRequest(
    userInput: string,
    url?: string,
    testName: string = "GeneratedTest"
  ): Promise<ExecutionResult> {
    console.log("\n=== Starting UI Automation Execution ===");
    console.log(`User Input: ${userInput}`);
    if (url) console.log(`Target URL: ${url}`);

    this.executionLog = [];
    this.errors = [];

    try {
      // Step 1: Initialize browser and navigate
      console.log("\n[1] Initializing browser session...");
      await this.mcpClient.initializePageForTesting(url);

      if (url) {
        console.log(`[2] Navigating to ${url}...`);
        await this.mcpClient.navigateTo(url);
        await this.mcpClient.waitFor(undefined, 3000); // Wait for page load
      }

      // Step 2: Capture initial accessibility snapshot
      console.log("[3] Capturing accessibility snapshot...");
      const snapshot = await this.mcpClient.captureSnapshot();
      console.log(`Snapshot captured (length: ${snapshot.length})`);

      // Step 3: Analyze page with LLM
      console.log("[4] Analyzing page with LLM...");
      const analysis = await analyzePage(userInput, snapshot);

      console.log(`\nLLM Analysis:`);
      console.log(`Intent: ${analysis.intent}`);
      console.log(`Reasoning: ${analysis.reasoning}`);
      console.log(`Actions to execute: ${analysis.actions.length}`);

      // Initialize state
      this.state = {
        userInput,
        url,
        currentActionIndex: 0,
        actions: analysis.actions,
        executedActions: [],
        retryCount: 0,
        maxRetries: 3,
      };

      // Step 4: Execute actions in loop
      await this.executeActionLoop();

      // Step 5: Generate test code
      console.log("\n[5] Generating Playwright test code...");
      const testCode = await generatePlaywrightTest(
        userInput,
        this.state.executedActions,
        testName
      );

      return {
        success: true,
        summary: `Successfully completed ${this.state.executedActions.length} actions`,
        executedSteps: this.executionLog,
        testCode,
        errors: this.errors.length > 0 ? this.errors : undefined,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Execution failed: ${errorMsg}`);
      this.errors.push(errorMsg);

      return {
        success: false,
        summary: `Execution failed: ${errorMsg}`,
        executedSteps: this.executionLog,
        testCode: "",
        errors: this.errors,
      };
    }
  }

  private async executeActionLoop(): Promise<void> {
    if (!this.state) throw new Error("State not initialized");

    while (this.state.currentActionIndex < this.state.actions.length) {
      const action = this.state.actions[this.state.currentActionIndex];
      const stepNumber = this.state.currentActionIndex + 1;

      console.log(`\n--- Action ${stepNumber}/${this.state.actions.length} ---`);
      console.log(`Action: ${action.action}`);
      console.log(`Selector: ${action.selector}`);
      console.log(`Strategy: ${action.selectorStrategy}`);
      if (action.value) console.log(`Value: ${action.value}`);

      const startTime = Date.now();

      try {
        await this.executeAction(action);
        const duration = Date.now() - startTime;

        // Capture new snapshot
        console.log("Capturing updated accessibility snapshot...");
        const updatedSnapshot = await this.mcpClient.captureSnapshot();

        this.executionLog.push({
          step: stepNumber,
          action,
          result: "Success",
          duration,
        });

        this.state.executedActions.push(action);
        this.state.currentActionIndex++;
        this.state.retryCount = 0; // Reset retry count on success

        console.log(`✓ Action completed in ${duration}ms`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`✗ Action failed: ${errorMsg}`);

        if (this.state.retryCount < this.state.maxRetries) {
          console.log(`Retrying (${this.state.retryCount + 1}/${this.state.maxRetries})...`);

          // Re-capture snapshot for re-evaluation
          const currentSnapshot = await this.mcpClient.captureSnapshot();

          // Let LLM evaluate and suggest alternative
          const evaluation = await evaluateNextAction(
            currentSnapshot,
            action,
            errorMsg,
            this.state.actions.slice(this.state.currentActionIndex + 1)
          );

          if (evaluation.shouldRetry && evaluation.updatedSelector) {
            console.log(`\nSuggestion: ${evaluation.reason}`);
            console.log(`New selector: ${evaluation.updatedSelector}`);
            console.log(`New strategy: ${evaluation.strategy}`);

            // Update action with new selector
            this.state.actions[this.state.currentActionIndex].selector =
              evaluation.updatedSelector;
            this.state.actions[this.state.currentActionIndex].selectorStrategy =
              evaluation.strategy as any;
            this.state.retryCount++;

            // Retry this action
            continue;
          } else {
            throw new Error(
              `Action failed and no retry strategy available: ${evaluation.reason}`
            );
          }
        } else {
          throw new Error(
            `Action failed after ${this.state.maxRetries} retries: ${errorMsg}`
          );
        }
      }
    }
  }

  private async executeAction(action: ActionStep): Promise<void> {
    const selector = action.selector;

    switch (action.action.toLowerCase()) {
      case "click":
        console.log(`Executing click on selector: ${selector}`);
        await this.mcpClient.click(selector);
        break;

      case "type":
        if (!action.value) throw new Error("Type action requires a value");
        console.log(`Typing "${action.value}" into selector: ${selector}`);
        await this.mcpClient.type(selector, action.value);
        break;

      case "select":
        if (!action.value) throw new Error("Select action requires a value");
        console.log(`Selecting "${action.value}" in selector: ${selector}`);
        await this.mcpClient.selectOption(selector, action.value);
        break;

      case "wait":
        const timeout = action.value ? parseInt(action.value, 10) : 3000;
        console.log(`Waiting ${timeout}ms for selector: ${selector}`);
        await this.mcpClient.waitFor(selector, timeout);
        break;

      case "validate":
        console.log(`Validating presence of: ${selector}`);
        await this.mcpClient.waitFor(selector, 5000);
        break;

      case "presskey":
        console.log(`Pressing key: ${action.value}`);
        await this.mcpClient.pressKey(action.value || "Enter");
        break;

      case "screenshot":
        console.log("Taking screenshot");
        await this.mcpClient.takeScreenshot();
        break;

      default:
        throw new Error(`Unknown action: ${action.action}`);
    }
  }
}

export async function runAutomation(
  userInput: string,
  url?: string,
  mcpServerPath: string = "./dist/index.js"
): Promise<ExecutionResult> {
  const mcpClient = new MCPClient();

  try {
    console.log("Connecting to MCP server...");
    await mcpClient.connect(mcpServerPath);

    const orchestrator = new UIAutomationOrchestrator(mcpClient);
    const result = await orchestrator.executeUserRequest(
      userInput,
      url,
      "AutomatedTest"
    );

    return result;
  } finally {
    await mcpClient.disconnect();
  }
}

// Export for CLI usage
if (process.argv.length > 2) {
  const userInput = process.argv[2];
  const url = process.argv[3];

  runAutomation(userInput, url)
    .then((result) => {
      console.log("\n=== Execution Complete ===");
      console.log(JSON.stringify(result, null, 2));

      if (result.testCode) {
        console.log("\n=== Generated Playwright Test ===");
        console.log(result.testCode);
      }

      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
