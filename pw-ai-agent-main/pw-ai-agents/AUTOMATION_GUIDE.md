# UI Automation Orchestration System

This system automates UI testing through intelligent browser automation and LLM-driven decision making.

## Architecture

### Components

1. **BrowserAutomationAgent** (`automation-agent.ts`)
   - Main orchestrator for automation
   - Manages browser lifecycle
   - Coordinates LLM analysis and execution

2. **LLM Integration** (`helpers/llm.ts`)
   - Claude 3.5 Sonnet for intelligent analysis
   - Page analysis and action planning
   - Dynamic selector evaluation
   - Test code generation

3. **MCP Client** (`helpers/mcp-client.ts`)
   - Communicates with MCP server
   - Provides browser automation tools

## Workflow

```
User Input
    ↓
Initialize Browser
    ↓
Navigate to URL (if provided)
    ↓
Capture Accessibility Tree
    ↓
Send to LLM for Analysis
    ↓
Execute Action Loop:
  1. Get next action from LLM
  2. Try to execute with current selector
  3. If fails, LLM suggests alternative
  4. Retry or move to next action
  5. Capture updated snapshot
    ↓
Generate Playwright Test Code
    ↓
Save Results & Logs
```

## Usage

### Quick Start

```bash
cd pw-ai-agents

# Install dependencies
npm install

# Run automation
npx tsx automation-agent.ts "Login to application" "https://example.com/login"
```

### Parameters

- **arg1**: User intent/goal (e.g., "Login to the application")
- **arg2**: Target URL (optional)

### Output

The agent generates:
- `generated-test.ts` - Playwright test code
- `execution-log.json` - Detailed execution log with timings

## Example Usage

### Example 1: Form Submission

```bash
npx tsx automation-agent.ts \
  "Fill in the contact form with name 'John Doe', email 'john@example.com', and submit" \
  "https://example.com/contact"
```

### Example 2: Search and Click

```bash
npx tsx automation-agent.ts \
  "Search for 'automation testing' and click the first result" \
  "https://google.com"
```

### Example 3: Multi-step Navigation

```bash
npx tsx automation-agent.ts \
  "Click on 'Products', select 'Electronics', then sort by price ascending" \
  "https://ecommerce.example.com"
```

## Key Features

### 1. Accessibility-First Selectors
- Uses role-based selectors
- Prefers semantic HTML
- Fallback to text and placeholder selectors

### 2. Intelligent Retry Logic
- Automatically re-evaluates selectors on failure
- LLM suggests alternatives
- Max 3 retries per action

### 3. Dynamic Waits
- Waits for network idle on page load
- Waits for element visibility before interaction
- No hardcoded sleep calls

### 4. Automatic Test Generation
- Generates clean Playwright code
- Uses `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`
- Includes assertions
- Professional formatting

## Execution Output Example

```
╔════════════════════════════════════════╗
║   UI Automation Orchestration Started   ║
╚════════════════════════════════════════╝

🚀 Initializing browser...
✓ Browser initialized

📍 Navigating to: https://example.com/login
✓ Page loaded

📸 Capturing page accessibility snapshot...
✓ Captured 45 lines of accessibility data

🤖 Sending to LLM for analysis...

📋 Analysis Results:
   Intent: Fill in login form and submit
   Actions identified: 3
   Reasoning: The page has email and password inputs...

🔄 Executing automation loop...

   Step 1/3: type
   └─ Selector: input[placeholder="Email"]
   └─ Value: user@example.com
   ✓ Completed in 245ms

   Step 2/3: type
   └─ Selector: input[placeholder="Password"]
   └─ Value: ••••••••
   ✓ Completed in 198ms

   Step 3/3: click
   └─ Selector: button[name="Login"]
   ✓ Completed in 512ms

📝 Generating Playwright test code...

╔════════════════════════════════════════╗
║   ✓ Automation Completed Successfully  ║
╚════════════════════════════════════════╝

📊 Execution Summary:
   Total steps: 3
   Total time: 955ms

💾 Test code saved to: generated-test.ts
💾 Execution log saved to: execution-log.json
```

## Generated Test Example

```typescript
import { test, expect } from '@playwright/test';

test('Fill in the login form and submit', async ({ page }) => {
  // Navigate to login page
  await page.goto('https://example.com/login');
  
  // Fill in email field
  await page.locator('input[placeholder="Email"]').fill('user@example.com');
  
  // Fill in password field
  await page.locator('input[placeholder="Password"]').fill('password123');
  
  // Click login button
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Verify login success
  await expect(page.locator('.welcome-message')).toBeVisible();
});
```

## Execution Log Format

```json
[
  {
    "step": 1,
    "action": {
      "action": "type",
      "selector": "input[placeholder='Email']",
      "value": "user@example.com",
      "expectedOutcome": "Email should be filled in"
    },
    "result": "Success",
    "duration": 245,
    "timestamp": "2026-04-18T10:30:45.123Z"
  }
]
```

## Selector Strategies

The system tries selectors in this order:

1. **CSS Selectors**: `input[placeholder="Email"]`, `button[name="Submit"]`
2. **Role Selectors**: `role=button name="Submit"`
3. **Text Selectors**: `text=Submit`
4. **Aria Labels**: `aria-label=Close Button`

## Error Handling

### Common Issues

| Error | Resolution |
|-------|-----------|
| Selector not found | LLM suggests alternative selector |
| Element not clickable | Wait for element visibility |
| Page not loaded | Increased wait for network idle |
| Stale element | Re-evaluate in updated snapshot |

## Configuration

### Environment Variables

```bash
# Claude API Key (required)
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional: Browser headless mode (default: false)
export HEADLESS="true"

# Optional: Max retries per action (default: 3)
export MAX_RETRIES="5"
```

## Integration with Existing Tests

The generated test code can be integrated into existing Playwright test suites:

```typescript
// tests/ui/generated-test.ts
import { test, expect } from '@playwright/test';

test('Generated automation test', async ({ page }) => {
  // ... generated code ...
});
```

Run with existing test suite:
```bash
npm run test:ui
```

## Limitations & Constraints

1. **JavaScript Heavy Sites**: May struggle with heavy client-side rendering
2. **Complex Interactions**: Multi-step interactions might need manual refinement
3. **Dynamic Content**: Rapidly changing content might require custom waits
4. **Rate Limiting**: API rate limits from Claude may apply

## Troubleshooting

### Browser Won't Launch
```bash
# Ensure Playwright browsers are installed
npx playwright install chromium
```

### LLM Response Format Error
```bash
# Check ANTHROPIC_API_KEY is set
export ANTHROPIC_API_KEY="your-key"
```

### Selector Not Found
The agent will automatically retry with different selector strategies. Check execution logs for details.

### Test Code Won't Run
Ensure all required locators exist in the generated test. Manual adjustments may be needed for complex scenarios.

## Next Steps

1. Run automation for your use case
2. Review generated test code
3. Add to test suite
4. Enhance with additional assertions
5. Run in CI/CD pipeline

## Support

For issues or questions, check the execution logs and adjust the user input for better results.
