# Leaftaps E2E Test Generation - PowerShell Script
# This script sends a test generation request to the backend API
# and generates an accessibility-first Playwright test for the Leaftaps login

# ============================================================
# Configuration
# ============================================================
$API_URL = "http://localhost:3000/api/v1/scripts/generate"
$AUTH_TOKEN = "your-auth-token-here"  # Replace with your token if needed

# ============================================================
# Test Metadata for Leaftaps Login
# ============================================================
$testMetadata = @{
    testMetadata = @{
        id = "TC_002"
        name = "Leaftaps User Login"
        description = "Test user login functionality on leaftaps.com"
        steps = @(
            @{
                stepNumber = 1
                action = "Navigate"
                target = "https://leaftaps.com/opentaps/control/main"
                value = ""
            },
            @{
                stepNumber = 2
                action = "Fill"
                target = "Username Input"
                value = "demosalesmanager"
            },
            @{
                stepNumber = 3
                action = "Fill"
                target = "Password Input"
                value = "crmsfa"
            },
            @{
                stepNumber = 4
                action = "Click"
                target = "Login Button"
                value = ""
            }
        )
        assertions = @(
            @{
                type = "url"
                matcher = "contains"
                expected = "main"
            },
            @{
                type = "element"
                matcher = "visible"
                expected = "Logout Button"
            },
            @{
                type = "text"
                matcher = "contains"
                expected = "Sales Manager"
            }
        )
    }
}

# Convert to JSON
$jsonBody = $testMetadata | ConvertTo-Json -Depth 10

# ============================================================
# Display Request Information
# ============================================================
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Leaftaps E2E Test Generation via cURL                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 API Endpoint: $API_URL" -ForegroundColor Green
Write-Host "🔐 Auth Token: $($AUTH_TOKEN.Substring(0, [Math]::Min(20, $AUTH_TOKEN.Length)))..." -ForegroundColor Green
Write-Host ""
Write-Host "📊 Test Metadata:" -ForegroundColor Yellow
Write-Host $jsonBody -ForegroundColor Gray
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Make the API Request
# ============================================================
Write-Host "🚀 Sending request to API..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $API_URL `
        -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
            'Authorization' = "Bearer $AUTH_TOKEN"
        } `
        -Body $jsonBody `
        -ErrorAction Stop

    $httpCode = $response.StatusCode
    $body = $response.Content | ConvertFrom-Json
} catch {
    $httpCode = $_.Exception.Response.StatusCode.Value
    $body = $_.Exception.Response.Content | ConvertFrom-Json
}

# ============================================================
# Display Response
# ============================================================
Write-Host "Response Status Code: $httpCode" -ForegroundColor Yellow
Write-Host ""

if ($httpCode -eq 200) {
    Write-Host "✅ SUCCESS! Test script generated successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "📄 Response Details:" -ForegroundColor Green
    
    # Display locator mappings
    if ($body.locators) {
        Write-Host ""
        Write-Host "🔍 Locator Mappings:" -ForegroundColor Cyan
        $body.locators | ForEach-Object {
            Write-Host "  Step $($_.step):" -ForegroundColor Yellow
            Write-Host "    Old: $($_.oldLocator)" -ForegroundColor Gray
            Write-Host "    New: $($_.newLocator)" -ForegroundColor Green
            Write-Host "    Strategy: $($_.strategy)" -ForegroundColor Cyan
        }
    }
    
    # Display execution log
    if ($body.executionLog) {
        Write-Host ""
        Write-Host "📊 Execution Log:" -ForegroundColor Cyan
        $body.executionLog | ForEach-Object {
            Write-Host "  Step $($_.step): $($_.action)" -ForegroundColor Yellow
            Write-Host "    Duration: $($_.duration)ms" -ForegroundColor Gray
            Write-Host "    Result: $($_.result)" -ForegroundColor Green
        }
    }
    
    # Save files
    Write-Host ""
    Write-Host "💾 Saving generated artifacts..." -ForegroundColor Cyan
    
    # Ensure directory exists
    if (-not (Test-Path "tests/ui")) {
        New-Item -ItemType Directory -Path "tests/ui" -Force | Out-Null
    }
    
    # Save test code
    if ($body.testCode) {
        $body.testCode | Out-File -FilePath "tests/ui/TC_002.spec.ts" -Encoding UTF8
        Write-Host "✅ Test code saved to: tests/ui/TC_002.spec.ts" -ForegroundColor Green
    }
    
    # Save locator mappings
    if ($body.locators) {
        $body.locators | ConvertTo-Json -Depth 10 | Out-File -FilePath "tests/ui/TC_002-locators.json" -Encoding UTF8
        Write-Host "✅ Locator mappings saved to: tests/ui/TC_002-locators.json" -ForegroundColor Green
    }
    
    # Save execution log
    if ($body.executionLog) {
        $body.executionLog | ConvertTo-Json -Depth 10 | Out-File -FilePath "tests/ui/TC_002-execution.json" -Encoding UTF8
        Write-Host "✅ Execution log saved to: tests/ui/TC_002-execution.json" -ForegroundColor Green
    }
    
    # Save accessibility snapshot
    if ($body.accessibilitySnapshot) {
        $body.accessibilitySnapshot | Out-File -FilePath "tests/ui/TC_002-accessibility.txt" -Encoding UTF8
        Write-Host "✅ Accessibility snapshot saved to: tests/ui/TC_002-accessibility.txt" -ForegroundColor Green
    }
} else {
    Write-Host "❌ FAILED! HTTP Status: $httpCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Response:" -ForegroundColor Red
    Write-Host ($body | ConvertTo-Json) -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review the generated test: tests/ui/TC_002.spec.ts" -ForegroundColor Cyan
Write-Host "2. Check accessibility snapshot: tests/ui/TC_002-accessibility.txt" -ForegroundColor Cyan
Write-Host "3. View locator mappings: tests/ui/TC_002-locators.json" -ForegroundColor Cyan
Write-Host "4. Run the test: npx playwright test tests/ui/TC_002.spec.ts" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
