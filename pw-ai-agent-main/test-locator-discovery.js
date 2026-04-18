const http = require('http');

function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000  // Increased timeout for locator discovery
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const request = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      request.write(JSON.stringify(data));
    }
    request.end();
  });
}

async function test() {
  try {
    const token = 'test-token-12345';

    console.log('🔍 Testing Playwright Locator Discovery...\n');
    console.log('Note: This will navigate to the URL and discover actual locators');
    console.log('(This may take 10-30 seconds)\n');

    // Test with user format
    const testData = {
      testMetadata: {
        id: "TC_LOCATOR_TEST",
        name: "Login with Discovered Locators",
        description: "Login using dynamically discovered locators",
        steps: [
          {
            stepNumber: 1,
            action: "Navigate",
            target: "https://leaftaps.com/opentaps/control/main",
            value: ""
          },
          {
            stepNumber: 2,
            action: "Fill",
            target: "[data-testid='username']",
            description: "username input field",  // Used for discovery
            value: "demosalesmanager"
          },
          {
            stepNumber: 3,
            action: "Fill",
            target: "[data-testid='password']",
            description: "password field",  // Used for discovery
            value: "crmsfa"
          },
          {
            stepNumber: 4,
            action: "Click",
            target: "[data-testid='login-btn']",
            description: "login button",  // Used for discovery
            value: ""
          }
        ],
        assertions: [
          {
            type: "url",
            matcher: "contains",
            expected: "dashboard"
          }
        ],
        testData: {},
        locators: {},
        tags: ["login"],
        priority: "high",
        browsers: ["chromium"],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    console.log('⏳ Sending request (discovering locators, this will take a while)...\n');
    const response = await makeRequest('/api/v1/scripts/generate', 'POST', testData, token);
    
    if (response.status === 200 && response.data.data) {
      console.log('✅ Script generated with discovered locators!\n');
      console.log('File: ' + response.data.data.scriptPath);
      console.log('Status: ' + response.data.data.validationStatus);
      console.log('\n━━━ Generated Code ━━━\n');
      console.log(response.data.data.generatedScript);
      console.log('\n✨ Notice: Locators may be discovered using:');
      console.log('   - getByRole() [WCAG compliant]');
      console.log('   - getByTestId() [testid attribute]');
      console.log('   - getByPlaceholder() [input placeholders]');
      console.log('   - getByLabel() [for labels]');
      console.log('   - locator() [CSS selectors as fallback]');
    } else {
      console.log('❌ Failed to generate script');
      console.log('Status:', response.status);
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();
