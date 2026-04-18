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
      timeout: 5000
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
    // Use a dummy token for auth
    const token = 'test-token-12345';

    // Test health endpoint first
    console.log('Testing health endpoint...');
    const health = await makeRequest('/health');
    console.log('✓ Health:', health.status, health.data.status);

    // Then test generate endpoint with auth token
    console.log('\nTesting script generation endpoint...');
    const testData = {
      testMetadata: {
        id: "TC_001",
        name: "User Login Test",
        description: "Test user login functionality",
        steps: [
          {
            id: "step_1",
            description: "Navigate to login page",
            action: "click",
            targetElement: { selector: "a[href='/login']", type: "css" },
            expectedResult: "Login page is displayed"
          },
          {
            id: "step_2",
            description: "Enter credentials",
            action: "fill",
            targetElement: { selector: "input[type='email']", type: "css" },
            testData: { email: "test@example.com", password: "password123" },
            expectedResult: "Fields are populated"
          },
          {
            id: "step_3",
            description: "Submit login form",
            action: "click",
            targetElement: { selector: "button[type='submit']", type: "css" },
            expectedResult: "User is logged in"
          }
        ],
        assertions: [
          {
            id: "assert_1",
            description: "User dashboard is visible",
            type: "element_visible",
            target: { selector: ".dashboard", type: "css" }
          }
        ],
        testData: {
          email: "test@example.com",
          password: "password123"
        },
        locators: {
          loginButton: { selector: "button.login", type: "css" },
          emailInput: { selector: "input[type='email']", type: "css" },
          dashboard: { selector: ".dashboard", type: "css" }
        },
        tags: ["smoke", "login", "critical"],
        priority: "high",
        browsers: ["chromium"],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const response = await makeRequest('/api/v1/scripts/generate', 'POST', testData, token);
    console.log('Status:', response.status);
    
    if (response.status === 200 && response.data.data.scriptPath) {
      console.log('✓ Script generated and saved!');
      console.log('  - Test ID:', response.data.data.testId);
      console.log('  - Script saved to:', response.data.data.scriptPath);
      console.log('  - Validation status:', response.data.data.validationStatus);
      console.log('\n✓✓✓ File save functionality WORKING! ✓✓✓');
    } else {
      console.log('✗ Failed to generate script');
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();
