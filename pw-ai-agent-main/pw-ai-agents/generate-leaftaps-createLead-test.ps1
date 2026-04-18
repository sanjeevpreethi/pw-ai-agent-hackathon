# PowerShell script to generate the Leaftaps createLead test via the MCP backend
$body = Get-Content -Raw "test-data\TC_003-createLead-metadata.json"
$uri = "http://localhost:3000/api/v1/scripts/generate"

Write-Host "Posting createLead metadata to $uri..."

$response = Invoke-RestMethod -Uri $uri -Method Post -ContentType 'application/json' -Body $body

if ($response.success) {
    Write-Host "Script generated successfully: $($response.filePath)"
    if ($response.testCode) {
        $response.testCode | Out-File -FilePath "tests\ui\TC_003.spec.ts" -Encoding utf8
        Write-Host "Updated tests\ui\TC_003.spec.ts with generated code."
    }
} else {
    Write-Error "Generation failed: $($response.error)"
}
