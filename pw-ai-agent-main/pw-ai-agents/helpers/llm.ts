import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface AccessibilityNode {
  role: string;
  name?: string;
  label?: string;
  placeholder?: string;
  text?: string;
  children?: AccessibilityNode[];
}

export interface LLMAnalysisResult {
  intent: string;
  actions: ActionStep[];
  reasoning: string;
}

export interface ActionStep {
  action: string;
  selector: string;
  selectorStrategy: "role" | "label" | "text" | "placeholder" | "custom";
  value?: string;
  expectedOutcome: string;
}

export async function analyzePage(
  userInput: string,
  accessibilityTree: string
): Promise<LLMAnalysisResult> {
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are an expert automation engineer. Analyze the following user request and accessibility tree to determine the required actions.

User Request: ${userInput}

Current Page Accessibility Tree:
${accessibilityTree}

Respond in JSON format with:
{
  "intent": "What the user wants to accomplish",
  "reasoning": "Your analysis of the accessibility tree and required steps",
  "actions": [
    {
      "action": "click|type|select|wait|validate",
      "selector": "The accessibility-based selector (role/name/label/text/placeholder)",
      "selectorStrategy": "role|label|text|placeholder|custom",
      "value": "Optional value for type/select actions",
      "expectedOutcome": "What should happen after this action"
    }
  ]
}

Rules:
- Use accessibility-first locators (role, name, label, placeholder, text)
- Avoid XPath unless absolutely necessary
- Be specific with selectors
- Include all necessary steps to accomplish the goal
- If validation is needed, include validate actions`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from LLM");
  }

  // Parse JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from LLM response");
  }

  return JSON.parse(jsonMatch[0]);
}

export async function generatePlaywrightTest(
  userRequest: string,
  executedActions: ActionStep[],
  testName: string
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `Generate a clean, maintainable Playwright test based on the following execution.

Test Name: ${testName}
User Request: ${userRequest}

Executed Actions:
${JSON.stringify(executedActions, null, 2)}

Generate TypeScript Playwright test code that:
1. Uses accessibility-based locators (getByRole, getByLabel, getByText, getByPlaceholder)
2. Includes proper assertions
3. Has meaningful comments
4. Is maintainable and follows best practices
5. Handles dynamic waits intelligently

Return only the valid TypeScript code without markdown formatting.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from LLM");
  }

  return content.text;
}

export async function evaluateNextAction(
  currentAccessibilityTree: string,
  previousAction: ActionStep,
  actionResult: string,
  remainingActions: ActionStep[]
): Promise<{
  shouldRetry: boolean;
  updatedSelector?: string;
  strategy?: "role" | "label" | "text" | "placeholder" | "custom";
  reason: string;
}> {
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are analyzing the result of a browser automation action.

Previous Action:
${JSON.stringify(previousAction, null, 2)}

Action Result: ${actionResult}

Current Accessibility Tree:
${currentAccessibilityTree}

Determine if we should:
1. Proceed with the next action
2. Retry with a different selector/strategy

Respond in JSON format:
{
  "shouldRetry": boolean,
  "updatedSelector": "New selector if retrying, otherwise null",
  "strategy": "New strategy if retrying",
  "reason": "Explanation of decision"
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from LLM");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from LLM response");
  }

  return JSON.parse(jsonMatch[0]);
}
