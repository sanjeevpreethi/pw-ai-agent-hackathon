# Direct cURL Commands for Leaftaps Test Generation

Copy and paste these commands directly into your terminal.

---

## 🔴 IMPORTANT: Prerequisites

1. **Backend API must be running:**
   ```bash
   cd backend
   npm start
   # Should output: "Server running on http://localhost:3000"
   ```

2. **You should be in the pw-ai-agents directory:**
   ```bash
   cd pw-ai-agent-main\pw-ai-agent-main\pw-ai-agents
   ```

---

## 📋 Direct cURL Command (Copy & Paste)

### For PowerShell (Windows):

```powershell
$body = @{
    testMetadata = @{
        id = "TC_002"
        name = "Leaftaps User Login"
        description = "Test user login functionality on leaftaps.com"
        steps = @(
            @{ stepNumber = 1; action = "Navigate"; target = "https://leaftaps.com/opentaps/control/main"; value = "" },
            @{ stepNumber = 2; action = "Fill"; target = "Username Input"; value = "demosalesmanager" },
            @{ stepNumber = 3; action = "Fill"; target = "Password Input"; value = "crmsfa" },
            @{ stepNumber = 4; action = "Click"; target = "Login Button"; value = "" }
        )
        assertions = @(
            @{ type = "url"; matcher = "contains"; expected = "main" },
            @{ type = "element"; matcher = "visible"; expected = "Logout Button" },
            @{ type = "text"; matcher = "contains"; expected = "Sales Manager" }
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:3000/api/v1/scripts/generate" `
  -Method POST `
  -Headers @{ 'Content-Type' = 'application/json' } `
  -Body $body | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### For Bash (Linux/Mac):

```bash
curl --location 'http://localhost:3000/api/v1/scripts/generate' \
  --header 'Content-Type: application/json' \
  --data '{
    "testMetadata": {
      "id": "TC_002",
      "name": "Leaftaps User Login",
      "description": "Test user login functionality on leaftaps.com",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Navigate",
          "target": "https://leaftaps.com/opentaps/control/main",
          "value": ""
        },
        {
          "stepNumber": 2,
          "action": "Fill",
          "target": "Username Input",
          "value": "demosalesmanager"
        },
        {
          "stepNumber": 3,
          "action": "Fill",
          "target": "Password Input",
          "value": "crmsfa"
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
          "expected": "main"
        },
        {
          "type": "element",
          "matcher": "visible",
          "expected": "Logout Button"
        },
        {
          "type": "text",
          "matcher": "contains",
          "expected": "Sales Manager"
        }
      ]
    }
  }' | jq '.'
```

---

## 📊 Expected Response (Success)

```json
{
  "success": true,
  "testCode": "import { test, expect } from '@playwright/test';\n\ntest.describe('Leaftaps User Login', () => {\n  test('should Test user login functionality on leaftaps.com', async ({ page }) => {\n    await page.goto('https://leaftaps.com/opentaps/control/main', { waitUntil: 'networkidle' });\n    \n    try {\n      await page.getByLabel(/username/i).fill('demosalesmanager', { timeout: 5000 });\n    } catch {\n      try {\n        await page.getByPlaceholder(/username/i).fill('demosalesmanager', { timeout: 5000 });\n      } catch {\n        await page.locator('input[type=\"text\"]').first().fill('demosalesmanager', { timeout: 5000 });\n      }\n    }\n    ...\n  });\n});",
  "accessibilitySnapshot": "[form]\n  [label] 'Username'\n  [input] placeholder='Username' type='text'\n  [label] 'Password'\n  [input] placeholder='Password' type='password'\n  [button] 'Login' type='submit'\n",
  "executionLog": [
    {
      "step": 1,
      "action": "navigate",
      "duration": 3421,
      "result": "Success"
    },
    {
      "step": 2,
      "action": "fill",
      "duration": 234,
      "result": "Success - Used getByLabel"
    },
    {
      "step": 3,
      "action": "fill",
      "duration": 156,
      "result": "Success - Used getByLabel"
    },
    {
      "step": 4,
      "action": "click",
      "duration": 89,
      "result": "Success - Used getByRole"
    }
  ],
  "locators": [
    {
      "step": 2,
      "oldLocator": "Username Input",
      "newLocator": "getByLabel(/username/i)",
      "strategy": "label-based"
    },
    {
      "step": 3,
      "oldLocator": "Password Input",
      "newLocator": "getByLabel(/password/i)",
      "strategy": "label-based"
    },
    {
      "step": 4,
      "oldLocator": "Login Button",
      "newLocator": "getByRole('button', { name: /login/i })",
      "strategy": "role-based"
    }
  ],
  "filePath": "tests/ui/TC_002.spec.ts"
}
```

---

## ✅ After Getting Response: Next Steps

### 1. View Generated Test Code

```bash
# PowerShell
cat tests/ui/TC_002.spec.ts

# Bash
cat tests/ui/TC_002.spec.ts
```

### 2. View Accessibility Snapshot

```bash
cat tests/ui/TC_002-accessibility.txt
```

### 3. View Execution Log

```bash
# PowerShell
Get-Content tests/ui/TC_002-execution.json | ConvertFrom-Json | ConvertTo-Json

# Bash
cat tests/ui/TC_002-execution.json | jq '.'
```

### 4. View Locator Mappings

```bash
# PowerShell
Get-Content tests/ui/TC_002-locators.json | ConvertFrom-Json | ConvertTo-Json

# Bash
cat tests/ui/TC_002-locators.json | jq '.'
```

### 5. Run the Generated Test

```bash
# Run test
npx playwright test tests/ui/TC_002.spec.ts

# Run with headed browser (see what's happening)
npx playwright test tests/ui/TC_002.spec.ts --headed

# Run with UI mode (interactive debugging)
npx playwright test tests/ui/TC_002.spec.ts --ui

# Debug test step by step
npx playwright test tests/ui/TC_002.spec.ts --debug
```

---

## 🔍 What to Verify

✅ **API responds with HTTP 200** - Success  
✅ **Test code is generated** - Contains accessibility-first locators  
✅ **Execution log shows all steps successful** - No failures  
✅ **Locator mappings show transformation** - From user input to real selectors  
✅ **Accessibility snapshot captured** - Shows real DOM structure  
✅ **Test runs successfully** - Logs in and verifies user session  

---

## 🆘 Troubleshooting

### API Returns 404
```
Error: Cannot POST /api/v1/scripts/generate
```
**Fix:** Backend not running. Start it:
```bash
cd backend
npm start
```

### API Returns 400
```
Error: testMetadata is required
```
**Fix:** JSON payload is malformed. Verify the structure.

### Test Fails: "Element not found"
**Cause:** Leaftaps website structure is different  
**Fix:** Check the accessibility snapshot to see actual DOM:
```bash
cat tests/ui/TC_002-accessibility.txt
```

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Fix:** Backend not running on port 3000. Start it with:
```bash
npm start
```

---

## 📈 Complete Flow Visualization

```
┌─────────────────────────────────────────┐
│ 1. Run cURL Command                     │
│    (Sends test metadata to API)         │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 2. Backend Processes (MCP)              │
│    ├─ Launch browser                    │
│    ├─ Navigate to leaftaps.com          │
│    ├─ Capture accessibility tree        │
│    ├─ Send to Claude for analysis       │
│    ├─ Generate intelligent locators     │
│    └─ Execute test steps                │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 3. Response Received                    │
│    ├─ Test Code (accessibility-first)   │
│    ├─ Accessibility Snapshot            │
│    ├─ Execution Log                     │
│    └─ Locator Mappings                  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 4. Test Files Generated                 │
│    ├─ tests/ui/TC_002.spec.ts          │
│    ├─ tests/ui/TC_002-accessibility.txt│
│    ├─ tests/ui/TC_002-execution.json   │
│    └─ tests/ui/TC_002-locators.json    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 5. Run Test                             │
│    (npx playwright test ...)            │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 6. Test Execution                       │
│    ├─ Navigate to leaftaps login        │
│    ├─ Fill username (accessibility)     │
│    ├─ Fill password (accessibility)     │
│    ├─ Click login (role-based)          │
│    └─ Verify success (assertions)       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 7. Test Results                         │
│    ✓ Test passed (user logged in)       │
│    ✓ All assertions passed              │
│    ✓ Execution metrics captured         │
└─────────────────────────────────────────┘
```

---

## 🎯 Key Achievements

✅ **MCP Integration** - Full browser automation via MCP  
✅ **Real Website Testing** - Tested against actual leaftaps.com  
✅ **Accessibility-First** - Locators use semantic HTML and ARIA  
✅ **Dynamic Generation** - Locators discovered via LLM analysis  
✅ **Fallback Strategies** - Multiple ways to find each element  
✅ **Complete Logging** - All metrics and snapshots captured  
✅ **E2E Validation** - Tests real login workflow  

---

## 🚀 Ready to Go!

Run the cURL command above and you'll have:
- ✅ Generated test script
- ✅ Accessibility analysis
- ✅ Execution metrics
- ✅ Ready-to-run test

Then run `npx playwright test` and verify everything works! 🎉
