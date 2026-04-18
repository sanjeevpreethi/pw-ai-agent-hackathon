// Test script to verify the locator fix logic
const testCases = [
  { selector: "getByTestId('username')", expected: "page.getByTestId('username')" },
  { selector: "getByRole('button', { name: /Submit/i })", expected: "page.getByRole('button', { name: /Submit/i })" },
  { selector: "getByLabel('Password')", expected: "page.getByLabel('Password')" },
  { selector: "getByPlaceholder('Enter text')", expected: "page.getByPlaceholder('Enter text')" },
  { selector: "locator('.login-button')", expected: "page.locator('.login-button')" },
  { selector: "input[name='USERNAME']", expected: 'page.locator("input[name=\'USERNAME\']")' },
  { selector: ".login-button", expected: 'page.locator(".login-button")' },
  { selector: "#username-field", expected: 'page.locator("#username-field")' },
];

console.log('Testing Locator Discovery Fix\n');
console.log('=' .repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const { selector, expected } = testCase;
  
  // Simulate the logic from script-generator.ts
  const isPlaywrightApi = /^(getBy|locator)/.test(selector);
  let locatorAccessor;
  
  if (isPlaywrightApi) {
    locatorAccessor = `page.${selector}`;
  } else {
    const escapedSelector = selector.replace(/"/g, '\\"').replace(/`/g, '\\`');
    locatorAccessor = `page.locator("${escapedSelector}")`;
  }
  
  const success = locatorAccessor === expected;
  const status = success ? '✓ PASS' : '✗ FAIL';
  
  console.log(`\nTest ${index + 1}: ${status}`);
  console.log(`  Input:    ${selector}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Got:      ${locatorAccessor}`);
  
  if (success) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\nResults: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
console.log(passed === testCases.length ? '✓ All tests passed!' : '✗ Some tests failed');
