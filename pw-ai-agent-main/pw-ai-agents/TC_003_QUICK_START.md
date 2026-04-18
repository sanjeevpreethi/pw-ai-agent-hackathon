# TC_003: Create Lead Test - Quick Reference

## 📋 What Was Created

### Test Files
- **tests/ui/TC_003.spec.ts** (Updated)
  - 2 test cases for lead creation
  - Uses accessibility-first selectors (`getByLabel`, `getByRole`)
  - 17 form fill steps with fake data
  - Complete assertions for verification

### Metadata & Configuration
- **test-data/TC_003-metadata.json**
  - Structured metadata for MCP test generation
  - All steps, selectors, and assertions documented
  - Ready for backend API integration

### cURL Workflow Scripts
- **curl-createLead-workflow.ps1** (PowerShell)
  - HTTP-based lead creation workflow
  - Session management with cookies
  - 3-step process: login → fetch form → create lead

- **curl-createLead-workflow.sh** (Bash)
  - Same workflow for Linux/Mac environments

### Documentation
- **TC_003_COMPLETE_GUIDE.md**
  - Comprehensive guide with screenshots/examples
  - Multiple ways to run tests
  - Troubleshooting guide
  - MCP integration instructions

---

## 🚀 Quick Start

### 1. Run Playwright Test (Easiest)
```bash
cd pw-ai-agents
npx playwright test tests/ui/TC_003.spec.ts --headed
```

### 2. Run Specific Test Case
```bash
# Run validation test only
npx playwright test tests/ui/TC_003.spec.ts -g "TC_003b"
```

### 3. Debug Mode (Interactive)
```bash
npx playwright test tests/ui/TC_003.spec.ts --debug
```

### 4. Generate via MCP Backend
```bash
curl -X POST http://localhost:3000/api/v1/scripts/generate \
  -H "Content-Type: application/json" \
  -d @test-data/TC_003-metadata.json
```

### 5. Run cURL Workflow (PowerShell)
```powershell
.\curl-createLead-workflow.ps1
```

### 6. Run cURL Workflow (Bash)
```bash
./curl-createLead-workflow.sh
```

---

## 📊 Test Details

### Credentials
```
Username: demosalesmanager
Password: crmsfa
```

### Lead Created
```
Name: Michael Johnson
Company: TechVision Solutions Inc
Email: michael.johnson@techvision.com
Phone: +1-555-0123
```

### Selectors Strategy
✅ **Accessibility-First**: Uses `getByLabel()`, `getByRole()`, `getByPlaceholder()`  
✅ **Resilient**: Not affected by CSS/class changes  
✅ **User-Centric**: Mimics real user interactions  

---

## 📁 File Structure

```
pw-ai-agents/
├── tests/ui/
│   └── TC_003.spec.ts                    ← Main test file (2 test cases)
├── test-data/
│   └── TC_003-metadata.json              ← MCP generation metadata
├── curl-createLead-workflow.ps1          ← PowerShell cURL script
├── curl-createLead-workflow.sh           ← Bash cURL script
└── TC_003_COMPLETE_GUIDE.md              ← Full documentation
```

---

## ✅ Test Coverage

| Scenario | Coverage |
|----------|----------|
| Login | ✅ Yes |
| Navigation | ✅ Yes |
| Form Fields | ✅ 11 fields filled |
| Dropdowns | ✅ Yes (State selection) |
| Validation | ✅ Yes (TC_003b) |
| Success Check | ✅ Yes (URL + content) |

---

## 🔍 What the Test Does

### TC_003 (Main Test)
1. Navigate to CRMSFA main page
2. Login with credentials
3. Navigate to Create Lead Form
4. Fill 11 form fields with fake data
5. Select state from dropdown
6. Click "Create Lead" button
7. Verify success:
   - URL contains "viewLead"
   - Lead name visible
   - Company name visible
   - Email visible

### TC_003b (Validation Test)
1. Navigate to Create Lead Form
2. Attempt form submission without filling required fields
3. Verify validation error messages appear

---

## 🛠️ Accessibility Selectors Used

```javascript
// By Label (for inputs/textareas)
page.getByLabel(/username/i)
page.getByLabel(/first name/i)
page.getByLabel(/company name/i)
page.getByLabel(/primary email/i)

// By Role (for buttons/dropdowns)
page.getByRole('button', { name: /login/i })
page.getByRole('button', { name: /create lead/i })
page.getByLabel(/state|province/i)

// By Placeholder (if labels missing)
page.getByPlaceholder(/enter email/i)
```

---

## 📊 Expected Output

```
TC_003: Should create a new lead in CRMSFA... ✓ (12.5s)
TC_003b: Should validate required fields... ✓ (8.3s)

✅ 2 passed (20.8s)
```

---

## 🔗 Related Files

- **TC_003_COMPLETE_GUIDE.md** - Full documentation with examples
- **test-data/TC_003-metadata.json** - Metadata for MCP integration
- **backend/script-generation-handler.ts** - MCP API handler

---

## 💡 Pro Tips

1. **Use `--headed` flag to see the browser in action**
   ```bash
   npx playwright test tests/ui/TC_003.spec.ts --headed
   ```

2. **Use `--debug` for interactive debugging**
   ```bash
   npx playwright test tests/ui/TC_003.spec.ts --debug
   ```

3. **View trace files for failed tests**
   ```bash
   npx playwright show-trace trace.zip
   ```

4. **Run tests in parallel across browsers**
   ```bash
   npx playwright test tests/ui/TC_003.spec.ts --headed --workers=1
   ```

---

**Created**: April 18, 2026  
**Test Framework**: Playwright + MCP  
**Environment**: Leaftaps CRMSFA  
**Status**: ✅ Ready to Run
