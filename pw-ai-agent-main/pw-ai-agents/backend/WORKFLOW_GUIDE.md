# PW-AI-Agents: Complete Workflow Guide

## Overview

This guide walks you through the complete workflow of creating automation test cases using the AI agent and executing them via Playwright MCP (Model Context Protocol).

## Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Tests / Manual                     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│          API Layer (Express REST Endpoints)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              AI Agents Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Parser    │  │  Generator   │  │  Validator   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│          Orchestration Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Test Runner  │  │ Browser Mgr  │  │ Retry Logic  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│        Playwright MCP Integration                            │
│     (Executes generated TypeScript scripts)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│     Test Execution & Result Reporting                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Workflow: Step-by-Step

### **Phase 1: Test Case Creation & Script Generation**

#### Step 1: Prepare Test Cases

Create your test cases in one of these formats:
- **Manual**: Structured JSON format
- **Jira**: Export from Jira as JSON
- **Excel**: Parse from spreadsheet

**Example Test Case Structure:**
```json
{
  "testCaseId": "TC_LOGIN_001",
  "testName": "User Login - Valid Credentials",
  "description": "Verify user can login with valid email and password",
  "steps": [
    {
      "stepNumber": 1,
      "action": "Navigate",
      "input": "https://app.example.com/login"
    },
    {
      "stepNumber": 2,
      "action": "Fill",
      "target": "[data-testid='email']",
      "input": "user@example.com"
    },
    {
      "stepNumber": 3,
      "action": "Fill",
      "target": "[data-testid='password']",
      "input": "SecurePassword123"
    },
    {
      "stepNumber": 4,
      "action": "Click",
      "target": "[data-testid='login-button']"
    }
  ],
  "expectedResults": [
    "User is redirected to dashboard",
    "Welcome message is displayed",
    "User profile is visible"
  ]
}
```

#### Step 2: Upload Test Cases via API

**Endpoint:** `POST /api/v1/test-cases/upload`

**Using Postman:**
1. Open the imported Postman collection
2. Go to **Test Generation** → **Upload Test Cases**
3. Update the request body with your test cases
4. Add your auth token to the `Authorization` header
5. Click **Send**

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadId": "550e8400-e29b-41d4-a716-446655440000",
    "parsedTestCases": [
      {
        "id": "TC_LOGIN_001",
        "name": "User Login - Valid Credentials",
        "steps": [...],
        "assertions": [...]
      }
    ],
    "summary": {
      "total": 1,
      "successful": 1,
      "failed": 0
    }
  }
}
```

**What happens internally:**
- The **TestCaseParser Agent** validates the structure
- Converts raw test steps into structured metadata
- Extracts assertions and expected results
- Returns validation errors if any

#### Step 3: Generate Playwright Scripts

**Endpoint:** `POST /api/v1/scripts/generate`

**Using Postman:**
1. Go to **Test Generation** → **Generate Single Script**
2. Copy the test metadata from the upload response
3. Update the `testMetadata` in the request body
4. Click **Send**

**Request:**
```json
{
  "testMetadata": {
    "id": "TC_LOGIN_001",
    "name": "User Login - Valid Credentials",
    "steps": [
      {
        "stepNumber": 1,
        "action": "Navigate",
        "target": "https://app.example.com/login"
      },
      // ... more steps
    ],
    "assertions": [
      {
        "type": "url",
        "matcher": "contains",
        "expected": "dashboard"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "testId": "TC_LOGIN_001",
    "generatedScript": "import { test, expect } from '@playwright/test';\n\ntest('User Login - Valid Credentials', async ({ page }) => {\n  await page.goto('https://app.example.com/login');\n  await page.fill('[data-testid=\"email\"]', 'user@example.com');\n  await page.fill('[data-testid=\"password\"]', 'SecurePassword123');\n  await page.click('[data-testid=\"login-button\"]');\n  \n  // Assertions\n  expect(page.url()).toContain('dashboard');\n  const welcome = await page.isVisible('text=Welcome');\n  expect(welcome).toBeTruthy();\n});",
    "scriptPath": "./scripts/TC_LOGIN_001.ts",
    "validationStatus": "valid",
    "errors": [],
    "warnings": []
  }
}
```

**What happens internally:**
- The **ScriptGenerator Agent** creates Playwright TypeScript code
- Converts test steps to Playwright actions:
  - Navigate → `page.goto()`
  - Fill → `page.fill()`
  - Click → `page.click()`
- Converts assertions to expect() statements
- Validates script syntax

#### Step 4: Validate Generated Scripts (Optional)

The validation happens automatically during generation, but you can review:
- `validationStatus` - "valid" or "invalid"
- `errors` - Any syntax or logic errors
- `warnings` - Best practice recommendations

---

### **Phase 2: Test Execution via Playwright MCP**

#### Step 5: Execute Tests

**Endpoint:** `POST /api/v1/executions/run`

**Using Postman:**
1. Go to **Test Execution** → **Execute Tests**
2. Update test IDs and script paths from your generated scripts
3. Configure execution options:
   - `parallel`: true/false (parallel or sequential execution)
   - `maxWorkers`: 4 (number of parallel workers)
   - `browsers`: ["chrome", "firefox"] (browsers to test on)
   - `headless`: true (run without GUI)
4. Click **Send**

**Request:**
```json
{
  "testIds": ["TC_LOGIN_001", "TC_LOGIN_002"],
  "scriptPaths": ["./scripts/TC_LOGIN_001.ts", "./scripts/TC_LOGIN_002.ts"],
  "browsers": ["chrome"],
  "parallel": true,
  "maxWorkers": 4,
  "headless": true
}
```

**Execution Flow:**
```
1. Test Execution Request
         ↓
2. TestRunner validates request
         ↓
3. Browser Pool allocates browser instances
         ↓
4. Playwright MCP loads generated scripts
         ↓
5. Scripts execute via Playwright (parallel/sequential)
         ↓
6. Results captured:
   - Test status (passed/failed/error)
   - Screenshots/artifacts
   - Duration & performance metrics
         ↓
7. RetryHandler retries failed tests (if configured)
         ↓
8. Results aggregated & reported
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "550e8400-e29b-41d4-a716-446655440001",
    "tests": [
      {
        "testId": "TC_LOGIN_001",
        "testName": "User Login - Valid Credentials",
        "status": "passed",
        "duration": 2345,
        "browser": "chrome",
        "error": null,
        "artifacts": {
          "screenshot": "./artifacts/TC_LOGIN_001-screenshot.png",
          "video": "./artifacts/TC_LOGIN_001-video.mp4"
        },
        "retryCount": 0,
        "timestamp": "2026-04-11T10:30:45.123Z"
      },
      {
        "testId": "TC_LOGIN_002",
        "testName": "User Logout",
        "status": "passed",
        "duration": 1234,
        "browser": "chrome",
        "error": null,
        "artifacts": {},
        "retryCount": 0,
        "timestamp": "2026-04-11T10:30:47.456Z"
      }
    ],
    "summary": {
      "totalTests": 2,
      "passed": 2,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "duration": 4,
      "successRate": 100,
      "timestamp": "2026-04-11T10:30:48.123Z"
    },
    "reportPath": "./reports/execution-550e8400-e29b-41d4-a716-446655440001.html"
  }
}
```

#### Step 6: Get Execution Status (Optional)

Monitor ongoing executions without waiting for completion.

**Endpoint:** `GET /api/v1/executions/{executionId}`

**Using Postman:**
1. Go to **Test Execution** → **Get Execution Status**
2. Set collection variable `execution_id` with value from Step 5 response
3. Click **Send**

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "completed",
    "metrics": {
      "queueLength": 0,
      "runningTests": 0,
      "completedTests": 2,
      "browserPoolMetrics": {
        "totalInstances": 4,
        "activeInstances": 0,
        "idleInstances": 4
      }
    }
  }
}
```

---

### **Phase 3: Results & Reporting**

#### Step 7: Retrieve Test Results

**Endpoint:** `GET /api/v1/executions/{executionId}/results?page=1&pageSize=10`

**Using Postman:**
1. Go to **Test Execution** → **Get Test Results**
2. Results are paginated, adjust `page` and `pageSize` as needed
3. Click **Send**

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "550e8400-e29b-41d4-a716-446655440001",
    "results": [
      {
        "testId": "TC_LOGIN_001",
        "testName": "User Login - Valid Credentials",
        "status": "passed",
        "duration": 2345,
        "browser": "chrome",
        "error": null,
        "artifacts": {
          "screenshot": "./artifacts/TC_LOGIN_001-screenshot.png"
        },
        "retryCount": 0,
        "timestamp": "2026-04-11T10:30:45.123Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### Step 8: Access Generated Report

The execution response includes `reportPath`:
```
./reports/execution-550e8400-e29b-41d4-a716-446655440001.html
```

**Report Contents:**
- Executive summary (pass rate, duration, environment)
- Test-by-test results with timelines
- Failure analysis with screenshots
- Performance metrics
- Browser compatibility matrix
- Video recordings (if enabled)
- Error logs and stack traces

---

## Playwright MCP Integration Details

### What is MCP?

**Model Context Protocol** - A protocol that allows AI models and tools to interact with external systems and services. In this context, it enables our agents to:
- Execute Playwright browser automation
- Capture test results
- Manage browser resources
- Report execution metrics

### How Playwright MCP Works in This System

```
┌──────────────────────────────────────┐
│   Generated TypeScript Script        │
│  (from ScriptGenerator Agent)        │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│   Playwright MCP Interface           │
│  - Loads script                      │
│  - Manages browser context           │
│  - Captures results                  │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│   Playwright Test Runner            │
│  - Initializes browsers              │
│  - Executes test actions             │
│  - Validates assertions              │
│  - Records artifacts                 │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│   Result Aggregation                │
│  - Collects test results             │
│  - Formats data                      │
│  - Generates reports                 │
└──────────────────────────────────────┘
```

### Key MCP Capabilities

1. **Browser Management**
   - Allocates browser instances from pool
   - Manages memory and resources
   - Supports Chrome, Firefox, Webkit

2. **Script Execution**
   - Runs generated TypeScript scripts
   - Captures console output
   - Handles errors gracefully

3. **Artifact Capture**
   - Screenshots on failure/success
   - Video recordings
   - HAR files for network logging
   - Console logs

4. **Retry Logic**
   - Exponential backoff strategy
   - Configurable retry attempts
   - Smart retry only on transient failures

---

## Complete End-to-End Example

### Scenario: Create and Execute Login Test

#### Step 1: Prepare Test Cases
```json
{
  "testCases": [
    {
      "testCaseId": "LOGIN_TC_001",
      "testName": "Valid Login",
      "steps": [
        {"stepNumber": 1, "action": "Navigate", "input": "https://app.com/login"},
        {"stepNumber": 2, "action": "Fill", "target": "[name='email']", "input": "test@example.com"},
        {"stepNumber": 3, "action": "Fill", "target": "[name='password']", "input": "Pass123!"},
        {"stepNumber": 4, "action": "Click", "target": "button:has-text('Login')"}
      ],
      "expectedResults": ["User navigates to dashboard", "Welcome message visible"]
    }
  ],
  "format": "manual",
  "projectId": "proj_demo"
}
```

#### Step 2: Call Upload Endpoint
```bash
curl -X POST http://localhost:3000/api/v1/test-cases/upload \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{...test case json...}'
```

**Response:** Get upload ID and parsed test metadata

#### Step 3: Generate Script
```bash
curl -X POST http://localhost:3000/api/v1/scripts/generate \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "testMetadata": {
      "id": "LOGIN_TC_001",
      "name": "Valid Login",
      ...
    }
  }'
```

**Response:** Get generated TypeScript script

#### Step 4: Execute Tests
```bash
curl -X POST http://localhost:3000/api/v1/executions/run \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "testIds": ["LOGIN_TC_001"],
    "scriptPaths": ["./scripts/LOGIN_TC_001.ts"],
    "browsers": ["chrome"],
    "parallel": false,
    "headless": true
  }'
```

**Response:** Execution starts, returns:
- executionId
- Initial test results
- Summary statistics
- Report path

#### Step 5: Get Results
```bash
curl -X GET "http://localhost:3000/api/v1/executions/{executionId}/results?page=1&pageSize=10" \
  -H "Authorization: Bearer your-token"
```

**Response:** Detailed results with artifacts and metrics

---

## Using Postman Collection for Full Workflow

### Setup
1. Import collection: `PW-AI-Agents-BackendAPI.postman_collection.json`
2. Set collection variables:
   - `base_url` = `http://localhost:3000`
   - `auth_token` = Your bearer token

### Workflow in Postman

**1. Upload Test Cases**
```
Test Generation → Upload Test Cases
```
- Update body with your test cases
- Save response in Postman environment variable: `{{uploadId}}`

**2. Generate Script**
```
Test Generation → Generate Single Script
```
- Copy test metadata from upload response
- Insert into request body
- Save generated script path: `{{scriptPath}}`

**3. Execute Tests**
```
Test Execution → Execute Tests
```
- Update `testIds` and `scriptPaths` from previous steps
- Click Send
- Save `executionId` from response: `{{execution_id}}`

**4. Poll Status** (Optional)
```
Test Execution → Get Execution Status
```
- Uses saved `{{execution_id}}`
- Check for completion

**5. Get Results**
```
Test Execution → Get Test Results
```
- Uses saved `{{execution_id}}`
- Retrieve detailed results

**6. Generate Report**
```
Open the reportPath from execution response in browser
View comprehensive HTML report
```

---

## Error Handling & Troubleshooting

### Common Issues & Solutions

#### Issue: Test Upload Fails
**Error:** "Could not parse test cases"

**Solution:**
- Validate JSON format
- Ensure all required fields present
- Check step numbers are sequential
- Verify action values match supported actions

#### Issue: Script Generation Errors
**Error:** "Script validation failed"

**Solution:**
- Review error details in response
- Check assertion syntax
- Ensure selectors are valid CSS/XPath
- Add more specific error handling

#### Issue: Tests Don't Execute
**Error:** "Browser allocation failed"

**Solution:**
- Check browser availability
- Reduce maxWorkers if system memory limited
- Verify Playwright MCP is running
- Check browser binary paths

#### Issue: Timeout During Execution
**Error:** "Execution timeout exceeded"

**Solution:**
- Increase timeout in headers
- Reduce number of parallel tests
- Check network connectivity
- Review selectors for flakiness

---

## Advanced Features

### Batch Generation
Generate multiple scripts at once:
```json
{
  "testMetadataList": [
    {...test 1...},
    {...test 2...},
    {...test 3...}
  ]
}
```

### Parallel Execution with Retry
```json
{
  "testIds": ["TC_001", "TC_002"],
  "scriptPaths": [...],
  "parallel": true,
  "maxWorkers": 8,
  "headless": true,
  "retryConfig": {
    "maxAttempts": 3,
    "backoffMultiplier": 2
  }
}
```

### Multi-Browser Testing
```json
{
  "browsers": ["chrome", "firefox", "webkit"],
  "parallel": true
}
```

---

## Result Interpretation

### Status Values
- **passed**: All assertions succeeded
- **failed**: One or more assertions failed
- **error**: Execution error (not assertion)
- **skipped**: Test was skipped
- **timeout**: Test exceeded time limit

### Metrics to Monitor
- **successRate**: Percentage of passed tests
- **duration**: Total execution time in seconds
- **retryCount**: How many times test was retried
- **artifacts**: Captured screenshots/videos

### Sample Result Summary
```json
{
  "totalTests": 50,
  "passed": 48,
  "failed": 2,
  "errors": 0,
  "successRate": 96,
  "duration": 245,
  "timestamp": "2026-04-11T10:30:48.123Z"
}
```

---

## Best Practices

1. **Test Case Design**
   - Use descriptive test names
   - Keep steps atomic and focused
   - Write clear expected results

2. **Script Generation**
   - Review generated scripts before execution
   - Adjust selectors if needed
   - Add custom wait conditions for dynamic content

3. **Execution**
   - Start with small test batches
   - Use headless mode for CI/CD
   - Monitor browser pool utilization
   - Enable video recording for failures

4. **Result Analysis**
   - Review failure screenshots
   - Check error messages in logs
   - Track retry patterns
   - Monitor performance trends

---

## Summary

The complete workflow:
1. **Create** test cases in standard format
2. **Parse** using TestCaseParser agent
3. **Generate** Playwright scripts using ScriptGenerator agent
4. **Execute** via Playwright MCP with orchestration
5. **Capture** results, artifacts, and metrics
6. **Report** through HTML dashboard

Each step leverages the AI agents, orchestration layer, and Playwright MCP integration to provide a seamless automation experience.
