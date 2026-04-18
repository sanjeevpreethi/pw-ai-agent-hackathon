# End-to-End Test Generation for Leaftaps Login

Complete guide to generate, test, and validate the Leaftaps login automation using MCP-based test generation.

---

## 📋 What's Included

### Files Created/Updated

1. **test-data/TC_002-metadata.json** - Test metadata for Leaftaps login
2. **generate-leaftaps-test.ps1** - PowerShell script to run cURL request
3. **generate-leaftaps-test.sh** - Bash script to run cURL request (for Linux/Mac)
4. **tests/ui/TC_002.spec.ts** - Updated test with accessibility-first locators

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Backend API (if not already running)

```bash
# In the backend directory
cd backend
npm start
# Should start on http://localhost:3000
```

### Step 2: Run the Test Generation Script

#### Option A: PowerShell (Windows)
```powershell
cd pw-ai-agents
.\generate-leaftaps-test.ps1
```

#### Option B: Bash (Linux/Mac)
```bash
cd pw-ai-agents
chmod +x generate-leaftaps-test.sh
./generate-leaftaps-test.sh
```

### Step 3: Run the Generated Test

```bash
npx playwright test tests/ui/TC_002.spec.ts
```

---

## 📊 What Happens in Each Step

### Step 1: API Request

The script sends this metadata to the backend:

```json
{
  "testMetadata": {
    "id": "TC_002",
    "name": "Leaftaps User Login",
    "description": "Test user login functionality on leaftaps.com",
    "steps": [
      {
        "stepNumber": 1,
        "action": "Navigate",
        "target": "https://leaftaps.com/opentaps/control/main"
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
        "target": "Login Button"
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
}
```

### Step 2: Backend Processing (MCP)

The backend processes this through:

```
1. TestScriptGenerator
   ├─ Parse metadata
   ├─ Build user intent: "Navigate to URL, fill username with demosalesmanager, fill password with crmsfa, click Login Button"
   └─ Initialize automation agent

2. BrowserAutomationAgent (with MCP)
   ├─ Launch browser
   ├─ Navigate to https://leaftaps.com/opentaps/control/main
   ├─ Capture accessibility tree
   ├─ Send to Claude LLM
   ├─ Receive intelligent locators
   ├─ Execute steps
   └─ Capture results

3. Generated Output
   ├─ TC_002.spec.ts (test code)
   ├─ TC_002-accessibility.txt (snapshot)
   ├─ TC_002-execution.json (logs)
   └─ TC_002-locators.json (mappings)
```

### Step 3: Test Execution

Playwright runs the test against the real Leaftaps website:

```
1. Navigate to login page
2. Fill username field (with accessibility-first fallback strategies)
3. Fill password field (with accessibility-first fallback strategies)
4. Click login button (using role-based selector)
5. Wait for navigation to dashboard
6. Verify login success with multiple assertions
```

---

## 🔍 Expected Test Output Structure

### TC_002.spec.ts (Generated Test Code)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Leaftaps User Login', () => {
  test('should Test user login functionality on leaftaps.com', async ({ page }) => {
    // Generated with MCP-based Automation Agent
    // Accessibility-first locators • Dynamic selector strategy
    
    await page.goto('https://leaftaps.com/opentaps/control/main', { waitUntil: 'networkidle' });
    
    // Username with fallbacks
    try {
      await page.getByLabel(/username/i).fill('demosalesmanager');
    } catch {
      try {
        await page.getByPlaceholder(/username/i).fill('demosalesmanager');
      } catch {
        await page.locator('input[type="text"]').first().fill('demosalesmanager');
      }
    }
    
    // Password with fallbacks
    try {
      await page.getByLabel(/password/i).fill('crmsfa');
    } catch {
      try {
        await page.locator('input[type="password"]').fill('crmsfa');
      } catch {
        // Additional fallback
      }
    }
    
    // Login button using role-based approach
    await page.getByRole('button', { name: /login/i }).click();
    
    // Assertions
    await expect(page).toHaveURL(/.*main.*/);
    await expect(page.getByText(/Sales Manager/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /logout/i })).toBeVisible();
  });
});
```

### TC_002-locators.json (Locator Mappings)

```json
[
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
]
```

### TC_002-execution.json (Execution Log)

```json
[
  {
    "step": 1,
    "action": "navigate",
    "duration": 3421,
    "result": "Success - Navigated to https://leaftaps.com/opentaps/control/main"
  },
  {
    "step": 2,
    "action": "fill",
    "duration": 234,
    "result": "Success - Filled username field with 'demosalesmanager' using getByLabel"
  },
  {
    "step": 3,
    "action": "fill",
    "duration": 156,
    "result": "Success - Filled password field with 'crmsfa' using getByLabel"
  },
  {
    "step": 4,
    "action": "click",
    "duration": 89,
    "result": "Success - Clicked login button using getByRole"
  }
]
```

### TC_002-accessibility.txt (Accessibility Snapshot)

```
[form]
  [label] "Username"
  [input] placeholder="Username" type="text"
  [label] "Password"
  [input] placeholder="Password" type="password"
  [button] "Login" type="submit"
  [link] "Forgot Password?"
```

---

## 🧪 Running the Full E2E Flow

### Complete Command Sequence

```bash
# 1. Navigate to pw-ai-agents
cd c:\Users\prathb\Downloads\pw-ai-agent-main\pw-ai-agent-main\pw-ai-agents

# 2. Generate the test (PowerShell on Windows)
.\generate-leaftaps-test.ps1

# You should see output like:
# ╔════════════════════════════════════════════════════════════╗
# ║   Leaftaps E2E Test Generation via cURL                   ║
# ╚════════════════════════════════════════════════════════════╝
# 
# 📝 API Endpoint: http://localhost:3000/api/v1/scripts/generate
# 🚀 Sending request to API...
# Response Status Code: 200
# ✅ SUCCESS! Test script generated successfully

# 3. Review the generated test
cat tests/ui/TC_002.spec.ts

# 4. Run the test against Leaftaps website
npx playwright test tests/ui/TC_002.spec.ts --headed

# 5. View the Playwright report
npx playwright show-report
```

---

## ✅ Success Indicators

### API Response (HTTP 200)
```
✅ SUCCESS! Test script generated successfully

🔍 Locator Mappings:
  Step 2: 
    Old: Username Input
    New: getByLabel(/username/i)
    Strategy: label-based
    
  Step 3:
    Old: Password Input
    New: getByLabel(/password/i)
    Strategy: label-based
    
  Step 4:
    Old: Login Button
    New: getByRole('button', { name: /login/i })
    Strategy: role-based

📊 Execution Log:
  Step 1: navigate
    Duration: 3421ms
    Result: Success
  Step 2: fill
    Duration: 234ms
    Result: Success - Used getByLabel
  Step 3: fill
    Duration: 156ms
    Result: Success - Used getByLabel
  Step 4: click
    Duration: 89ms
    Result: Success - Used getByRole

💾 Saving generated artifacts...
✅ Test code saved to: tests/ui/TC_002.spec.ts
✅ Locator mappings saved to: tests/ui/TC_002-locators.json
✅ Execution log saved to: tests/ui/TC_002-execution.json
✅ Accessibility snapshot saved to: tests/ui/TC_002-accessibility.txt
```

### Test Execution
```
Running 1 test from tests/ui/TC_002.spec.ts
  ✓ [chromium] › Leaftaps User Login › should Test user login functionality on leaftaps.com (3.5s)

1 passed (3.5s)
```

---

## 🔧 Troubleshooting

### Issue: API Returns 400 Bad Request

**Check:**
- Backend API is running: `http://localhost:3000`
- Request JSON is valid (check `test-data/TC_002-metadata.json`)
- Authorization header is correct (if required)

**Solution:**
```powershell
# Test if API is reachable
curl http://localhost:3000

# Check API logs
# Look for detailed error message in response
```

### Issue: Test Fails - Locator Not Found

**Likely Cause:** The actual Leaftaps website HTML structure is different from expected

**Solution:**
1. Manually navigate to https://leaftaps.com/opentaps/control/main
2. Inspect the login form elements
3. Update the `getByLabel()`, `getByPlaceholder()`, etc. in the test
4. Or let the system auto-discover with better locator strategies

### Issue: "Cannot find module" Error

**Solution:**
```bash
# Install dependencies
npm install

# Ensure all packages are present
npm list @playwright/test
npm list @anthropic-ai/sdk
```

---

## 📈 Expected Performance Metrics

| Metric | Expected | Actual |
|--------|----------|--------|
| **API Response Time** | 2-5 seconds | - |
| **Navigate Duration** | 2-4 seconds | - |
| **Fill Field Duration** | 200-300ms each | - |
| **Click Duration** | 100-200ms | - |
| **Total Test Duration** | 5-10 seconds | - |

---

## 🎯 Key Points of MCP Integration

This test demonstrates:

✅ **MCP Browser Control** - Uses browser automation tools  
✅ **Accessibility Analysis** - Captures page accessibility tree  
✅ **LLM-Driven Locators** - Claude analyzes page and suggests selectors  
✅ **Fallback Strategies** - Multiple ways to find each element  
✅ **E2E Validation** - Tests real website, not mocked  
✅ **Complete Logging** - Execution metrics and artifact capture  

---

## 📝 Next Steps

1. **✅ Run the generation script** - Generate test with MCP
2. **✅ Review generated files** - Check accessibility snapshot
3. **✅ Execute the test** - Run against real Leaftaps website
4. **✅ Verify success** - Confirm login works
5. **📊 Analyze logs** - Review execution metrics
6. **🔄 Iterate** - Refine locators if needed

---

## 🔗 Related Files

- [test-generator.ts](./test-generator.ts) - Generator service
- [backend/script-generation-handler.ts](./backend/script-generation-handler.ts) - API handler
- [automation-agent.ts](./automation-agent.ts) - MCP automation engine
- [helpers/llm.ts](./helpers/llm.ts) - Claude integration
- [helpers/mcp-client.ts](./helpers/mcp-client.ts) - MCP client
- [playwright.config.ts](./playwright.config.ts) - Playwright config

---

## 🎬 Commands Reference

```bash
# Generate test (Windows PowerShell)
.\generate-leaftaps-test.ps1

# Generate test (Bash)
./generate-leaftaps-test.sh

# Run test
npx playwright test tests/ui/TC_002.spec.ts

# Run test with UI
npx playwright test tests/ui/TC_002.spec.ts --ui

# Run test in headed mode (see browser)
npx playwright test tests/ui/TC_002.spec.ts --headed

# Show report
npx playwright show-report

# Debug test
npx playwright test tests/ui/TC_002.spec.ts --debug
```

---

## 📞 Support

If you encounter issues:

1. Check the execution log: `tests/ui/TC_002-execution.json`
2. View accessibility snapshot: `tests/ui/TC_002-accessibility.txt`
3. Check locator mappings: `tests/ui/TC_002-locators.json`
4. Review MCP logs in terminal
5. Check Playwright report: `npx playwright show-report`
