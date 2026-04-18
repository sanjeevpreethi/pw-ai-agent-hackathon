# Leaftaps E2E Test - Quick Reference Card

**Your credentials:** demosalesmanager / crmsfa  
**URL:** https://leaftaps.com/opentaps/control/main

---

## Step 1️⃣: Start Backend API

```powershell
# In new PowerShell window
cd backend
npm start

# You should see:
# Server running on http://localhost:3000
```

---

## Step 2️⃣: Generate Test Script

### Option A: Run PowerShell Script (EASIEST)
```powershell
# From pw-ai-agents directory
.\generate-leaftaps-test.ps1

# Wait for completion. Should see:
# ✅ SUCCESS! Test script generated successfully
# ✅ Test code saved to: tests/ui/TC_002.spec.ts
```

### Option B: Run Bash Script
```bash
cd pw-ai-agents
./generate-leaftaps-test.sh
```

### Option C: Run cURL Directly
```powershell
$body = @{testMetadata=@{id="TC_002";name="Leaftaps User Login";description="Test user login functionality on leaftaps.com";steps=@(@{stepNumber=1;action="Navigate";target="https://leaftaps.com/opentaps/control/main";value=""},@{stepNumber=2;action="Fill";target="Username Input";value="demosalesmanager"},@{stepNumber=3;action="Fill";target="Password Input";value="crmsfa"},@{stepNumber=4;action="Click";target="Login Button";value=""});assertions=@(@{type="url";matcher="contains";expected="main"},@{type="element";matcher="visible";expected="Logout Button"},@{type="text";matcher="contains";expected="Sales Manager"})}} | ConvertTo-Json -Depth 10; Invoke-WebRequest -Uri "http://localhost:3000/api/v1/scripts/generate" -Method POST -Headers @{'Content-Type'='application/json'} -Body $body
```

---

## Step 3️⃣: Review Generated Files

```powershell
# View the generated test code
cat tests/ui/TC_002.spec.ts

# View accessibility snapshot
cat tests/ui/TC_002-accessibility.txt

# View execution log
cat tests/ui/TC_002-execution.json

# View locator mappings
cat tests/ui/TC_002-locators.json
```

---

## Step 4️⃣: Run the Test

```powershell
# Run test
npx playwright test tests/ui/TC_002.spec.ts

# OR run with headed browser (see it execute)
npx playwright test tests/ui/TC_002.spec.ts --headed

# OR run in interactive UI mode
npx playwright test tests/ui/TC_002.spec.ts --ui

# OR run with debugging
npx playwright test tests/ui/TC_002.spec.ts --debug
```

---

## Step 5️⃣: View Test Report

```powershell
# Show Playwright report
npx playwright show-report
```

---

## ✅ Expected Results

### When API Responds (200 OK):
```
✅ SUCCESS! Test script generated successfully

🔍 Locator Mappings:
  Step 2: Username Input → getByLabel(/username/i) [label-based]
  Step 3: Password Input → getByLabel(/password/i) [label-based]
  Step 4: Login Button → getByRole('button', { name: /login/i }) [role-based]

📊 Execution Log:
  Step 1: navigate - 3421ms - Success
  Step 2: fill - 234ms - Success (Used getByLabel)
  Step 3: fill - 156ms - Success (Used getByLabel)
  Step 4: click - 89ms - Success (Used getByRole)

💾 Files Saved:
  ✅ tests/ui/TC_002.spec.ts
  ✅ tests/ui/TC_002-locators.json
  ✅ tests/ui/TC_002-execution.json
  ✅ tests/ui/TC_002-accessibility.txt
```

### When Test Runs (Playwright):
```
✓ Leaftaps User Login › should Test user login functionality on leaftaps.com (3.5s)

1 passed (3.5s)
```

---

## 🔧 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| API not responding | `cd backend && npm start` |
| Script not found | `cd pw-ai-agents` |
| Permission denied (bash) | `chmod +x generate-leaftaps-test.sh` |
| JSON parse error | Verify API is running on port 3000 |
| Test fails: element not found | Check `tests/ui/TC_002-accessibility.txt` |
| Port 3000 in use | `npx kill-port 3000` or use different port |

---

## 📁 File Structure

```
pw-ai-agents/
├── tests/
│   └── ui/
│       ├── TC_002.spec.ts                    ← MAIN TEST FILE
│       ├── TC_002-accessibility.txt          ← DOM SNAPSHOT
│       ├── TC_002-execution.json             ← LOGS & METRICS
│       └── TC_002-locators.json              ← SELECTOR MAPPINGS
├── test-data/
│   └── TC_002-metadata.json                  ← TEST METADATA
├── generate-leaftaps-test.ps1                ← PowerShell SCRIPT
├── generate-leaftaps-test.sh                 ← Bash SCRIPT
├── LEAFTAPS_E2E_GUIDE.md                     ← Full Guide
├── CURL_COMMANDS.md                          ← cURL Reference
└── [other files...]
```

---

## 🎯 What's Being Tested

```
Test: Leaftaps User Login
├─ Navigate to: https://leaftaps.com/opentaps/control/main
├─ Fill username: demosalesmanager (accessibility-based)
├─ Fill password: crmsfa (accessibility-based)
├─ Click login: Using role-based selector
└─ Verify Success:
   ├─ URL contains "main" ✓
   ├─ "Sales Manager" text visible ✓
   └─ Logout button visible ✓
```

---

## 📊 Test Metrics

| Metric | Value |
|--------|-------|
| Test Duration | ~3-5 seconds |
| Navigate | ~2-3 seconds |
| Fill Fields | ~400ms total |
| Click Login | ~100ms |
| Assertions | ~200ms |

---

## 🔐 Credentials Used

**Username:** demosalesmanager  
**Password:** crmsfa  
**Expected Role:** Sales Manager

---

## 🚀 Full Command Sequence

### PowerShell (Windows)
```powershell
# Terminal 1: Start backend
cd backend; npm start

# Terminal 2: Generate and test
cd pw-ai-agents
.\generate-leaftaps-test.ps1
npx playwright test tests/ui/TC_002.spec.ts --headed
npx playwright show-report
```

### Bash (Linux/Mac)
```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Generate and test
cd pw-ai-agents
chmod +x generate-leaftaps-test.sh
./generate-leaftaps-test.sh
npx playwright test tests/ui/TC_002.spec.ts --headed
npx playwright show-report
```

---

## 📋 Checklist

- [ ] Backend API running on :3000
- [ ] Generate test script (via script or cURL)
- [ ] Generated files created in tests/ui/
- [ ] TC_002.spec.ts contains accessibility-first locators
- [ ] Accessibility snapshot captured
- [ ] Execution log shows all steps successful
- [ ] Locator mappings show transformations
- [ ] Test runs successfully
- [ ] User logged in verified
- [ ] All assertions pass

---

## 🎓 What You're Testing

✅ **MCP Integration** - Browser automation via MCP  
✅ **Real Website** - Not mocked, actual leaftaps.com  
✅ **Accessibility** - Using semantic selectors  
✅ **LLM Analysis** - Claude analyzes page  
✅ **Fallback Strategies** - Multiple selector options  
✅ **E2E Flow** - Complete login workflow  
✅ **Metrics & Logging** - All details captured  

---

## 🎉 Success!

Once all steps complete:
1. ✅ Test script generated with accessibility-first locators
2. ✅ API proved E2E capability with real website
3. ✅ Test executes successfully
4. ✅ User successfully logged in
5. ✅ All artifacts captured for analysis

You have successfully demonstrated **MCP-based intelligent test generation** working end-to-end!
