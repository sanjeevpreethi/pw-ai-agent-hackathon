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

    console.log('🧪 Generating proper Playwright test scripts...\n');

    // Test 1: Login Test with correct Step format
    console.log('Test 1: Generate "Login Test" (TC_LOGIN)');
    const loginTest = {
      testMetadata: {
        id: "TC_LOGIN",
        name: "User Login Test",
        description: "Test user login functionality",
        steps: [
          {
            id: "step_1",
            description: "Navigate to login page",
            action: "navigate",
            target: "http://leaftaps.com/opentaps/control/main",
            value: "http://leaftaps.com/opentaps/control/main",
            timeout: 5000
          },
          {
            id: "step_2",
            description: "Enter username",
            action: "fill",
            target: "input[name='USERNAME']",
            value: "demosalesmanager",
            timeout: 5000
          },
          {
            id: "step_3",
            description: "Enter password",
            action: "fill",
            target: "input[name='PASSWORD']",
            value: "crmsfa",
            timeout: 5000
          },
          {
            id: "step_4",
            description: "Click login button",
            action: "click",
            target: "input[type='submit']",
            timeout: 5000
          }
        ],
        assertions: [
          {
            id: "assert_1",
            description: "User is logged in",
            actual: ".dashboard",
            matcher: "visible",
            expected: ""
          }
        ],
        testData: {
          username: "demosalesmanager",
          password: "crmsfa"
        },
        locators: {
          usernameInput: "input[name='USERNAME']",
          passwordInput: "input[name='PASSWORD']",
          submitButton: "input[type='submit']"
        },
        tags: ["smoke", "login"],
        priority: "high",
        browsers: ["chromium"],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const resp1 = await makeRequest('/api/v1/scripts/generate', 'POST', loginTest, token);
    if (resp1.status === 200) {
      console.log('✓ Generated: ' + resp1.data.data.scriptPath);
      console.log('  Status: ' + resp1.data.data.validationStatus + '\n');
    } else {
      console.log('✗ Failed: ' + resp1.status);
      console.log(JSON.stringify(resp1.data, null, 2));
    }

    // Test 2: Shopping Cart Test
    console.log('Test 2: Generate "Shopping Cart Test" (TC_CART)');
    const cartTest = {
      testMetadata: {
        id: "TC_CART",
        name: "Add Item to Cart",
        description: "Test adding items to shopping cart",
        steps: [
          {
            id: "step_1",
            description: "Navigate to shop",
            action: "navigate",
            target: "",
            value: "http://example.com/shop",
            timeout: 5000
          },
          {
            id: "step_2",
            description: "Click product",
            action: "click",
            target: ".product-item",
            timeout: 5000
          },
          {
            id: "step_3",
            description: "Add to cart",
            action: "click",
            target: "button.add-to-cart",
            timeout: 5000
          }
        ],
        assertions: [
          {
            id: "assert_1",
            description: "Cart updated",
            actual: ".cart-count",
            matcher: "contains",
            expected: "1"
          }
        ],
        testData: {},
        locators: {},
        tags: ["e2e", "cart"],
        priority: "high",
        browsers: ["chromium"],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const resp2 = await makeRequest('/api/v1/scripts/generate', 'POST', cartTest, token);
    if (resp2.status === 200) {
      console.log('✓ Generated: ' + resp2.data.data.scriptPath);
      console.log('  Status: ' + resp2.data.data.validationStatus + '\n');
    } else {
      console.log('✗ Failed: ' + resp2.status);
      console.log(JSON.stringify(resp2.data, null, 2));
    }

    console.log('✅ Script generation complete!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();
