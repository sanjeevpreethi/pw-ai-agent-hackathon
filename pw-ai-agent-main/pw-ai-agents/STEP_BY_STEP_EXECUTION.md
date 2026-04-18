# Step-by-Step Execution Guide

Complete walkthrough with exact commands and expected output at each step.

---

## 🎬 Scene 1: Start the Backend API

### Your Action
```powershell
cd backend
npm start
```

### Expected Output
```
> backend@1.0.0 start
> node server.js

Server running on http://localhost:3000
Database connected
Ready for requests
```

✅ **Status:** Backend is running and waiting for requests

---

## 🎬 Scene 2: Navigate to Test Directory

### Your Action
```powershell
cd ../pw-ai-agents
```

### Verify You're in Right Directory
```powershell
pwd
# Expected output: C:\Users\prathb\Downloads\pw-ai-agent-main\pw-ai-agent-main\pw-ai-agents
```

### List Files to Verify Setup
```powershell
ls generate-leaftaps-test.ps1
# Should show the script file exists
```

✅ **Status:** You're in the correct directory

---

## 🎬 Scene 3: Generate Test Using PowerShell Script

### Your Action
```powershell
.\generate-leaftaps-test.ps1
```

### Expected Output (Step by Step)

```
╔════════════════════════════════════════════════════════════╗
║   Leaftaps E2E Test Generation via cURL                   ║
╚════════════════════════════════════════════════════════════╝

📝 API Endpoint: http://localhost:3000/api/v1/scripts/generate
🔐 Auth Token: your-auth-token-here...

📊 Test Metadata:
{
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
}

════════════════════════════════════════════════════════════

🚀 Sending request to API...

Response Status Code: 200

✅ SUCCESS! Test script generated successfully

🔍 Locator Mappings:
  Step 2: Username Input
    Old: Username Input
    New: getByLabel(/username|user name|login id/i)
    Strategy: label-based

  Step 3: Password Input
    Old: Password Input
    New: getByLabel(/password|passwd/i)
    Strategy: label-based

  Step 4: Login Button
    Old: Login Button
    New: getByRole('button', { name: /login|sign in|submit/i })
    Strategy: role-based

📊 Execution Log:
  Step 1: navigate
    Duration: 3421ms
    Result: Success - Navigated to https://leaftaps.com/opentaps/control/main

  Step 2: fill
    Duration: 234ms
    Result: Success - Filled username field with 'demosalesmanager' using getByLabel

  Step 3: fill
    Duration: 156ms
    Result: Success - Filled password field with 'crmsfa' using getByLabel

  Step 4: click
    Duration: 89ms
    Result: Success - Clicked login button using getByRole

💾 Saving generated artifacts...
✅ Test code saved to: tests/ui/TC_002.spec.ts
✅ Locator mappings saved to: tests/ui/TC_002-locators.json
✅ Execution log saved to: tests/ui/TC_002-execution.json
✅ Accessibility snapshot saved to: tests/ui/TC_002-accessibility.txt

════════════════════════════════════════════════════════════
Next Steps:
1. Review the generated test: tests/ui/TC_002.spec.ts
2. Check accessibility snapshot: tests/ui/TC_002-accessibility.txt
3. View locator mappings: tests/ui/TC_002-locators.json
4. Run the test: npx playwright test tests/ui/TC_002.spec.ts
════════════════════════════════════════════════════════════
```

✅ **Status:** Test script generated successfully!

---

## 🎬 Scene 4: Review Generated Files

### Check Test Code Exists
```powershell
ls tests/ui/TC_002.spec.ts
```

### View the Generated Test
```powershell
cat tests/ui/TC_002.spec.ts
```

### Expected Content (First 30 Lines)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Leaftaps User Login', () => {
  test('should Test user login functionality on leaftaps.com', async ({ page }) => {
    // Generated with MCP-based Automation Agent
    // Accessibility-first locators • Dynamic selector strategy
    // Target: https://leaftaps.com/opentaps/control/main
    
    // Locator Mapping (Accessibility-First)
    // Step 2: Accessibility-based input for username field
    // Strategy: Multiple fallbacks for maximum resilience
    
    // Navigate to login page
    await page.goto('https://leaftaps.com/opentaps/control/main', { waitUntil: 'networkidle' });

    // Wait for login form to load
    await page.waitForLoadState('domcontentloaded');

    // Fill username field with multiple accessibility strategies
    // Priority: label-based → placeholder-based → name attribute → css selector
    try {
      // Try label-based approach (most semantic)
      await page.getByLabel(/username|user name|login id/i).fill('demosalesmanager', { timeout: 5000 });
```

✅ **Status:** Test file is accessibility-first and ready!

### View Accessibility Snapshot
```powershell
cat tests/ui/TC_002-accessibility.txt
```

### Expected Output
```
[form]
  [label] "Username"
  [input] placeholder="Username" type="text"
  [label] "Password"
  [input] placeholder="Password" type="password"
  [button] "Login" type="submit"
  [link] "Forgot Password?"
```

### View Locator Mappings
```powershell
Get-Content tests/ui/TC_002-locators.json | ConvertFrom-Json | ConvertTo-Json
```

### Expected Output
```json
[
  {
    "step": 2,
    "oldLocator": "Username Input",
    "newLocator": "getByLabel(/username|user name|login id/i)",
    "strategy": "label-based"
  },
  {
    "step": 3,
    "oldLocator": "Password Input",
    "newLocator": "getByLabel(/password|passwd/i)",
    "strategy": "label-based"
  },
  {
    "step": 4,
    "oldLocator": "Login Button",
    "newLocator": "getByRole('button', { name: /login|sign in|submit/i })",
    "strategy": "role-based"
  }
]
```

✅ **Status:** All artifacts generated!

---

## 🎬 Scene 5: Run the Test (Headed Mode)

### Your Action
```powershell
npx playwright test tests/ui/TC_002.spec.ts --headed
```

### Expected Output

```
Running 1 test from tests/ui/TC_002.spec.ts

  [chromium] › Leaftaps User Login › should Test user login functionality on leaftaps.com
    ✓ passed (3.5s)

  1 passed (3.5s)
```

### What You'll See in Browser

1. **Browser Opens** - Chromium launches
2. **Navigation** - Goes to https://leaftaps.com/opentaps/control/main
3. **Form Appears** - Login form loads
4. **Username Filled** - "demosalesmanager" entered
5. **Password Filled** - "crmsfa" entered
6. **Login Clicked** - Button clicked
7. **Loading** - Page processes login (few seconds)
8. **Dashboard** - Redirected to dashboard/main page
9. **Success** - Browser closes, test completes

✅ **Status:** Test passed!

---

## 🎬 Scene 6: View Test Report (Optional)

### Your Action
```powershell
npx playwright show-report
```

### Expected Output
```
Serving Playwright HTML Report at http://localhost:9323. Press Ctrl+C to exit.
```

### In Browser
- Opens at http://localhost:9323
- Shows test results summary
- "1 passed" indicator
- Execution time: ~3.5 seconds
- Traces and videos available

✅ **Status:** Report available for review!

---

## 🎬 Scene 7: Verify All Files Generated

### Check Files Exist
```powershell
ls tests/ui/TC_002*
```

### Expected Output
```
    Directory: C:\Users\prathb\Downloads\pw-ai-agent-main\pw-ai-agent-main\pw-ai-agents\tests\ui

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---           4/18/2026  2:45 PM           8234 TC_002.spec.ts
-a---           4/18/2026  2:44 PM            456 TC_002-accessibility.txt
-a---           4/18/2026  2:44 PM            892 TC_002-execution.json
-a---           4/18/2026  2:44 PM            678 TC_002-locators.json
```

✅ **Status:** All 4 files created!

---

## 📊 Execution Timeline

| Step | Action | Duration | Status |
|------|--------|----------|--------|
| 1 | Backend starts | ~2 sec | ✅ Ready |
| 2 | Navigate to pw-ai-agents | ~1 sec | ✅ In place |
| 3 | Run generation script | ~5 sec | ✅ Generated |
| 4 | Review files | ~2 sec | ✅ Verified |
| 5 | Run test (headed) | ~3.5 sec | ✅ Passed |
| 6 | View report | ~1 sec | ✅ Viewed |
| **Total** | **Complete E2E** | **~14.5 sec** | **✅ SUCCESS** |

---

## 🎯 Success Indicators

After completing all steps, you should see:

✅ **Backend Output:**
```
Server running on http://localhost:3000
```

✅ **Generation Script Output:**
```
✅ SUCCESS! Test script generated successfully
✅ Test code saved to: tests/ui/TC_002.spec.ts
✅ Locator mappings saved to: tests/ui/TC_002-locators.json
✅ Execution log saved to: tests/ui/TC_002-execution.json
✅ Accessibility snapshot saved to: tests/ui/TC_002-accessibility.txt
```

✅ **Test Execution Output:**
```
1 passed (3.5s)
```

✅ **File System:**
```
tests/ui/TC_002.spec.ts ✅
tests/ui/TC_002-accessibility.txt ✅
tests/ui/TC_002-execution.json ✅
tests/ui/TC_002-locators.json ✅
```

---

## 🆘 Troubleshooting at Each Step

### If Backend Won't Start
```powershell
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process using the port
Stop-Process -Id <PID> -Force

# Try starting again
npm start
```

### If Script Fails
```powershell
# Verify you're in the right directory
pwd

# Verify the script file exists
Test-Path generate-leaftaps-test.ps1

# Run with error details
.\generate-leaftaps-test.ps1 -ErrorAction Continue
```

### If Test Fails
```powershell
# Check the accessibility snapshot
cat tests/ui/TC_002-accessibility.txt

# Check the execution log
cat tests/ui/TC_002-execution.json

# Run with debug
npx playwright test tests/ui/TC_002.spec.ts --debug
```

---

## 📈 Performance Baseline

After successful run, you'll have:

| Metric | Value |
|--------|-------|
| Generation Time | ~3-5 sec |
| Test Execution | ~3-5 sec |
| Total E2E Time | ~10-20 sec |
| Files Generated | 4 |
| Assertions Passed | 3/3 |
| Success Rate | 100% |

---

## 🎉 Completion Checklist

- [ ] Backend API running on :3000
- [ ] PowerShell script executed successfully
- [ ] 4 test files generated
- [ ] Accessibility snapshot captured
- [ ] Execution log shows all steps
- [ ] Locator mappings show transformations
- [ ] Playwright test ran successfully
- [ ] Browser showed login process
- [ ] Dashboard loaded after login
- [ ] All assertions passed
- [ ] Report shows "1 passed"
- [ ] You're viewing this checklist ✅

---

## 🚀 Next Level: Run Multiple Times

Try running the test multiple times:

```powershell
# Run 3 times sequentially
for ($i = 1; $i -le 3; $i++) {
    Write-Host "Run $i..."
    npx playwright test tests/ui/TC_002.spec.ts
}

# Result: 3 passed (9-15s)
```

---

## 🎓 What You've Accomplished

1. ✅ Started MCP-enabled backend
2. ✅ Generated intelligent test with accessibility-first locators
3. ✅ Captured real page accessibility snapshot
4. ✅ Executed test against live website
5. ✅ Verified successful login
6. ✅ Collected complete execution metrics
7. ✅ Created production-ready test code

**You've successfully demonstrated end-to-end MCP-based test generation!**

---

## 📞 Need Help?

Refer to:
- 📖 [QUICK_START_LEAFTAPS.md](./QUICK_START_LEAFTAPS.md) - Quick reference
- 📖 [LEAFTAPS_E2E_GUIDE.md](./LEAFTAPS_E2E_GUIDE.md) - Full guide
- 📖 [CURL_COMMANDS.md](./CURL_COMMANDS.md) - cURL reference
- 📖 [TC_002_TRANSFORMATION.md](./TC_002_TRANSFORMATION.md) - Before/after

---

**Ready? Start with:** `cd backend && npm start`

Good luck! 🚀
