#!/usr/bin/env bash
# Bash script to generate the Leaftaps createLead test via the MCP backend
body=$(cat test-data/TC_003-createLead-metadata.json)
uri="http://localhost:3000/api/v1/scripts/generate"

echo "Posting createLead metadata to $uri..."

response=$(curl -s -X POST "$uri" \
  -H 'Content-Type: application/json' \
  -d "$body")

success=$(echo "$response" | python -c "import sys, json; print(json.load(sys.stdin).get('success'))")

if [ "$success" = "True" ] || [ "$success" = "true" ]; then
  echo "Script generated successfully"
  echo "$response" | python -c "import sys, json; data=json.load(sys.stdin); print(data.get('testCode', ''))" > tests/ui/TC_003.spec.ts
  echo "Updated tests/ui/TC_003.spec.ts with generated code."
else
  echo "Generation failed:"
  echo "$response" | python -c "import sys, json; data=json.load(sys.stdin); print(data.get('error', 'Unknown error'))"
  exit 1
fi
