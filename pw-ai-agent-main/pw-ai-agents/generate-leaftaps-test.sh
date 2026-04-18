#!/bin/bash

# Leaftaps E2E Test Generation - cURL Script
# This script sends a test generation request to the backend API
# and generates an accessibility-first Playwright test for the Leaftaps login

# ============================================================
# Configuration
# ============================================================
API_URL="http://localhost:3000/api/v1/scripts/generate"
AUTH_TOKEN="your-auth-token-here"  # Replace with your token if needed

# ============================================================
# Test Metadata for Leaftaps Login
# ============================================================
TEST_METADATA=$(cat <<'EOF'
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
EOF
)

# ============================================================
# Display Request Information
# ============================================================
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Leaftaps E2E Test Generation via cURL                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 API Endpoint: $API_URL"
echo "🔐 Auth Token: ${AUTH_TOKEN:0:20}..."
echo ""
echo "📊 Test Metadata:"
echo "$TEST_METADATA" | jq '.' 2>/dev/null || echo "$TEST_METADATA"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# ============================================================
# Make the API Request
# ============================================================
echo "🚀 Sending request to API..."
echo ""

RESPONSE=$(curl --location "$API_URL" \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --data "$TEST_METADATA" \
  --write-out "\n%{http_code}" \
  2>/dev/null)

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract response body (everything except last line)
BODY=$(echo "$RESPONSE" | sed '$d')

# ============================================================
# Display Response
# ============================================================
echo "Response Status Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ SUCCESS! Test script generated successfully"
  echo ""
  echo "📄 Response Body:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  
  # Extract and save the test code
  TEST_CODE=$(echo "$BODY" | jq -r '.testCode' 2>/dev/null)
  if [ ! -z "$TEST_CODE" ] && [ "$TEST_CODE" != "null" ]; then
    echo "$TEST_CODE" > tests/ui/TC_002.spec.ts
    echo "✅ Test code saved to: tests/ui/TC_002.spec.ts"
  fi
  
  # Extract and save locator mappings
  LOCATORS=$(echo "$BODY" | jq '.locators' 2>/dev/null)
  if [ ! -z "$LOCATORS" ] && [ "$LOCATORS" != "null" ]; then
    echo "$LOCATORS" > tests/ui/TC_002-locators.json
    echo "✅ Locator mappings saved to: tests/ui/TC_002-locators.json"
  fi
  
  # Extract and save execution log
  EXEC_LOG=$(echo "$BODY" | jq '.executionLog' 2>/dev/null)
  if [ ! -z "$EXEC_LOG" ] && [ "$EXEC_LOG" != "null" ]; then
    echo "$EXEC_LOG" > tests/ui/TC_002-execution.json
    echo "✅ Execution log saved to: tests/ui/TC_002-execution.json"
  fi
  
  # Extract and save accessibility snapshot
  A11Y=$(echo "$BODY" | jq -r '.accessibilitySnapshot' 2>/dev/null)
  if [ ! -z "$A11Y" ] && [ "$A11Y" != "null" ]; then
    echo "$A11Y" > tests/ui/TC_002-accessibility.txt
    echo "✅ Accessibility snapshot saved to: tests/ui/TC_002-accessibility.txt"
  fi
  
else
  echo "❌ FAILED! HTTP Status: $HTTP_CODE"
  echo ""
  echo "Error Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Next Steps:"
echo "1. Review the generated test: tests/ui/TC_002.spec.ts"
echo "2. Check accessibility snapshot: tests/ui/TC_002-accessibility.txt"
echo "3. View locator mappings: tests/ui/TC_002-locators.json"
echo "4. Run the test: npx playwright test tests/ui/TC_002.spec.ts"
echo "════════════════════════════════════════════════════════════"
