// Test different regex patterns
const testSelectors = [
  "getByTestId('username')",
  "getByRole('button', { name: /login/i })",
  "getByLabel('Password')",
  "getByPlaceholder('Enter text')",
  "getByAriaLabel('Submit')",
  "input[name='USERNAME']",
  ".login-button",
  "#username-field",
];

console.log('Testing Different Regex Patterns:\n');

const patterns = [
  { pattern: /^(getBy|locator)\(/, name: "Original: /^(getBy|locator)\\(/" },
  { pattern: /^getBy\w*\(/, name: "Improved: /^getBy\\w*\\(/" },
  { pattern: /^(getBy|locator)/, name: "Simple: /^(getBy|locator)/" },
];

patterns.forEach(({ pattern, name }) => {
  console.log(`Pattern: ${name}`);
  testSelectors.forEach((selector) => {
    const matches = pattern.test(selector);
    console.log(`  "${selector}": ${matches}`);
  });
  console.log('');
});
