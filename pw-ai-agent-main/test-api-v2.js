const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
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
    // Test health endpoint first
    console.log('Testing health endpoint...');
    const health = await makeRequest('/health');
    console.log('Health response:', health);

    // Then test generate endpoint
    console.log('\n\nTesting script generation endpoint...');
    const testData = {
      testCaseId: "TC_001",
      testName: "User Login Test",
      testDescription: "Test user login functionality",
      testSteps: [
        {
          step: 1,
          action: "Navigate to login page",
          expectedResult: "Login page is displayed"
        },
        {
          step: 2,
          action: "Enter email and password",
          expectedResult: "Fields are populated"
        },
        {
          step: 3,
          action: "Click login button",
          expectedResult: "User is logged in"
        }
      ]
    };

    const response = await makeRequest('/api/v1/scripts/generate', 'POST', testData);
    console.log('Generation response:', JSON.stringify(response, null, 2));

    if (response.data.data && response.data.data.scriptPath) {
      console.log('\n✓ Script saved to:', response.data.data.scriptPath);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();
