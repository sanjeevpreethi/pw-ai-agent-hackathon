# Your Test Case - Detailed Transformation Example

## Input Your Sending

```json
{
  "testCases": [
    {
      "testCaseId": "TC_004",
      "testName": "User Login",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Navigate to login page",
          "input": "https://leaftaps.com/opentaps/control/main"
        },
        {
          "stepNumber": 2,
          "action": "Enter username",
          "input": "demosalesmanager"
        },
        {
          "stepNumber": 3,
          "action": "Enter password",
          "input": "crmsfa"
        },
        {
          "stepNumber": 4,
          "action": "Click login button",
          "input": ""
        }
      ],
      "expectedResults": [
        "User is successfully logged in",
        "Dashboard page is displayed"
      ]
    }
  ],
  "format": "manual",
  "projectId": "proj_12345"
}
```

## Step 1: Backend Field Mapping

**Issue**: Field names don't match expected `RawTestCase` format

| Your Field | System Field | Mapping |
|-----------|-------------|---------|
| `stepNumber` | `stepNum` | ✗ Name mismatch |
| `action` | `action` | ✓ Same |
| `input` | `testData` | ✗ Name mismatch |
| (missing) | `target` | ✗ Missing element selector |

**Need to add adapter or modify input format**

---

## Step 2: Step Parsing - Each Step Transformed

### **Step 1: Navigate**

```
Input:  {stepNumber: 1, action: "Navigate to login page", input: "...URL..."}
         ↓ (normalizeAction)
Output: {
  id: "a1b2c3d4-...",
  description: "Navigate to login page",
  action: "navigate",           // ← Regex match: contains 'navigate'
  target: undefined,            // ← No target provided
  value: "https://leaftaps.com/opentaps/control/main",  // ← From 'input'
  timeout: 5000,
  retryable: true
}
```

**Decision Flow**:
- Check: `action.toLowerCase().includes('navigate')` → TRUE
- → Returns: `'navigate'`

---

### **Step 2: Fill Username**

```
Input:  {stepNumber: 2, action: "Enter username", input: "demosalesmanager"}
         ↓ (normalizeAction)
Output: {
  id: "e5f6g7h8-...",
  description: "Enter username",
  action: "fill",               // ← Regex match: contains 'enter'
  target: undefined,            // ← MISSING! (Problem area)
  value: "demosalesmanager",
  timeout: 6000,
  retryable: true
}
```

**Decision Flow**:
- Check: `includes('fill')` → FALSE
- Check: `includes('enter')` → TRUE
- → Returns: `'fill'`

**ISSUE**: No `target` provided, so Locator Discovery will need to:
1. Use element description "Enter username" to find field
2. Launch browser, navigate to URL
3. Search for username input field
4. Return discovered locator

---

### **Step 3: Fill Password**

```
Input:  {stepNumber: 3, action: "Enter password", input: "crmsfa"}
         ↓ (normalizeAction)
Output: {
  id: "i9j0k1l2-...",
  description: "Enter password",
  action: "fill",
  target: undefined,
  value: "crmsfa",
  timeout: 7000,
  retryable: true
}
```

---

### **Step 4: Click Button**

```
Input:  {stepNumber: 4, action: "Click login button", input: ""}
         ↓ (normalizeAction)
Output: {
  id: "m3n4o5p6-...",
  description: "Click login button",
  action: "click",              // ← Regex match: contains 'click'
  target: undefined,
  value: undefined,             // ← Empty input
  timeout: 8000,
  retryable: true
}
```

---

## Step 3: Assertion Parsing

### **Expected Result 1**

```
Input:  "User is successfully logged in"
         ↓ (detectMatcher)
Output: {
  id: "x1y2z3a4-...",
  description: "User is successfully logged in",
  actual: "",
  matcher: "visible",           // ← Regex match: contains 'logged' (no direct match, default "contains" would apply)
  expected: "User is successfully logged in"
}
```

**Decision Flow**:
- Text: "user is successfully logged in"
- Check: `includes('visible')` → FALSE
- Check: `includes('enabled')` → FALSE
- Check: `includes('contain')` → FALSE
- ... (no match)
- → Default: `'contains'`

**Note**: Would benefit from LLM here to better understand "logged in" = "successfully authenticated"

---

### **Expected Result 2**

```
Input:  "Dashboard page is displayed"
         ↓ (detectMatcher)
Output: {
  id: "b5c6d7e8-...",
  description: "Dashboard page is displayed",
  actual: "",
  matcher: "visible",           // ← Regex match: contains 'displayed'
  expected: "Dashboard page is displayed"
}
```

**Decision Flow**:
- Text: "dashboard page is displayed"
- Check: `includes('visible')` → FALSE
- Check: `includes('displayed')` → TRUE
- → Returns: `'visible'`

---

## Step 4: Complete TestMetadata Object

```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",  // ← Auto-generated UUID
  name: "User Login",
  description: undefined,
  steps: [
    // 4 parsed steps from above
  ],
  assertions: [
    // 2 parsed assertions from above
  ],
  testData: {},                 // ← Not provided
  locators: {},                 // ← Not provided
  tags: [],                     // ← Not provided
  priority: "medium",           // ← Default
  browsers: ["chrome"],         // ← Default
  preconditions: undefined,
  createdAt: "2026-04-12T12:00:00Z",
  updatedAt: "2026-04-12T12:00:00Z"
}
```

---

## Step 5: Script Generation

### **Step 1 - Navigate (Simple)**

```typescript
// Input metadata
{
  action: "navigate",
  value: "https://leaftaps.com/opentaps/control/main",
  timeout: 5000
}

// Output code
await page.goto("https://leaftaps.com/opentaps/control/main", 
                { waitUntil: 'networkidle' });
```

**No locator discovery needed** - URL is explicit

---

### **Step 2 - Fill Username (Uses Locator Discovery)**

```typescript
// Input metadata
{
  action: "fill",
  description: "Enter username",
  value: "demosalesmanager",
  target: undefined,  // ← Problem: No selector provided
  timeout: 6000
}

// Locator Discovery Process:
// 1. Page URL from Step 1: "https://leaftaps.com/opentaps/control/main"
// 2. Element description: "Enter username"
// 3. Action: "fill"

locatorDiscoveryService.discoverLocator({
  url: "https://leaftaps.com/opentaps/control/main",
  elementDescription: "Enter username",
  action: "fill"
})

// Browser Automation:
// 1. Launch Chromium
// 2. page.goto(url)
// 3. Try strategies in order:

// Strategy 1: getByRole() with description keyword
const textbox = page.getByRole('textbox', { name: /username/i });
if (textbox.count() > 0) {
  // FOUND! Return selector string
  return {
    selector: "getByRole('textbox', { name: /username/i })",
    method: 'role-textbox',
    confidence: 0.95
  };
}

// Strategy 2: getByPlaceholder()
const input = page.getByPlaceholder('Username');
if (input.count() > 0) {
  // FOUND! Return selector
  return {
    selector: "getByPlaceholder('Username')",
    method: 'placeholder',
    confidence: 0.85
  };
}

// ... continues for other strategies

// Result: {
//   selector: "getByPlaceholder('Username')",
//   method: 'placeholder',
//   confidence: 0.85
// }

// Output code:
const discoveredLocator = "getByPlaceholder('Username')";
const isPlaywrightApi = /^(getBy|locator)/.test(discoveredLocator); // TRUE

if (isPlaywrightApi) {
  // Direct Playwright API
  locatorAccessor = `page.${discoveredLocator}`;  // page.getByPlaceholder('Username')
} else {
  // CSS selector
  locatorAccessor = `page.locator("${selector}")`;
}

await page.getByPlaceholder('Username').fill("demosalesmanager", 
                                             { timeout: 6000 });
```

---

### **Step 3 - Fill Password (Similar to Step 2)**

```typescript
// Discovery finds: getByPlaceholder('Password')
await page.getByPlaceholder('Password').fill("crmsfa", 
                                             { timeout: 7000 });
```

---

### **Step 4 - Click Button (Uses Locator Discovery)**

```typescript
// Discovery might find:
// Option 1: getByRole('button', { name: /login/i })
// Option 2: getByTestId('login-button')
// Option 3: Falls back to input[type='submit']

// If discovery succeeds with getByRole:
await page.getByRole('button', { name: /login/i }).click({ timeout: 8000 });

// If discovery fails, uses fallback from parseSteps or default:
await page.locator("input[type='submit']").click({ timeout: 8000 });
```

---

## Step 6: Generated Test Script

**File**: `tests/ui/TC_004.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test('should User Login', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto("https://leaftaps.com/opentaps/control/main", 
                    { waitUntil: 'networkidle' });

    // Step 2: Enter username
    await page.getByPlaceholder('Username').fill("demosalesmanager", 
                                                  { timeout: 6000 });

    // Step 3: Enter password
    await page.getByPlaceholder('Password').fill("crmsfa", 
                                                 { timeout: 7000 });

    // Step 4: Click login button
    await page.getByRole('button', { name: /login/i }).click({ timeout: 8000 });

    // Assertions
    // "User is successfully logged in" → visible matcher
    await expect(page.locator(".dashboard, h1:has-text('Welcome')")).toBeVisible();

    // "Dashboard page is displayed" → visible matcher
    await expect(page.locator(".dashboard, [data-testid='dashboard']")).toBeVisible();
  });
});
```

---

## Summary: LLM Usage in Your Test Case

| Phase | Uses LLM? | Example from Your Test Case |
|-------|-----------|----------------------------|
| Field Mapping | ❌ NO | `stepNumber` → `stepNum` (direct mapping) |
| Action Detection | ❌ NO | "Enter username" → `fill` (regex: contains 'enter') |
| Matcher Detection | ❌ NO | "displayed" → `visible` (regex: contains 'displayed') |
| **Locator Discovery** | ❌ NO | Uses Playwright browser, not LLM |
| Code Generation | ❌ NO | Template-based (if-else statements) |
| **TOTAL LLM USAGE** | **❌ ZERO** | **All rule-based logic** |

---

## What You Should Know

### ✅ Works Well Without LLM
- Your test case format is clear and structured
- Actions are descriptive ("Enter username", "Click login button")
- Expected results are understandable
- Playwright Locator Discovery is very effective

### ⚠️ Potential Issues
1. **Missing `target` for steps** - System relies on discovery
   - If discovery fails, no fallback without target
   - **Solution**: Add CSS/XPath locators to steps

2. **Assertion matching** - Very basic (only "contains", "visible", etc.)
   - "User is successfully logged in" → Gets default matcher
   - **Solution**: Better regex or use LLM for semantic understanding

3. **Format mismatch** - Your field names don't match system expectations
   - **Solution**: Add adapter layer, or align your format

### ✨ Where LLM Would Help (Optional)
- Understanding complex action descriptions
- Better assertion selector generation
- Detecting and handling edge cases
- Validating test data (e.g., is "demosalesmanager" a valid format?)

### 🎯 Current Recommendation
**Use as-is** - System works without LLM. Add LLM only if:
- Step descriptions become very complex
- Assertions need semantic understanding
- You want intelligent test data validation
