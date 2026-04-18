// Test the regex directly
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

console.log('Testing Regex Pattern: /^(getBy|locator)\\(/\n');

testSelectors.forEach((selector) => {
  const regex = /^(getBy|locator)\(/;
  const matches = regex.test(selector);
  console.log(`"${selector}"`);
  console.log(`  Matches: ${matches}\n`);
});
