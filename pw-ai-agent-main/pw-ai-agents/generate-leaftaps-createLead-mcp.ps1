# Generate Leaftaps CreateLead Test using MCP Backend
$body = Get-Content -Raw "test-data\TC_003-metadata.json"
$uri = "http://localhost:3000/api/v1/scripts/generate"

Write-Host "Generating Leaftaps createLead test via MCP backend..." -ForegroundColor Cyan
Write-Host "Test: TC_003 - CRMSFA Create Lead Flow (MCP)" -ForegroundColor Yellow
Write-Host "URL: https://leaftaps.com/crmsfa/control/main" -ForegroundColor Yellow
Write-Host "Credentials: demosalesmanager / crmsfa" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body $body

    if ($response.success) {
        Write-Host "Script generation completed successfully!" -ForegroundColor Green
        Write-Host "File saved: $($response.filePath)" -ForegroundColor Green

        if ($response.testCode) {
            Write-Host "`nGenerated Test Code:" -ForegroundColor Cyan
            Write-Host "====================" -ForegroundColor Cyan
            Write-Host $response.testCode
            Write-Host "====================" -ForegroundColor Cyan
        }

        Write-Host "`nTo run the test:" -ForegroundColor Yellow
        Write-Host "   npx playwright test tests/ui/TC_003.spec.ts --headed" -ForegroundColor White

    } else {
        Write-Error "Generation failed: $($response.error)"
        exit 1
    }

} catch {
    Write-Error "Error calling MCP backend: $($_.Exception.Message)"
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure backend is running: npm run dev" -ForegroundColor White
    Write-Host "2. Check MCP server is built: cd MCP && npm run build" -ForegroundColor White
    Write-Host "3. Verify MCP config in VS Code settings" -ForegroundColor White
    exit 1
}

Write-Host "`nMCP-powered test generation complete!" -ForegroundColor Green