#!/usr/bin/env bash
# Leaftaps CRMSFA - Create Lead via cURL
# This script demonstrates HTTP requests for lead creation workflow

# Step 1: Login and get session
echo "=== Step 1: Login to CRMSFA ==="
curl -v -X POST https://leaftaps.com/opentaps/control/main \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "USERNAME=demosalesmanager&PASSWORD=crmsfa" \
  -c cookies.txt \
  -L

# Step 2: Navigate to Create Lead Form (GET request to fetch form)
echo -e "\n\n=== Step 2: Fetch Create Lead Form ==="
curl -v -X GET https://leaftaps.com/crmsfa/control/createLeadForm \
  -b cookies.txt

# Step 3: Submit Create Lead Form
echo -e "\n\n=== Step 3: Submit Create Lead Form ==="
curl -v -X POST https://leaftaps.com/crmsfa/control/createLead \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "companyName=TechVision%20Solutions%20Inc&firstName=Michael&lastName=Johnson&localFirstName=Mike&title=Senior%20Business%20Development%20Manager&department=Business%20Development&description=High-priority%20prospect%20for%20Q2%202026.%20Referred%20by%20industry%20contact.&primaryEmail=michael.johnson@techvision.com&phoneNumber=%2B1-555-0123&faxNumber=%2B1-555-0124&generalStateProvinceGeoId=CA&primaryPhoneType=PHONE_WORK" \
  -b cookies.txt \
  -L \
  -o lead-response.html

echo -e "\n\n✅ Lead creation workflow completed"
echo "Response saved to: lead-response.html"
