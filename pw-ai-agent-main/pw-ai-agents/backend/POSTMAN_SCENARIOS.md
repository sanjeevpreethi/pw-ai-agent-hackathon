# Postman Test Scenarios & Examples

## Scenario 1: Simple Login Test (Single Test)

### Test Case Details
- **Name**: "User Login with Valid Credentials"
- **Application**: SampleApp (https://sampleapp.example.com)
- **Expected Result**: User successfully logs in and sees dashboard

### Step 1: Upload Test Case
**Endpoint**: `POST /api/v1/test-cases/upload`

**Request Body**:
```json
{
  "testCases": [
    {
      "testCaseId": "LOGIN_001",
      "testName": "User Login with Valid Credentials",
      "description": "Test user can login with correct email and password",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Navigate",
          "input": "https://sampleapp.example.com/login"
        },
        {
          "stepNumber": 2,
          "action": "Fill",
          "target": "[data-testid='email-input']",
          "input": "user@example.com"
        },
        {
          "stepNumber": 3,
          "action": "Fill",
          "target": "[data-testid='password-input']",
          "input": "Password123!"
        },
        {
          "stepNumber": 4,
          "action": "Click",
          "target": "button[data-testid='login-btn']"
        }
      ],
      "expectedResults": [
        "User is redirected to dashboard page",
        "Welcome message is displayed",
        "User profile icon is visible"
      ]
    }
  ],
  "format": "manual",
  "projectId": "sampleapp_001"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "uploadId": "550e8400-e29b-41d4-a716-446655440000",
    "parsedTestCases": [
      {
        "id": "LOGIN_001",
        "name": "User Login with Valid Credentials",
        "steps": [
          {
            "stepNumber": 1,
            "action": "Navigate",
            "target": "https://sampleapp.example.com/login"
          },
          {
            "stepNumber": 2,
            "action": "Fill",
            "target": "[data-testid='email-input']",
            "value": "user@example.com"
          },
          {
            "stepNumber": 3,
            "action": "Fill",
            "target": "[data-testid='password-input']",
            "value": "Password123!"
          },
          {
            "stepNumber": 4,
            "action": "Click",
            "target": "button[data-testid='login-btn']"
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
            "matcher": "visible",
            "expected": "Welcome"
          }
        ]
      }
    ],
    "errors": [],
    "summary": {
      "total": 1,
      "successful": 1,
      "failed": 0
    }
  },
  "timestamp": "2026-04-11T10:15:22.345Z"
}
```

### Step 2: Generate Script

**Endpoint**: `POST /api/v1/scripts/generate`

**Request Body**:
```json
{
  "testMetadata": {
    "id": "LOGIN_001",
    "name": "User Login with Valid Credentials",
    "description": "Test user can login with correct email and password",
    "steps": [
      {
        "stepNumber": 1,
        "action": "Navigate",
        "target": "https://sampleapp.example.com/login"
      },
      {
        "stepNumber": 2,
        "action": "Fill",
        "target": "[data-testid='email-input']",
        "value": "user@example.com"
      },
      {
        "stepNumber": 3,
        "action": "Fill",
        "target": "[data-testid='password-input']",
        "value": "Password123!"
      },
      {
        "stepNumber": 4,
        "action": "Click",
        "target": "button[data-testid='login-btn']"
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
        "matcher": "visible",
        "expected": "Welcome"
      }
    ]
  }
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "testId": "LOGIN_001",
    "generatedScript": "import { test, expect } from '@playwright/test';\n\ntest('User Login with Valid Credentials', async ({ page }) => {\n  // Navigation\n  await page.goto('https://sampleapp.example.com/login');\n  \n  // Fill form fields\n  await page.fill('[data-testid=\"email-input\"]', 'user@example.com');\n  await page.fill('[data-testid=\"password-input\"]', 'Password123!');\n  \n  // Click login button\n  await page.click('button[data-testid=\"login-btn\"]');\n  \n  // Wait for navigation\n  await page.waitForNavigation();\n  \n  // Assertions\n  expect(page.url()).toContain('dashboard');\n  const welcomeText = await page.isVisible('text=Welcome');\n  expect(welcomeText).toBeTruthy();\n});",
    "scriptPath": "./scripts/LOGIN_001.ts",
    "validationStatus": "valid",
    "errors": [],
    "warnings": []
  },
  "timestamp": "2026-04-11T10:15:45.678Z"
}
```

### Step 3: Execute Test

**Endpoint**: `POST /api/v1/executions/run`

**Request Body**:
```json
{
  "testIds": ["LOGIN_001"],
  "scriptPaths": ["./scripts/LOGIN_001.ts"],
  "browsers": ["chrome"],
  "parallel": false,
  "maxWorkers": 1,
  "headless": true
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "executionId": "550e8400-e29b-41d4-a716-446655440001",
    "tests": [
      {
        "testId": "LOGIN_001",
        "testName": "User Login with Valid Credentials",
        "status": "passed",
        "duration": 3456,
        "browser": "chrome",
        "error": null,
        "artifacts": {
          "screenshot": "./artifacts/LOGIN_001-screenshot.png",
          "video": "./artifacts/LOGIN_001-video.mp4"
        },
        "retryCount": 0,
        "timestamp": "2026-04-11T10:16:15.234Z"
      }
    ],
    "summary": {
      "totalTests": 1,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "duration": 3,
      "successRate": 100,
      "timestamp": "2026-04-11T10:16:18.567Z"
    },
    "reportPath": "./reports/execution-550e8400-e29b-41d4-a716-446655440001.html"
  },
  "timestamp": "2026-04-11T10:16:18.567Z"
}
```

### Step 4: Get Results

**Endpoint**: `GET /api/v1/executions/550e8400-e29b-41d4-a716-446655440001/results?page=1&pageSize=10`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "executionId": "550e8400-e29b-41d4-a716-446655440001",
    "results": [
      {
        "testId": "LOGIN_001",
        "testName": "User Login with Valid Credentials",
        "status": "passed",
        "duration": 3456,
        "browser": "chrome",
        "error": null,
        "artifacts": {
          "screenshot": "./artifacts/LOGIN_001-screenshot.png",
          "video": "./artifacts/LOGIN_001-video.mp4"
        },
        "retryCount": 0,
        "timestamp": "2026-04-11T10:16:15.234Z",
        "steps": [
          {
            "stepNumber": 1,
            "description": "Navigate to https://sampleapp.example.com/login",
            "status": "passed",
            "duration": 1200
          },
          {
            "stepNumber": 2,
            "description": "Fill email-input with user@example.com",
            "status": "passed",
            "duration": 300
          },
          {
            "stepNumber": 3,
            "description": "Fill password-input with Password123!",
            "status": "passed",
            "duration": 250
          },
          {
            "stepNumber": 4,
            "description": "Click login-btn",
            "status": "passed",
            "duration": 150
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2026-04-11T10:16:20.890Z"
}
```

---

## Scenario 2: Batch Testing (Multiple Tests - Parallel)

### Multiple Test Cases

```json
{
  "testCases": [
    {
      "testCaseId": "LOGIN_001",
      "testName": "Valid Login",
      "steps": [/* ... */],
      "expectedResults": ["Redirected to dashboard"]
    },
    {
      "testCaseId": "LOGIN_002",
      "testName": "Invalid Password",
      "steps": [/* ... */],
      "expectedResults": ["Error message shown"]
    },
    {
      "testCaseId": "LOGIN_003",
      "testName": "Empty Email Field",
      "steps": [/* ... */],
      "expectedResults": ["Validation error shown"]
    },
    {
      "testCaseId": "LOGIN_004",
      "testName": "Remember Me",
      "steps": [/* ... */],
      "expectedResults": ["Checkbox persists"]
    }
  ],
  "format": "manual",
  "projectId": "login_suite_001"
}
```

### Batch Execution

**Endpoint**: `POST /api/v1/executions/run`

**Request Body**:
```json
{
  "testIds": ["LOGIN_001", "LOGIN_002", "LOGIN_003", "LOGIN_004"],
  "scriptPaths": [
    "./scripts/LOGIN_001.ts",
    "./scripts/LOGIN_002.ts",
    "./scripts/LOGIN_003.ts",
    "./scripts/LOGIN_004.ts"
  ],
  "browsers": ["chrome", "firefox"],
  "parallel": true,
  "maxWorkers": 4,
  "headless": true
}
```

**Execution Breakdown**:
```
┌─────────────────────────────────────────────────────┐
│           Parallel Test Execution                   │
├─────────────────────────────────────────────────────┤
│ Worker 1: LOGIN_001 (Chrome)   ─── 3.4s ✓ PASSED   │
│ Worker 2: LOGIN_002 (Chrome)   ─── 2.8s ✓ PASSED   │
│ Worker 3: LOGIN_003 (Firefox)  ─── 4.2s ✓ PASSED   │
│ Worker 4: LOGIN_004 (Firefox)  ─── 3.1s ✓ PASSED   │
├─────────────────────────────────────────────────────┤
│ Total Time: 4.2s (parallel) vs 13.5s (sequential)  │
│ Speed Improvement: 69% faster                       │
└─────────────────────────────────────────────────────┘
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "executionId": "550e8400-e29b-41d4-a716-446655440002",
    "tests": [
      {
        "testId": "LOGIN_001",
        "status": "passed",
        "duration": 3400,
        "browser": "chrome"
      },
      {
        "testId": "LOGIN_002",
        "status": "passed",
        "duration": 2800,
        "browser": "chrome"
      },
      {
        "testId": "LOGIN_003",
        "status": "passed",
        "duration": 4200,
        "browser": "firefox"
      },
      {
        "testId": "LOGIN_004",
        "status": "passed",
        "duration": 3100,
        "browser": "firefox"
      }
    ],
    "summary": {
      "totalTests": 4,
      "passed": 4,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "duration": 4,
      "successRate": 100,
      "timestamp": "2026-04-11T10:30:22.123Z"
    },
    "reportPath": "./reports/execution-550e8400-e29b-41d4-a716-446655440002.html"
  }
}
```

---

## Scenario 3: Test with Failure & Retry

### Test Setup (Flaky Test)
```json
{
  "testCases": [
    {
      "testCaseId": "LOAD_001",
      "testName": "Dynamic Content Loading",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Navigate",
          "input": "https://app.example.com/dynamic"
        },
        {
          "stepNumber": 2,
          "action": "Wait",
          "input": "2000"
        },
        {
          "stepNumber": 3,
          "action": "Click",
          "target": "[data-testid='load-more']"
        }
      ],
      "expectedResults": ["More items loaded"]
    }
  ],
  "format": "manual",
  "projectId": "load_tests"
}
```

### Execution with Retry
```json
{
  "testIds": ["LOAD_001"],
  "scriptPaths": ["./scripts/LOAD_001.ts"],
  "browsers": ["chrome"],
  "parallel": false,
  "headless": true
}
```

### First Attempt Fails
**Response**:
```json
{
  "success": true,
  "data": {
    "executionId": "550e8400-e29b-41d4-a716-446655440003",
    "tests": [
      {
        "testId": "LOAD_001",
        "status": "failed",
        "duration": 3200,
        "browser": "chrome",
        "error": {
          "message": "Timeout: Element not found after 5s",
          "expected": "Element [data-testid='load-more']",
          "actual": "Element not located"
        },
        "artifacts": {
          "screenshot": "./artifacts/LOAD_001-failure-screenshot.png",
          "video": "./artifacts/LOAD_001-video.mp4"
        },
        "retryCount": 0,
        "retryable": true
      }
    ],
    "summary": {
      "totalTests": 1,
      "passed": 0,
      "failed": 1,
      "retryableTests": 1,
      "successRate": 0
    }
  }
}
```

### Automatic Retry (Retry Handler)
```
Initial Failure
    ↓
Calculate Backoff: 1s (attempt 1)
    ↓
Wait 1 second
    ↓
Retry Attempt 1 - PASSED ✓
    ↓
Update Result: PASSED
```

### Final Result After Retry
```json
{
  "testId": "LOAD_001",
  "status": "passed",
  "duration": 4500,
  "browser": "chrome",
  "retryCount": 1,
  "retryHistory": [
    {
      "attempt": 0,
      "status": "failed",
      "duration": 3200,
      "reason": "Element timeout"
    },
    {
      "attempt": 1,
      "status": "passed",
      "duration": 1300,
      "duration_after_retry": 4500
    }
  ]
}
```

---

## Scenario 4: Test with Email Verification

### Multi-Step Email Test
```json
{
  "testCases": [
    {
      "testCaseId": "EMAIL_001",
      "testName": "User Registration with Email Verification",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Navigate",
          "input": "https://app.example.com/register"
        },
        {
          "stepNumber": 2,
          "action": "Fill",
          "target": "[name='firstname']",
          "input": "John"
        },
        {
          "stepNumber": 3,
          "action": "Fill",
          "target": "[name='lastname']",
          "input": "Doe"
        },
        {
          "stepNumber": 4,
          "action": "Fill",
          "target": "[name='email']",
          "input": "john.doe@example.com"
        },
        {
          "stepNumber": 5,
          "action": "Fill",
          "target": "[name='password']",
          "input": "SecurePass123!"
        },
        {
          "stepNumber": 6,
          "action": "Click",
          "target": "[type='submit']"
        },
        {
          "stepNumber": 7,
          "action": "Wait",
          "input": "3000"
        },
        {
          "stepNumber": 8,
          "action": "Check",
          "target": "text=Check your email"
        }
      ],
      "expectedResults": [
        "Email verification page shown",
        "Success message displayed"
      ]
    }
  ],
  "format": "manual",
  "projectId": "registration_001"
}
```

### Generated Script Example
```typescript
import { test, expect } from '@playwright/test';

test('User Registration with Email Verification', async ({ page }) => {
  // Navigate to registration page
  await page.goto('https://app.example.com/register');
  
  // Fill registration form
  await page.fill('[name="firstname"]', 'John');
  await page.fill('[name="lastname"]', 'Doe');
  await page.fill('[name="email"]', 'john.doe@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  
  // Submit form
  await page.click('[type="submit"]');
  
  // Wait for verification page
  await page.waitForTimeout(3000);
  
  // Verify success message
  const verificationText = await page.isVisible('text=Check your email');
  expect(verificationText).toBeTruthy();
  
  // Verify page contains email
  await expect(page).toContainText('john.doe@example.com');
});
```

---

## Scenario 5: Cross-Browser Testing

### Desktop Browsers
```json
{
  "testIds": ["LOGIN_001"],
  "scriptPaths": ["./scripts/LOGIN_001.ts"],
  "browsers": ["chrome", "firefox", "webkit"],
  "parallel": true,
  "maxWorkers": 3,
  "headless": true
}
```

**Matrix Execution**:
```
┌─────────────────────────┐
│   Cross-Browser Matrix  │
├─────────────────────────┤
│ Chrome    → PASSED ✓    │
│ Firefox   → PASSED ✓    │
│ Webkit    → PASSED ✓    │
├─────────────────────────┤
│ All Browsers: PASSED    │
└─────────────────────────┘
```

### Response
```json
{
  "tests": [
    {
      "testId": "LOGIN_001",
      "browser": "chrome",
      "status": "passed",
      "duration": 3200
    },
    {
      "testId": "LOGIN_001",
      "browser": "firefox",
      "status": "passed",
      "duration": 3400
    },
    {
      "testId": "LOGIN_001",
      "browser": "webkit",
      "status": "passed",
      "duration": 3100
    }
  ],
  "summary": {
    "totalTests": 3,
    "passed": 3,
    "failed": 0,
    "browserCoverage": {
      "chrome": "PASSED",
      "firefox": "PASSED",
      "webkit": "PASSED"
    }
  }
}
```

---

## Scenario 6: Monitoring & Metrics

### Check System Health
**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-11T10:45:30.123Z",
  "services": {
    "database": true,
    "cache": true,
    "ai_model": true,
    "playwright_mcp": true
  },
  "metrics": {
    "uptime": 3600,
    "requestCount": 125,
    "errorCount": 0
  }
}
```

### Get Performance Metrics
**Endpoint**: `GET /api/v1/metrics`

**Response**:
```json
{
  "testRunner": {
    "queueLength": 3,
    "runningTests": 2,
    "completedTests": 47,
    "browserPoolMetrics": {
      "totalInstances": 4,
      "activeInstances": 2,
      "idleInstances": 2,
      "utilizationRate": 50
    }
  },
  "browserPool": {
    "chromeInstances": 2,
    "firefoxInstances": 1,
    "webkitInstances": 1,
    "totalMemoryUsage": "456MB"
  },
  "timestamp": "2026-04-11T10:45:30.123Z"
}
```

---

## Postman Collections Tips

### Save Response Data to Variables

In Postman, use **Tests** tab to save response values:

```javascript
// After Execute Tests response
pm.environment.set("execution_id", pm.response.json().data.executionId);
pm.environment.set("report_path", pm.response.json().data.reportPath);

// For chaining requests automatically
if (pm.response.code === 200) {
  pm.execution.setNextRequest("Get Execution Status");
}
```

### Create Test Assertions

```javascript
// Verify response structure
pm.test("Response has required fields", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('data');
  pm.expect(jsonData.data).to.have.property('executionId');
});

// Check success rate
pm.test("All tests passed", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.data.summary.successRate).to.equal(100);
});

// Verify execution time
pm.test("Execution completed within timeout", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.data.summary.duration).to.beLessThan(60);
});
```

### Run Collection as Suite

1. Click **Run** button next to collection name
2. Select endpoints to run
3. Set order of execution
4. Click **Run Collection**
5. View results in Collection Runner

---

## Common Issues & Solutions

### Issue: "Test execution timeout"
**Solution**: Increase maxWorkers or reduce parallel count

### Issue: "Browser allocation failed"
**Solution**: Check system resources, reduce concurrent browsers

### Issue: "Script validation failed"
**Solution**: Review error message, fix selectors in test steps

### Issue: "Authentication failed"
**Solution**: Verify Bearer token is valid and included

