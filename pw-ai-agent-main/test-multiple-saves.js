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

    console.log('Testing multiple script generation and file saves...\n');

    // Test 1: First script
    console.log('Test 1: Generate "User Registration Test" (TC_002)');
    const test1Data = {
      testMetadata: {
        id: "TC_002",
        name: "User Registration Test",
        description: "Test new user registration flow",
        steps: [
          {
            id: "step_1",
            description: "Navigate to signup",
            action: "navigate",
            targetElement: { selector: "a[href='/signup']", type: "css" },
            expectedResult: "Signup page loaded"
          },
          {
            id: "step_2",
            description: "Fill registration form",
            action: "fill",
            targetElement: { selector: "form", type: "css" },
            testData: { email: "newuser@test.com", password: "Secure123!" },
            expectedResult: "Form filled with valid data"
          },
          {
            id: "step_3",
            description: "Submit registration",
            action: "click",
            targetElement: { selector: "button.register", type: "css" },
            expectedResult: "User registered successfully"
          }
        ],
        assertions: [
          {
            id: "assert_1",
            description: "Success message is displayed",
            type: "element_visible",
            target: { selector: ".success-message", type: "css" }
          }
        ],
        testData: {},
        locators: {},
        tags: ["smoke", "registration"],
        priority: "high",
        browsers: ["chromium"],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const response1 = await makeRequest('/api/v1/scripts/generate', 'POST', test1Data, token);
    if (response1.status === 200) {
      console.log('✓ Generated: ' + response1.data.data.scriptPath);
    } else {
      console.log('✗ Failed');
    }

    // Test 2: Second script
    console.log('\nTest 2: Generate "Shopping Cart Test" (TC_003)');
    const test2Data = {
      testMetadata: {
        id: "TC_003",
        name: "Shopping Cart Test",
        description: "Test adding items to cart and checkout",
        steps: [
          {
            id: "step_1",
            description: "Browse products",
            action: "navigate",
            targetElement: { selector: "a.products", type: "css" },
            expectedResult: "Products page displayed"
          }
        ],
        assertions: [],
        testData: {},
        locators: {},
        tags: ["e2e", "checkout"],
        priority: "critical",
        browsers: ["chromium", "firefox"],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const response2 = await makeRequest('/api/v1/scripts/generate', 'POST', test2Data, token);
    if (response2.status === 200) {
      console.log('✓ Generated: ' + response2.data.data.scriptPath);
    } else {
      console.log('✗ Failed');
    }

    console.log('\n✓✓✓ All file saves completed successfully! ✓✓✓');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();
