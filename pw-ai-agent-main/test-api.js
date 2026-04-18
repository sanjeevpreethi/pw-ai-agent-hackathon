const http = require('http');

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

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/scripts/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
