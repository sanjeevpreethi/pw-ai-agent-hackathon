# Quick Start Guide

## One-Time Setup

```bash
cd pw-ai-agents

# Install all dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Run Automation

```bash
# Basic usage
npm run automate -- "Your automation goal" "https://target-url.com"

# Example 1: Form Submission
npm run automate -- "Fill email with 'test@example.com' and password with 'pass123' then click submit" "https://example.com/login"

# Example 2: Search
npm run automate -- "Search for 'automation testing' and click first result" "https://google.com"

# Example 3: Multi-step Navigation
npm run automate -- "Click Products menu, select Electronics category, sort by price" "https://shop.example.com"
```

## Output Files

After automation completes, you'll get:

- **`generated-test.ts`** - Ready-to-use Playwright test code
- **`execution-log.json`** - Detailed execution log with timing

## Example Full Command

```bash
npm run automate -- "Login to the application with email 'john@example.com' and any password, then click the profile button" "https://demo-app.example.com"
```

## What Happens

1. ✅ Browser opens (headless: false - visible)
2. ✅ Navigates to the provided URL
3. ✅ Analyzes page structure (accessibility tree)
4. ✅ Sends to Claude AI for analysis
5. ✅ Executes each action step-by-step
6. ✅ If action fails, LLM suggests alternative selector
7. ✅ Retries up to 3 times with different strategies
8. ✅ Generates professional Playwright test code
9. ✅ Saves execution log with timings

## Key Features

✨ **Intelligent Selectors**
- Uses accessibility-first approach
- Role-based, label-based, text-based selectors
- Automatically adapts when selector fails

✨ **LLM-Powered**
- Claude 3.5 Sonnet analyzes the page
- Understands complex UI structures
- Makes intelligent decisions about next steps

✨ **Professional Output**
- Clean, maintainable test code
- Proper assertions
- Detailed execution logs
- Professional formatting

✨ **Error Handling**
- Automatic retry with alternative selectors
- Captures current page state on failure
- Detailed error messages

## Troubleshooting

**"Cannot find package '@cfworker/json-schema'"**
```bash
# Run this in MCP folder
cd ../MCP
npm install @cfworker/json-schema
```

**"ANTHROPIC_API_KEY not found"**
```bash
# Set API key
export ANTHROPIC_API_KEY="sk-ant-..."
```

**"Browser won't launch"**
```bash
# Reinstall Playwright browsers
npx playwright install chromium
```

**"Selector not found in generated test"**
This means the page structure was different. You can:
1. Manually update the selector in the test
2. Re-run automation with more specific instructions

## Typical Workflow

```
1. Run automation with your goal
2. Review generated test in generated-test.ts
3. Check execution log in execution-log.json
4. Add to your test suite: cp generated-test.ts tests/ui/my-test.ts
5. Run with npm run test
6. Commit to version control
```

## Advanced: Chain Multiple Automations

```bash
# First automation
npm run automate -- "Login" "https://example.com/login"

# Then manually run the generated test
npm run test:ui

# Create new tests by combining generated code
```

## Need More Examples?

Check `AUTOMATION_GUIDE.md` for detailed documentation.
