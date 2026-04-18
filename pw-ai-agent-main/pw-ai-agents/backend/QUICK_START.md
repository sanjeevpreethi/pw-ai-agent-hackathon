# Quick Start Guide: Execute Automation Tests

## 5-Minute Quick Start

### Prerequisites
- Backend server running on `http://localhost:3000`
- Bearer token for authentication
- Postman collection imported (or curl installed)

---

## Quick Command Reference

### 1. Upload Test Cases
```bash
curl -X POST http://localhost:3000/api/v1/test-cases/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "testCases": [
      {
        "testCaseId": "TC_001",
        "testName": "Login Test",
        "steps": [
          {
            "stepNumber": 1,
            "action": "Navigate",
            "input": "https://example.com/login"
          },
          {
            "stepNumber": 2,
            "action": "Fill",
            "target": "[data-testid=\"username\"]",
            "input": "user@example.com"
          },
          {
            "stepNumber": 3,
            "action": "Click",
            "target": "button[type=\"submit\"]"
          }
        ],
        "expectedResults": ["Login successful", "Dashboard visible"]
      }
    ],
    "format": "manual",
    "projectId": "proj_001"
  }'
```

**Save Response:** Copy `uploadId` and test metadata for next step

---

### 2. Generate Playwright Script
```bash
curl -X POST http://localhost:3000/api/v1/scripts/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "testMetadata": {
      "id": "TC_001",
      "name": "Login Test",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Navigate",
          "target": "https://example.com/login"
        },
        {
          "stepNumber": 2,
          "action": "Fill",
          "target": "[data-testid=\"username\"]",
          "value": "user@example.com"
        },
        {
          "stepNumber": 3,
          "action": "Click",
          "target": "button[type=\"submit\"]"
        }
      ],
      "assertions": [
        {
          "type": "url",
          "matcher": "contains",
          "expected": "dashboard"
        }
      ]
    }
  }'
```

**Response:** Get `generatedScript` and `scriptPath`

**Generated Script Example:**
```typescript
import { test, expect } from '@playwright/test';

test('Login Test', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('[data-testid="username"]', 'user@example.com');
  await page.click('button[type="submit"]');
  
  // Assertions
  expect(page.url()).toContain('dashboard');
});
```

---

### 3. Execute Tests
```bash
curl -X POST http://localhost:3000/api/v1/executions/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "testIds": ["TC_001"],
    "scriptPaths": ["./scripts/TC_001.ts"],
    "browsers": ["chrome"],
    "parallel": false,
    "maxWorkers": 1,
    "headless": true
  }'
```

**Response Will Include:**
```json
{
  "success": true,
  "data": {
    "executionId": "550e8400-e29b-41d4-a716-446655440000",
    "tests": [
      {
        "testId": "TC_001",
        "status": "passed",
        "duration": 2345,
        "artifacts": {
          "screenshot": "./artifacts/TC_001-screenshot.png"
        }
      }
    ],
    "summary": {
      "totalTests": 1,
      "passed": 1,
      "failed": 0,
      "successRate": 100,
      "duration": 2
    },
    "reportPath": "./reports/execution-550e8400-e29b-41d4-a716-446655440000.html"
  }
}
```

**Save:** `executionId` for result retrieval

---

### 4. Get Results
```bash
curl -X GET "http://localhost:3000/api/v1/executions/550e8400-e29b-41d4-a716-446655440000/results?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Get Execution Status
```bash
curl -X GET "http://localhost:3000/api/v1/executions/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        START: Test Automation                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   STEP 1: Create Test Cases    │
        │   (Manual/Jira/Excel format)   │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   STEP 2: Upload Test Cases    │
        │   POST /test-cases/upload      │
        │                                │
        │   Response: uploadId, metadata │
        └────────────────┬───────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────┐
    │   PARSER AGENT: Structured Parse    │
    │   - Validates format                │
    │   - Extracts steps & assertions     │
    │   - Converts to metadata            │
    └─────────────────┬───────────────────┘
                      │
                      ▼
        ┌────────────────────────────────┐
        │   STEP 3: Generate Scripts     │
        │   POST /scripts/generate       │
        │                                │
        │   Response: TypeScript Script  │
        └────────────────┬───────────────┘
                         │
                         ▼
  ┌──────────────────────────────────────┐
  │   GENERATOR AGENT: Create Scripts    │
  │   - Converts steps to Playwright     │
  │   - Generates assertions             │
  │   - Validates syntax                 │
  │                                      │
  │   Output: *.ts file                  │
  └──────────────────┬───────────────────┘
                     │
                     ▼
      ┌──────────────────────────────┐
      │   STEP 4: Execute Tests      │
      │   POST /executions/run       │
      │                              │
      │   Response: executionId      │
      └──────────────┬───────────────┘
                     │
                     ▼
    ┌──────────────────────────────────┐
    │   ORCHESTRATION LAYER            │
    │   ├─ TestRunner                  │
    │   ├─ BrowserManager (pool)       │
    │   └─ RetryHandler (backoff)      │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │   PLAYWRIGHT MCP EXECUTION       │
    │   ├─ Load *.ts script            │
    │   ├─ Initialize browser          │
    │   ├─ Run test actions            │
    │   ├─ Validate assertions         │
    │   └─ Capture artifacts           │
    │       (screenshots, videos)      │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │   Test Execution Results         │
    │   ├─ Status (passed/failed)      │
    │   ├─ Duration & metrics          │
    │   ├─ Screenshots & artifacts     │
    │   └─ Error details (if any)      │
    └──────────────┬───────────────────┘
                   │
                   ▼
        ┌────────────────────────────┐
        │   STEP 5: Get Results      │
        │  GET /executions/{id}/     │
        │       results              │
        │                            │
        │   Response: Detailed data  │
        └────────────────┬───────────┘
                         │
                         ▼
        ┌────────────────────────────┐
        │   STEP 6: View Report      │
        │   Open reportPath in       │
        │   browser                  │
        │                            │
        │   Includes:                │
        │   - Pass/Fail stats        │
        │   - Screenshots            │
        │   - Video recordings       │
        │   - Performance metrics    │
        └────────────────┬───────────┘
                         │
                         ▼
        ┌────────────────────────────┐
        │   END: Execution Complete  │
        │   Results Ready for Review │
        └────────────────────────────┘
```

---

## Data Flow Between Components

```
Test Case (JSON)
    ↓
┌─────────────────────────┐
│  TestCaseParser Agent   │ ← Validates & parses
└────────┬────────────────┘
         ↓
    Metadata
    (id, name, steps, assertions)
         ↓
┌─────────────────────────┐
│  ScriptGenerator Agent  │ ← Generates TypeScript
└────────┬────────────────┘
         ↓
    TypeScript File
    (import, test blocks, assertions)
         ↓
┌─────────────────────────┐
│  ScriptValidator Agent  │ ← Validates syntax
└────────┬────────────────┘
         ↓
    Script Ready
         ↓
┌─────────────────────────┐
│   TestRunner            │ ← Orchestrates execution
├─ Parallel executor     │
├─ Browser pool mgr      │
├─ Retry handler         │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│  Playwright MCP         │ ← Executes in browser
│  (Browser context)      │
└────────┬────────────────┘
         ↓
    Test Results
    (status, duration, artifacts)
         ↓
    HTML Report Generated
```

---

## Postman Collection Flow

### Import Steps
1. Open Postman
2. Click **Import**
3. Select `PW-AI-Agents-BackendAPI.postman_collection.json`
4. Click **Import**

### Set Variables
1. Click on collection → **Variables** tab
2. Set:
   - `base_url` = `http://localhost:3000`
   - `auth_token` = Your bearer token

### Execute Workflow
1. **Test Generation** → **Upload Test Cases** → Send
2. Copy `uploadId` from response
3. **Test Generation** → **Generate Single Script** → Send
4. Copy `scriptPath` from response
5. **Test Execution** → **Execute Tests** → Send
6. Copy `executionId` from response
7. **Test Execution** → **Get Execution Status** → Send (optional)
8. **Test Execution** → **Get Test Results** → Send
9. Open `reportPath` in browser

---

## Playwright MCP Integration Explained

### What MCP Does

| Component | Role |
|-----------|------|
| **Loads Script** | Reads generated `.ts` file |
| **Initializes Browser** | Launches Chrome/Firefox/Webkit |
| **Injects Context** | Provides page object to script |
| **Executes Actions** | Runs page.goto(), page.click(), etc. |
| **Validates Assertions** | Runs expect() statements |
| **Captures Artifacts** | Screenshots, videos, logs |
| **Reports Results** | Passes data back to executor |

### Execution Timeline

```
Time →
0ms    Script loaded
50ms   Browser context created
100ms  Test starts
150ms  Navigate to page (500ms wait)
700ms  Fill username field
800ms  Fill password field
900ms  Click login button
1400ms Wait for navigation (500ms)
1500ms Run assertions
2000ms Capture screenshot
2050ms Test complete ✓ PASSED
```

---

## Example: Running Multiple Tests in Parallel

### Setup
```json
{
  "testIds": ["TC_001", "TC_002", "TC_003", "TC_004"],
  "scriptPaths": [
    "./scripts/TC_001.ts",
    "./scripts/TC_002.ts",
    "./scripts/TC_003.ts",
    "./scripts/TC_004.ts"
  ],
  "browsers": ["chrome", "firefox"],
  "parallel": true,
  "maxWorkers": 4,
  "headless": true
}
```

### Execution
```
Worker 1: TC_001 + Chrome
Worker 2: TC_002 + Chrome
Worker 3: TC_003 + Firefox
Worker 4: TC_004 + Firefox

All 4 running in parallel
↓
Fastest finish: TC_002 (1.2s)
Next: TC_001 (1.8s)
Next: TC_004 (2.3s)
Last: TC_003 (2.9s)
↓
Total time: 2.9s (vs 8.2s sequential)
Success rate: 4/4 = 100%
```

---

## Response Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Request successful |
| 207 | Multi-Status | Partial success (some tests failed) |
| 400 | Bad Request | Invalid request body |
| 401 | Unauthorized | Missing/invalid auth token |
| 422 | Unprocessable | Validation error in test cases |
| 500 | Server Error | Server-side error |

---

## Troubleshooting Checklist

- [ ] Backend server is running (`http://localhost:3000`)
- [ ] Bearer token is valid and included in headers
- [ ] Test cases have valid JSON format
- [ ] All required fields present in request bodies
- [ ] Selectors in test steps are valid CSS/XPath
- [ ] Browser is available on system
- [ ] Sufficient disk space for artifacts
- [ ] Network connectivity is working

---

## Key Metrics to Monitor

```
Execution Summary:
├─ Total Tests: 50
├─ Passed: 48 (96%)
├─ Failed: 2 (4%)
├─ Errors: 0
├─ Skipped: 0
├─ Duration: 245 seconds
├─ Avg Duration: 4.9s per test
├─ Slowest Test: 12.3s
├─ Fastest Test: 0.8s
└─ Retry Rate: 8%

Browser Performance:
├─ Total Browser Instances: 4
├─ Active During Peak: 4
├─ Average Load Time: 1.2s
├─ Average Action Time: 150ms
└─ Memory Usage: 245MB

Success Indicators:
├─ First-Pass Success Rate: 96%
├─ After Retry Success Rate: 98%
├─ No Flaky Tests
└─ All Artifacts Captured
```

---

## Next Steps

1. **Get Bearer Token**: Check your auth system for token
2. **Test Health Endpoint**: `GET /health` (no auth required)
3. **Import Postman Collection**: Use the JSON file
4. **Run First Test**: Follow Quick Start above
5. **Review Results**: Open HTML report
6. **Iterate & Improve**: Refine test cases based on results

---

## Support & Documentation

- Full API Documentation: `API_DOCUMENTATION.md`
- Architecture Overview: `ARCHITECTURE.md`
- Implementation Details: `IMPLEMENTATION_SUMMARY.md`
- Workflow Guide: `WORKFLOW_GUIDE.md`
