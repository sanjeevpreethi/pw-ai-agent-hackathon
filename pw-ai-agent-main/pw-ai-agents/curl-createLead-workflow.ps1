# PowerShell script - Leaftaps CRMSFA Create Lead via cURL

Write-Host "=== Leaftaps CRMSFA - Create Lead Workflow ===" -ForegroundColor Cyan

# Store cookies between requests
$cookieJar = "$PSScriptRoot\cookies.txt"

# Step 1: Login
Write-Host "`n[Step 1] Logging into CRMSFA..." -ForegroundColor Yellow
$loginParams = @{
    Uri = "https://leaftaps.com/opentaps/control/main"
    Method = "POST"
    ContentType = "application/x-www-form-urlencoded"
    Body = "USERNAME=demosalesmanager&PASSWORD=crmsfa"
    SessionVariable = "session"
}
$loginResponse = Invoke-WebRequest @loginParams
Write-Host "✓ Login successful (Status: $($loginResponse.StatusCode))"

# Step 2: Fetch Create Lead Form
Write-Host "`n[Step 2] Fetching Create Lead Form..." -ForegroundColor Yellow
$formParams = @{
    Uri = "https://leaftaps.com/crmsfa/control/createLeadForm"
    Method = "GET"
    WebSession = $session
}
$formResponse = Invoke-WebRequest @formParams
Write-Host "✓ Form fetched (Status: $($formResponse.StatusCode))"

# Step 3: Submit Create Lead Form
Write-Host "`n[Step 3] Creating Lead..." -ForegroundColor Yellow

$leadData = @{
    companyName = "TechVision Solutions Inc"
    firstName = "Michael"
    lastName = "Johnson"
    localFirstName = "Mike"
    title = "Senior Business Development Manager"
    department = "Business Development"
    description = "High-priority prospect for Q2 2026. Referred by industry contact."
    primaryEmail = "michael.johnson@techvision.com"
    phoneNumber = "+1-555-0123"
    faxNumber = "+1-555-0124"
    generalStateProvinceGeoId = "CA"
    primaryPhoneType = "PHONE_WORK"
}

# Convert to form-encoded body
$bodyContent = ($leadData.GetEnumerator() | ForEach-Object {
    [System.Web.HttpUtility]::UrlEncode($_.Key) + "=" + [System.Web.HttpUtility]::UrlEncode($_.Value)
}) -join "&"

$createParams = @{
    Uri = "https://leaftaps.com/crmsfa/control/createLead"
    Method = "POST"
    ContentType = "application/x-www-form-urlencoded"
    Body = $bodyContent
    WebSession = $session
    OutFile = "lead-response.html"
}

$createResponse = Invoke-WebRequest @createParams
Write-Host "✓ Lead created (Status: $($createResponse.StatusCode))"

Write-Host "`n✅ Workflow completed successfully!" -ForegroundColor Green
Write-Host "Response saved to: lead-response.html"
Write-Host "`nLead Details:" -ForegroundColor Cyan
Write-Host "  Company: $($leadData.companyName)"
Write-Host "  Name: $($leadData.firstName) $($leadData.lastName)"
Write-Host "  Email: $($leadData.primaryEmail)"
Write-Host "  Phone: $($leadData.phoneNumber)"
