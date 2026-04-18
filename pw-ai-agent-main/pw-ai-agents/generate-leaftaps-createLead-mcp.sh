#!/usr/bin/env bash
# Generate Leaftaps CreateLead Test using MCP Backend

body=$(cat test-data/TC_003-metadata.json)
uri="http://localhost:3000/api/v1/scripts/generate"

echo "🚀 Generating Leaftaps createLead test via MCP backend..."
echo "📋 Test: TC_003 - CRMSFA Create Lead Flow (MCP)"
echo "🌐 URL: https://leaftaps.com/crmsfa/control/main"
echo "👤 Credentials: demosalesmanager / crmsfa"
echo ""

response=$(curl -s -X POST "$uri" \
  -H 'Content-Type: application/json' \
  -d "$body")

success=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")

if [ "$success" = "True" ] || [ "$success" = "true" ]; then
    echo "✅ Script generation completed successfully!"

    filePath=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('filePath', 'Unknown'))" 2>/dev/null)
    echo "📁 File saved: $filePath"

    testCode=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('testCode', ''))" 2>/dev/null)
    if [ -n "$testCode" ]; then
        echo ""
        echo "📝 Generated Test Code:"
        echo "===================="
        echo "$testCode"
        echo "===================="
    fi

    echo ""
    echo "▶️  To run the test:"
    echo "   npx playwright test tests/ui/TC_003.spec.ts --headed"

else
    echo "❌ Generation failed:"
    error=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('error', 'Unknown error'))" 2>/dev/null)
    echo "   $error"

    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Ensure backend is running: npm run dev"
    echo "2. Check MCP server is built: cd MCP && npm run build"
    echo "3. Verify MCP config in VS Code settings"
    exit 1
fi

echo ""
echo "🎉 MCP-powered test generation complete!"