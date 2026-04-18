# MCP-Based Test Generation Integration Guide

## Overview

This guide explains how to use the new MCP-integrated test generation system to create resilient, accessibility-first Playwright tests.

---

## What Changed

### Before (Brittle, No MCP)
```javascript
// ❌ Static generation with data-testid
[data-testid='username']
[data-testid='password']
[data-testid='login-btn']
```

### After (Resilient, MCP-Based)
```javascript
// ✅ Dynamic generation with accessibility-first
getByLabel('Email')           // Falls back to getByPlaceholder('Email')
getByLabel('Password')        // Falls back to getByPlaceholder('Password')
getByRole('button', { name: 'Login' })
```

---

## Architecture

```
curl POST /api/v1/scripts/generate
    ↓
    + testMetadata (steps, assertions)
    ↓
┌──────────────────────────────────────┐
│ Backend Handler                      │
│ (script-generation-handler.ts)       │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ TestScriptGenerator                  │
│ (test-generator.ts)                  │
│                                      │
│ • Parse metadata                     │
│ • Build user intent                  │
│ • Initialize automation              │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ BrowserAutomationAgent               │
│ (automation-agent.ts)                │
│                                      │
│ • Launch browser                     │
│ • Navigate to page                   │
│ • Capture accessibility tree         │
│ • Analyze with Claude via MCP        │
│ • Generate accessible locators       │
│ • Execute test steps                 │
│ • Capture results                    │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ Generated Artifacts                  │
│                                      │
│ • TC_001.spec.ts (test code)        │
│ • TC_001-accessibility.txt          │
│ • TC_001-execution.json             │
│ • TC_001-locators.json              │
└──────────────────────────────────────┘
```

---

## Quick Start

### 1. API Request Format

```bash
curl --location 'http://localhost:3000/api/v1/scripts/generate' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer your-auth-token' \
--data '{
  "testMetadata": {
    "id": "TC_001",
    "name": "User Login",
    "description": "Test user login functionality",
    "steps": [
      {
        "stepNumber": 1,
        "action": "Navigate",
        "target": "https://example.com/login",
        "value": ""
      },
      {
        "stepNumber": 2,
        "action": "Fill",
        "target": "[placeholder=\"Email\"]",
        "value": "user@example.com"
      },
      {
        "stepNumber": 3,
        "action": "Fill",
        "target": "[placeholder=\"Password\"]",
        "value": "password123"
      },
      {
        "stepNumber": 4,
        "action": "Click",
        "target": "Login Button",
        "value": ""
      }
    ],
    "assertions": [
      {
        "type": "url",
        "matcher": "contains",
        "expected": "dashboard"
      },
      {
        "type": "text",
        "matcher": "contains",
        "expected": "Welcome"
      }
    ]
  }
}'
```

### 2. Expected Response

```json
{
  "success": true,
  "testCode": "import { test, expect } from '@playwright/test';\n\ntest.describe('User Login', () => {\n  test('should Test user login functionality', async ({ page }) => {\n    // Generated with MCP-based Automation Agent\n    // Accessibility-first locators • Dynamic selector strategy\n    \n    // Locator Mapping (Accessibility-First)\n    // Step 2: Accessibility-based input locator for email field\n    // Old locator: [placeholder=\"Email\"]\n    // New locator: getByLabel('Email')\n    // Strategy: label-based\n    \n    await page.goto('https://example.com/login', { waitUntil: 'networkidle' });\n    \n    try {\n      await page.getByLabel('Email').fill('user@example.com');\n    } catch {\n      try {\n        await page.getByPlaceholder('Email').fill('user@example.com');\n      } catch {\n        await page.locator('input[type=\"email\"]').fill('user@example.com');\n      }\n    }\n    ...\n  });\n});",
  "accessibilitySnapshot": "[form]\\n  [input] placeholder=\"Email\"\\n  [input] placeholder=\"Password\"\\n  [button] (Login)\\n",
  "executionLog": [
    {
      "step": 1,
      "action": "navigate",
      "duration": 2345,
      "result": "Success"
    },
    {
      "step": 2,
      "action": "fill",
      "duration": 156,
      "result": "Success"
    }
  ],
  "locators": [
    {
      "step": 2,
      "oldLocator": "[placeholder=\"Email\"]",
      "newLocator": "getByLabel('Email')",
      "strategy": "label-based"
    },
    {
      "step": 3,
      "oldLocator": "[placeholder=\"Password\"]",
      "newLocator": "getByLabel('Password')",
      "strategy": "label-based"
    },
    {
      "step": 4,
      "oldLocator": "Login Button",
      "newLocator": "getByRole('button', { name: /login/i })",
      "strategy": "role-based"
    }
  ],
  "filePath": "tests/ui/TC_001.spec.ts"
}
```

---

## Supported Actions

| Action | Description | Example |
|--------|-------------|---------|
| `Navigate` | Go to URL | `{"action": "Navigate", "target": "https://example.com/login"}` |
| `Fill` | Type text in input | `{"action": "Fill", "target": "[placeholder=\"Email\"]", "value": "user@example.com"}` |
| `Click` | Click element | `{"action": "Click", "target": "Login Button"}` |
| `Select` | Choose dropdown option | `{"action": "Select", "target": "[aria-label=\"Role\"]", "value": "Admin"}` |
| `Wait` | Wait for element | `{"action": "Wait", "target": ".loading-spinner"}` |

---

## Supported Assertions

| Type | Matcher | Expected | Example |
|------|---------|----------|---------|
| `url` | `contains`, `equals` | URL pattern | `{"type": "url", "matcher": "contains", "expected": "dashboard"}` |
| `text` | `contains`, `equals` | Text content | `{"type": "text", "matcher": "contains", "expected": "Welcome"}` |
| `element` | `visible`, `exists` | Selector | `{"type": "element", "expected": "[aria-label=\"Profile\"]"}` |
| `title` | `contains`, `equals` | Page title | `{"type": "title", "expected": "Dashboard"}` |

---

## Locator Strategy Priorities

The system tries locators in this priority order:

### For Input Fields
```typescript
1. getByLabel('Email')              // <label> association
2. getByPlaceholder('Email')        // placeholder attribute
3. input[type="email"]              // semantic HTML type
4. getByRole('textbox', {...})      // ARIA role
5. CSS selector fallback            // Last resort
```

### For Buttons
```typescript
1. getByRole('button', { name: 'Login' })  // Primary
2. getByText('Login')                      // Text match
3. CSS selector fallback                   // Last resort
```

### For Links
```typescript
1. getByRole('link', { name: 'Home' })     // Primary
2. getByText('Home')                       // Text match
3. CSS selector fallback                   // Last resort
```

---

## Integration with Express Backend

### Setup (if not already done)

```typescript
// backend/routes/scripts.ts
import express from 'express';
import { generateScript, validateScriptRequest } from '../script-generation-handler';

const router = express.Router();

// Middleware: Validate request
router.post('/generate', validateScriptRequest);

// Handler: Generate script with MCP
router.post('/generate', generateScript);

export default router;
```

### Add to main app.ts

```typescript
import scriptRoutes from './backend/routes/scripts';

app.use('/api/v1/scripts', scriptRoutes);
```

---

## File Outputs

When a test is generated, these files are created:

### 1. `TC_001.spec.ts` (Test Code)
Contains the full Playwright test with:
- Accessibility-first locators
- Fallback strategies
- Strong assertions
- Comments explaining transformations

### 2. `TC_001-accessibility.txt` (Accessibility Snapshot)
Shows the DOM structure as the automation agent saw it:
```
[form]
  [label] "Email Address"
  [input] placeholder="Enter your email"
  [label] "Password"
  [input] placeholder="Enter your password"
  [button] "Sign In"
```

### 3. `TC_001-execution.json` (Execution Log)
Detailed timing and results for each step:
```json
[
  {
    "step": 1,
    "action": "navigate",
    "duration": 2345,
    "result": "Success"
  },
  {
    "step": 2,
    "action": "fill",
    "duration": 156,
    "result": "Success - Used getByLabel('Email')"
  }
]
```

### 4. `TC_001-locators.json` (Locator Mappings)
Shows transformation from input locator to accessibility-based:
```json
[
  {
    "step": 2,
    "oldLocator": "[data-testid='username']",
    "newLocator": "getByLabel('Email')",
    "strategy": "label-based"
  },
  {
    "step": 3,
    "oldLocator": "[data-testid='password']",
    "newLocator": "getByLabel('Password')",
    "strategy": "label-based"
  },
  {
    "step": 4,
    "oldLocator": "[data-testid='login-btn']",
    "newLocator": "getByRole('button', { name: /login/i })",
    "strategy": "role-based"
  }
]
```

---

## Best Practices

### 1. Use Semantic HTML
✅ **Good** - Proper labels and roles
```html
<label for="email">Email</label>
<input id="email" type="email" placeholder="Enter email">
```

❌ **Bad** - Missing semantics
```html
<div class="email-container">
  <input placeholder="Enter email" data-testid="email-field">
</div>
```

### 2. Provide Context in Steps
✅ **Good** - Clear action descriptions
```json
{
  "action": "Click",
  "target": "Login Button"
}
```

❌ **Bad** - Vague selectors
```json
{
  "action": "Click",
  "target": "button.btn"
}
```

### 3. Assert on Outcomes
✅ **Good** - Specific, multiple assertions
```json
[
  {"type": "url", "matcher": "contains", "expected": "dashboard"},
  {"type": "element", "expected": "[aria-label=\"Profile Menu\"]"},
  {"type": "text", "matcher": "contains", "expected": "Welcome Back"}
]
```

❌ **Bad** - Vague assertions
```json
[
  {"type": "text", "matcher": "contains", "expected": "Welcome"}
]
```

### 4. Use Descriptive Step Targets
✅ **Good**
```
"target": "Email Input"
"target": "Password Input"
"target": "Login Button"
"target": "Dashboard Heading"
```

❌ **Bad**
```
"target": "input:first"
"target": "[data-qa='pwd']"
"target": "button"
"target": "h1"
```

---

## Troubleshooting

### Issue: "Locator not found in DOM"

**Cause**: The system couldn't find the element even with fallback strategies.

**Solution**:
1. Verify the URL is accessible
2. Check if the element exists in the page
3. Update the target description to be more specific
4. Check the accessibility snapshot file for actual DOM structure

### Issue: "MCP connection failed"

**Cause**: Browser automation agent couldn't connect to MCP server.

**Solution**:
1. Verify MCP server is running: `npm run dev` in MCP folder
2. Check `helpers/mcp-client.ts` connection configuration
3. Ensure Playwright is properly installed

### Issue: "Claude analysis timeout"

**Cause**: LLM took too long to analyze the page.

**Solution**:
1. Reduce page complexity (fewer elements to analyze)
2. Increase timeout in `automation-agent.ts`
3. Check Anthropic API rate limits

---

## Example: Form Filling Test

### Request
```json
{
  "testMetadata": {
    "id": "TC_002",
    "name": "User Registration",
    "description": "Fill and submit registration form",
    "steps": [
      {
        "stepNumber": 1,
        "action": "Navigate",
        "target": "https://example.com/register",
        "value": ""
      },
      {
        "stepNumber": 2,
        "action": "Fill",
        "target": "First Name Input",
        "value": "John"
      },
      {
        "stepNumber": 3,
        "action": "Fill",
        "target": "Last Name Input",
        "value": "Doe"
      },
      {
        "stepNumber": 4,
        "action": "Select",
        "target": "Country Dropdown",
        "value": "United States"
      },
      {
        "stepNumber": 5,
        "action": "Click",
        "target": "Submit Button",
        "value": ""
      }
    ],
    "assertions": [
      {
        "type": "url",
        "matcher": "contains",
        "expected": "confirmation"
      },
      {
        "type": "text",
        "matcher": "contains",
        "expected": "Registration Successful"
      }
    ]
  }
}
```

### Generated Test
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('should Fill and submit registration form', async ({ page }) => {
    // Generated with MCP-based Automation Agent
    // Accessibility-first locators • Dynamic selector strategy
    
    await page.goto('https://example.com/register', { waitUntil: 'networkidle' });
    
    // First Name
    try {
      await page.getByLabel('First Name').fill('John');
    } catch {
      await page.getByPlaceholder('First Name').fill('John');
    }
    
    // Last Name
    try {
      await page.getByLabel('Last Name').fill('Doe');
    } catch {
      await page.getByPlaceholder('Last Name').fill('Doe');
    }
    
    // Country Selection
    await page.getByLabel('Country').selectOption('United States');
    
    // Submit
    await page.getByRole('button', { name: /submit|register/i }).click();
    
    // Wait and verify
    await page.waitForURL(/.*confirmation.*/);
    await expect(page.getByText('Registration Successful')).toBeVisible();
  });
});
```

---

## Performance Metrics

When you receive the execution log, you can track performance:

```json
{
  "executionLog": [
    {
      "step": 1,
      "action": "navigate",
      "duration": 2345,
      "result": "Success"
    },
    {
      "step": 2,
      "action": "fill",
      "duration": 156,
      "result": "Success"
    },
    {
      "step": 3,
      "action": "fill",
      "duration": 89,
      "result": "Success"
    },
    {
      "step": 4,
      "action": "click",
      "duration": 234,
      "result": "Success"
    }
  ]
}
```

**Total execution time**: 2,824 ms

---

## Related Documentation

- [TEST_GENERATION_ANALYSIS.md](./TEST_GENERATION_ANALYSIS.md) - Detailed comparison
- [AUTOMATION_GUIDE.md](./AUTOMATION_GUIDE.md) - Automation API reference
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Architecture overview
- [automation-agent.ts](./automation-agent.ts) - Core implementation
- [backend/script-generation-handler.ts](./backend/script-generation-handler.ts) - API handler

---

## Summary

The MCP-based test generation system provides:

✅ **Accessibility-First Locators** - Using semantic HTML and ARIA roles  
✅ **Dynamic Selector Strategy** - Multiple fallback strategies  
✅ **Intelligent Analysis** - Claude AI analyzes the page structure  
✅ **Complete Logging** - Detailed execution metrics  
✅ **Artifact Generation** - Test code + snapshots + mappings  

**Result**: Tests that are resilient, maintainable, and truly represent user interactions.
