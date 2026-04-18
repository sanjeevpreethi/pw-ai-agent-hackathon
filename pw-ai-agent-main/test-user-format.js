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
    const token = 'test-token-12345';

    console.log('🧪 Testing with user input format...\n');

    // Test with exact format from user's curl command
    const testData = {
      testMetadata: {
        id: "TC_002",
        name: "User Login",
        description: "Test user login functionality",
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
            value: "demosalesmanager"
          },
          {
            stepNumber: 3,
            action: "Fill",
            target: "[data-testid='password']",
            value: "crmsfa"
          },
          {
            stepNumber: 4,
            action: "Click",
            target: "[data-testid='login-btn']",
            value: ""
          }
        ],
        assertions: [
          {
            type: "url",
            matcher: "contains",
            expected: "dashboard"
          },
          {
            type: "text",
            matcher: "equals",
            expected: "Welcome"
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

    const response = await makeRequest('/api/v1/scripts/generate', 'POST', testData, token);
    
    if (response.status === 200 && response.data.data) {
      console.log('✅ Script generated successfully!\n');
      console.log('File: ' + response.data.data.scriptPath);
      console.log('Status: ' + response.data.data.validationStatus);
      console.log('\n━━━ Generated Code ━━━\n');
      console.log(response.data.data.generatedScript);
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
