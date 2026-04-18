# TC_003: CRMSFA Create Lead Flow - Complete Guide

## Overview
This test case automates the complete lead creation workflow in the Leaftaps CRMSFA application. It covers:
- Authentication (login)
- Form navigation
- Lead data entry using **accessibility-first selectors**
- Form submission
- Verification of successful lead creation

## Test Case Details

### Test IDs
- **TC_003**: Main create lead test (with comprehensive form filling)
- **TC_003b**: Validation test (verifies required field validation)

### Credentials
```
Username: demosalesmanager
Password: crmsfa
```

### URLs
```
Main Page:       https://leaftaps.com/crmsfa/control/main
Create Lead Form: https://leaftaps.com/crmsfa/control/createLeadForm
View Lead:       https://leaftaps.com/crmsfa/control/viewLead?leadId=<ID>
```

## Test Data Used

### Lead Information (Fake Data)
```
Company Name: TechVision Solutions Inc
First Name: Michael
Last Name: Johnson
Local First Name: Mike
Title: Senior Business Development Manager
Department: Business Development
Description: High-priority prospect for Q2 2026. Referred by industry contact.
Primary Email: michael.johnson@techvision.com
Phone: +1-555-0123
Fax: +1-555-0124
State: California
```

## Accessibility-First Selectors Strategy

### Selectors Used in Test

| Field | Selector Type | Example |
|-------|---------------|---------|
| Username | getByLabel | `getByLabel(/username/i)` |
| Password | getByLabel | `getByLabel(/password/i)` |
| Login Button | getByRole | `getByRole('button', { name: /login/i })` |
| Company Name | getByLabel | `getByLabel(/company name/i)` |
| First Name | getByLabel | `getByLabel(/first name/i)` |
| Last Name | getByLabel | `getByLabel(/last name/i)` |
| Email | getByLabel | `getByLabel(/primary email/i)` |
| State Dropdown | getByLabel | `getByLabel(/state\|province/i)` |
| Create Button | getByRole | `getByRole('button', { name: /create lead\|submit/i })` |

### Benefits of Accessibility-First Selectors
✅ **Resilient** - Not affected by CSS class changes  
✅ **User-centric** - Mimics how real users interact with forms  
✅ **Maintainable** - Less brittle than data-testid selectors  
✅ **Accessible** - Ensures app accessibility compliance  

---

## Running the Test

### 1. Run Locally (Headless Mode)
```bash
cd pw-ai-agent-main/pw-ai-agents
npx playwright test tests/ui/TC_003.spec.ts
```

### 2. Run in Headed Mode (See Browser)
```bash
npx playwright test tests/ui/TC_003.spec.ts --headed
```

### 3. Run with UI Mode (Interactive)
```bash
npx playwright test tests/ui/TC_003.spec.ts --ui
```

### 4. Run with Debug Mode
```bash
npx playwright test tests/ui/TC_003.spec.ts --debug
```

### 5. Run Specific Test Case
```bash
# Run only TC_003 (main test)
npx playwright test tests/ui/TC_003.spec.ts -g "TC_003:"

# Run only TC_003b (validation test)
npx playwright test tests/ui/TC_003.spec.ts -g "TC_003b:"
```

### 6. Run with Tracing (for debugging)
```bash
npx playwright test tests/ui/TC_003.spec.ts --trace on
```

---

## cURL Workflow

### Using PowerShell (Windows)
```powershell
cd pw-ai-agent-main/pw-ai-agents
.\curl-createLead-workflow.ps1
```

### Using Bash (Linux/Mac)
```bash
cd pw-ai-agent-main/pw-ai-agents
chmod +x curl-createLead-workflow.sh
./curl-createLead-workflow.sh
```

### Manual cURL Command
```bash
# Step 1: Login
curl -X POST https://leaftaps.com/opentaps/control/main \
  -d "USERNAME=demosalesmanager&PASSWORD=crmsfa" \
  -c cookies.txt -L

# Step 2: Create Lead
curl -X POST https://leaftaps.com/crmsfa/control/createLead \
  -d "companyName=TechVision%20Solutions%20Inc&firstName=Michael&lastName=Johnson&primaryEmail=michael.johnson@techvision.com" \
  -b cookies.txt -L
```

---

## MCP Backend Generation

### Request to MCP Backend
The test can be generated via the MCP backend API endpoint:

```bash
curl -X POST http://localhost:3000/api/v1/scripts/generate \
  -H "Content-Type: application/json" \
  -d @test-data/TC_003-metadata.json
```

### Request Payload Structure
```json
{
  "testMetadata": {
    "id": "TC_003",
    "name": "CRMSFA - Create Lead Flow",
    "steps": [
      {
        "stepNumber": 1,
        "action": "Navigate",
        "target": "https://leaftaps.com/crmsfa/control/main",
        "selector": "optional accessibility selector",
        "value": "optional value to fill"
      }
    ],
    "assertions": [
      {
        "type": "url|text|element",
        "matcher": "contains|equals",
        "expected": "expected value"
      }
    ]
  }
}
```

### PowerShell Generation Script
```powershell
# Generate test via MCP backend
$body = Get-Content -Raw "test-data\TC_003-metadata.json"
$uri = "http://localhost:3000/api/v1/scripts/generate"

$response = Invoke-RestMethod -Uri $uri -Method Post -ContentType 'application/json' -Body $body

if ($response.success) {
    Write-Host "✅ Test generated successfully"
    $response.testCode | Out-File -FilePath "tests\ui\TC_003.spec.ts" -Encoding utf8
} else {
    Write-Error "Generation failed: $($response.error)"
}
```

---

## Expected Test Results

### Successful Run
```
✓ TC_003: Should create a new lead in CRMSFA with accessibility-based selectors (12.5s)
  ✓ Navigates to CRMSFA main page
  ✓ Logs in with credentials
  ✓ Navigates to Create Lead Form
  ✓ Fills all form fields with fake data
  ✓ Submits the form
  ✓ Verifies lead creation
  ✓ Lead created successfully: Michael Johnson from TechVision Solutions Inc

✓ TC_003b: Should validate required fields in Create Lead form (8.3s)
  ✓ Validates required field errors are displayed

Test run: 2 passed (20.8s)
```

### Failed Run Indicators
```
✗ Validation error message not found
✗ Lead name "Michael Johnson" not visible after creation
✗ Email field not filled (selector mismatch)
✗ Form submission timed out
```

---

## Troubleshooting

### Issue: Selectors Not Found
**Solution**: The form might use different labels. Use Playwright Inspector to find actual labels:
```bash
npx playwright test tests/ui/TC_003.spec.ts --debug
```

### Issue: Element Not Visible / Clickable
**Solution**: Increase timeout or add wait:
```javascript
await page.waitForSelector('[label containing text]', { timeout: 10000 });
```

### Issue: Login Fails
**Solution**: Verify credentials and check if 2FA is enabled. Clear cookies:
```bash
rm cookies.txt
```

### Issue: Form Submission Timeout
**Solution**: Check if JavaScript is disabled or CSRF token validation is failing.

---

## Test Coverage

| Scenario | Status | Accessibility |
|----------|--------|----------------|
| Login Flow | ✅ Covered | Label-based |
| Form Navigation | ✅ Covered | Label-based |
| Required Fields | ✅ Covered (TC_003b) | Role-based |
| Optional Fields | ✅ Covered | Label-based |
| Dropdown Selection | ✅ Covered | Label-based |
| Form Submission | ✅ Covered | Role-based |
| Success Verification | ✅ Covered | Text-based |

---

## Files Generated

```
tests/ui/TC_003.spec.ts                    - Main Playwright test file
test-data/TC_003-metadata.json             - Test metadata for MCP generation
curl-createLead-workflow.ps1               - PowerShell cURL workflow script
curl-createLead-workflow.sh                - Bash cURL workflow script
```

---

## Next Steps

1. **Run the test locally**: `npx playwright test tests/ui/TC_003.spec.ts --headed`
2. **Generate more tests**: Use MCP backend with different metadata
3. **CI/CD Integration**: Add test to your CI/CD pipeline
4. **Extend coverage**: Create additional test cases for error scenarios

---

**Last Updated**: April 18, 2026  
**Test Framework**: Playwright  
**Strategy**: Accessibility-First Selectors  
**Environment**: Leaftaps CRMSFA
