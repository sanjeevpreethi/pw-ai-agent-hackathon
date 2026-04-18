# Test Case Flow Analysis

## Your Input Format
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

---

## System Expected Format

The backend expects `RawTestCase` format (slightly different from your input):

```typescript
interface RawTestCase {
  testCaseId: string;        // ✓ You have this
  testName: string;          // ✓ You have this
  description?: string;      // ✗ Optional, you don't have
  preconditions?: string;    // ✗ Optional, you don't have
  steps: Array<{             // ✓ Similar but field names differ
    stepNum: number;         // Your: stepNumber → Maps to stepNum
    action: string;          // ✓ You have this
    testData?: string;       // Your: input → Maps to testData
    target?: string;         // ✗ You don't have (needed for locators)
  }>;
  expectedResults: string[]; // ✓ You have this
  testData: TestData;        // ✗ Optional - additional test data object
  locatorHints?: LocatorMap; // ✗ Optional - CSS/XPath selectors
  browsers?: Browser[];      // ✗ Optional - defaults to ['chrome']
  priority?: PriorityLevel;  // ✗ Optional - defaults to 'medium'
  tags?: string[];           // ✗ Optional - you don't have
}
```

---

## Current Flow: Step-by-Step

### **STEP 1: API Call to `/api/test-cases/upload` (Backend Endpoint)**

**Endpoint**: `POST /api/test-cases/upload`

Your input is transformed into the backend format. The parser handles field name mismatches:
- `stepNumber` → `stepNum` (requires field name mapping)
- `input` → `testData` (mapping needed)
- `action` → Parsed to extract action type (e.g., "Enter username" → action: "fill")

### **STEP 2: Test Case Parsing (No LLM - Rule-based)**

**Component**: `testCaseParser.parseSteps()`

Each step is processed with pattern matching:

```typescript
// Your step input:
{
  "stepNumber": 2,
  "action": "Enter username",
  "input": "demosalesmanager"
}

// Gets normalized to:
{
  id: "uuid-...",
  description: "Enter username",
  action: "fill",               // ← Detected from action text using normalizeAction()
  target: undefined,            // ← MISSING! Not provided in your input
  value: "demosalesmanager",    // ← From 'input' field
  timeout: 6000,                // ← Auto-calculated
  retryable: true
}
```

**Action Normalization Logic** (Rule-based, NO LLM):
```typescript
private normalizeAction(action: string): ActionType {
  const normalized = action.toLowerCase();
  
  if (normalized.includes('navigate') || normalized.includes('go to')) 
    return 'navigate';
  if (normalized.includes('click')) 
    return 'click';
  if (normalized.includes('fill') || normalized.includes('enter') || normalized.includes('type')) 
    return 'fill';
  if (normalized.includes('select')) 
    return 'select';
  // ... more patterns
  return 'execute'; // default
}
```

### **STEP 3: Assertion Parsing (No LLM - Pattern Detection)**

Your expected results:
```json
[
  "User is successfully logged in",
  "Dashboard page is displayed"
]
```

Become assertions with matcher detection (rule-based):
```typescript
// Assertion 1
{
  id: "uuid-...",
  description: "User is successfully logged in",
  matcher: "visible",        // ← Detected from "logged in" keyword
  actual: "",
  expected: "User is successfully logged in"
}

// Assertion 2
{
  id: "uuid-...",
  description: "Dashboard page is displayed",
  matcher: "visible",        // ← Detected from "displayed" keyword
  actual: "",
  expected: "Dashboard page is displayed"
}
```

**Matcher Detection Logic** (Rule-based, NO LLM):
```typescript
private detectMatcher(result: string): string {
  const text = result.toLowerCase();
  
  if (text.includes('visible') || text.includes('displayed')) 
    return 'visible';
  if (text.includes('enabled')) 
    return 'enabled';
  if (text.includes('contain') || text.includes('show')) 
    return 'contains';
  // ... more patterns
  return 'contains'; // default
}
```

### **STEP 4: Test Metadata Creation (No LLM)**

TestMetadata object is created:
```typescript
TestMetadata {
  id: "uuid-...",
  name: "User Login",
  description: undefined,      // Not provided
  steps: [/*4 parsed steps*/],
  assertions: [/*2 assertions*/],
  testData: {},
  locators: {},
  browsers: ['chrome'],
  priority: 'medium',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### **STEP 5: Script Generation (Uses Playwright Locator Discovery)**

**Component**: `scriptGenerator.generate(metadata)`

For each step, the system:

1. **If action is 'navigate'**:
   ```typescript
   // No locator discovery needed
   await page.goto("https://leaftaps.com/opentaps/control/main", 
                   { waitUntil: 'networkidle' });
   ```

2. **If action is 'fill' or 'click'**:
   - Attempts to use **Playwright Locator Discovery** service
   - Launches headless Chromium browser
   - Navigates to page URL
   - Searches for element using 5 strategies:
     - `getByRole()` - WCAG compliant (confidence: 95%)
     - `getByTestId()` - test IDs (confidence: 90%)
     - `getByPlaceholder()` - input placeholders
     - `getByLabel()` - associated labels
     - `getByAriaLabel()` - ARIA attributes
   
   **No LLM involved** - Playwright browser tests actual page

3. **Fallback**: If discovery fails, uses provided `target` or generates CSS selector

```typescript
// For your step: "Enter username" with input "demosalesmanager"
// With Playwright Locator Discovery enabled:

const discovery = await locatorDiscoveryService.discoverLocator({
  url: "https://leaftaps.com/opentaps/control/main",
  elementDescription: "Enter username",
  action: "fill"
});

// Returns: { 
//   selector: "getByPlaceholder('Username')",
//   method: 'placeholder',
//   confidence: 0.85
// }

// Generated code:
await page.getByPlaceholder('Username').fill("demosalesmanager", 
                                             { timeout: 6000 });
```

### **STEP 6: Generated Test Script Output**

Final TypeScript test file: `tests/ui/TC_004.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test('should User Login', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto("https://leaftaps.com/opentaps/control/main", 
                    { waitUntil: 'networkidle' });
    
    // Step 2: Enter username
    // Discovered locator via Playwright MCP
    await page.getByPlaceholder('Username').fill("demosalesmanager", 
                                                  { timeout: 6000 });
    
    // Step 3: Enter password
    await page.getByPlaceholder('Password').fill("crmsfa", 
                                                 { timeout: 7000 });
    
    // Step 4: Click login button
    // If Playwright detection fails, would use fallback
    await page.locator("input[type='submit']").click({ timeout: 8000 });

    // Assertions generated from expected results
    await expect(page.locator("//h1 | .dashboard")).toBeVisible();
    await expect(page).toHaveURL(/.*dashboard.*/);
  });
});
```

---

## LLM Usage Analysis

### **Current Status: NO LLM USED**

| Phase | Component | Uses LLM? | How It Works |
|-------|-----------|-----------|-------------|
| 1. Test Case Upload | `uploadTestCases()` | ❌ NO | Direct field mapping |
| 2. Step Parsing | `testCaseParser.parseSteps()` | ❌ NO | Regex pattern matching (e.g., `includes('fill')`) |
| 3. Action Normalization | `normalizeAction()` | ❌ NO | `if/else` rules for action detection |
| 4. Assertion Detection | `detectMatcher()` | ❌ NO | Keyword matching (e.g., `includes('visible')`) |
| 5. Locator Discovery | `locatorDiscoveryService` | ❌ NO | Playwright browser automation testing 5 strategies |
| 6. Script Generation | `scriptGenerator.generate()` | ❌ NO | Template-based code generation |
| 7. Script Validation | `scriptValidator.validate()` | ❌ NO | TypeScript compilation check |

### **Where LLM COULD Be Used**

1. **Improved Action Normalization** ✨
   - Current: "Enter username" → "fill" (rule-based)
   - With LLM: Better contextual understanding of complex actions
   - Example: "Type admin in the password field" → fill, admin, password field

2. **Locator Hinting from Action Description** ✨
   - Current: Must have `target` field for CSS selectors
   - With LLM: "Enter username" → Could suggest username input field
   - But Playwright Discovery already solves this

3. **Assertion Generation from Expected Results** ✨
   - Current: "Dashboard page is displayed" → matcher: "visible"
   - With LLM: Better understanding of what selector to use
   - But again, Playwright Discovery helps here

4. **Smart Test Data Extraction** ✨
   - Current: Just uses provided `input` value literally
   - With LLM: Could detect sensitive data, generate variations
   - Example: Could suggest "demosalesmanager" stays as-is vs generating test accounts

5. **Locator Discovery Fallback** ✨
   - Current: Tries 5 Playwright strategies, then uses provided target
   - With LLM: Could ask "Based on this page HTML, find the login button"
   - But this defeats the purpose of using Playwright browser

---

## Recommended Flow Enhancement Path

### **Current Flow** (No LLM, Fast, Deterministic)
```
Your Input → Field Mapping → Rule-based Parsing → 
Playwright Locator Discovery → Code Generation
```

### **With LLM Enhancement** (Optional)
```
Your Input → Field Mapping → LLM-based Parsing → 
Playwright Locator Discovery → Code Generation
```

**LLM would be beneficial for:**
1. **Flexible Action Parsing** - Understand complex descriptions
2. **Test Data Validation** - Detect if data needs encryption/masking
3. **Assertion Optimization** - Choose best selectors for assertions

**LLM NOT needed for:**
1. Locator finding (Playwright browser does this)
2. Code generation (Templates work well)
3. Validation (Compilation is sufficient)

---

## Next Steps

### To Use Your Test Case Format:

1. **Option A: Transform Your Format First**
   ```json
   // Change your format to match RawTestCase
   {
     "testCaseId": "TC_004",
     "testName": "User Login",
     "steps": [
       {
         "stepNum": 1,           // Change: stepNumber → stepNum
         "action": "Navigate to login page",
         "testData": "https://leaftaps.com/opentaps/control/main"  // Change: input → testData
       },
       // ... rest of steps
     ],
     "expectedResults": ["User is successfully logged in", "..."],
     "testData": {},
     "locatorHints": {}          // Add CSS/XPath hints if available
   }
   ```

2. **Option B: Add Adapter in Backend**
   - Create step in `generation.ts` to transform your format
   - Map `stepNumber` → `stepNum`
   - Map `input` → `testData`
   - Infer `target` from action description (optional)

3. **Option C: Add LLM Service**
   - Create `locatorSuggestionService` using LLM
   - For "Enter username" → Suggest `input[name='USERNAME']` selector
   - Improves locator discovery fallback

---

## Key Findings

✅ **System is rule-based, NOT using LLM**
✅ **Locator discovery uses Playwright browser, not AI**
✓ **Your test case format is close, needs field name mapping**
✓ **LLM would improve but not required**
◊ **Suggested enhancement: Add simple format adapter**
