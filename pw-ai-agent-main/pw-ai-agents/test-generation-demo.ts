#!/usr/bin/env node

/**
 * Test Generation Demo Script
 * 
 * Demonstrates how to use the MCP-based test generation system
 * Run with: npx tsx test-generation-demo.ts
 */

import { TestScriptGenerator, TestMetadata } from './test-generator';

// Example test metadata (same as what the cURL request would provide)
const TC_001_METADATA: TestMetadata = {
  id: 'TC_001',
  name: 'User Login',
  description: 'Test user login functionality',
  steps: [
    {
      stepNumber: 1,
      action: 'Navigate',
      target: 'https://example.com/login',
      value: '',
    },
    {
      stepNumber: 2,
      action: 'Fill',
      target: 'Email Input',
      value: 'user@example.com',
    },
    {
      stepNumber: 3,
      action: 'Fill',
      target: 'Password Input',
      value: 'password123',
    },
    {
      stepNumber: 4,
      action: 'Click',
      target: 'Login Button',
      value: '',
    },
  ],
  assertions: [
    {
      type: 'url',
      matcher: 'contains',
      expected: 'dashboard',
    },
    {
      type: 'text',
      matcher: 'contains',
      expected: 'Welcome',
    },
    {
      type: 'element',
      matcher: 'visible',
      expected: '[aria-label="Profile"]',
    },
  ],
};

const TC_002_METADATA: TestMetadata = {
  id: 'TC_002',
  name: 'User Registration',
  description: 'Fill and submit registration form',
  steps: [
    {
      stepNumber: 1,
      action: 'Navigate',
      target: 'https://example.com/register',
      value: '',
    },
    {
      stepNumber: 2,
      action: 'Fill',
      target: 'First Name Input',
      value: 'John',
    },
    {
      stepNumber: 3,
      action: 'Fill',
      target: 'Last Name Input',
      value: 'Doe',
    },
    {
      stepNumber: 4,
      action: 'Fill',
      target: 'Email Input',
      value: 'john@example.com',
    },
    {
      stepNumber: 5,
      action: 'Click',
      target: 'Submit Button',
      value: '',
    },
  ],
  assertions: [
    {
      type: 'url',
      matcher: 'contains',
      expected: 'confirmation',
    },
    {
      type: 'text',
      matcher: 'contains',
      expected: 'Registration Successful',
    },
  ],
};

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   MCP-Based Test Generation Demo                       ║');
  console.log('║   Generate Playwright Tests with Accessibility Focus   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const generator = new TestScriptGenerator();

  // Demonstrate different test scenarios
  const testCases: TestMetadata[] = [TC_001_METADATA, TC_002_METADATA];

  for (const testCase of testCases) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Generating test: ${testCase.id} - ${testCase.name}`);
      console.log(`${'='.repeat(60)}\n`);

      // Generate script using MCP
      const generated = await generator.generateScript(testCase);

      // Display generated code
      console.log('\n📄 Generated Test Code:\n');
      console.log('─'.repeat(60));
      console.log(generated.testCode);
      console.log('─'.repeat(60));

      // Display accessibility snapshot
      console.log('\n🌳 Accessibility Snapshot:\n');
      console.log('─'.repeat(60));
      console.log(generated.accessibilitySnapshot);
      console.log('─'.repeat(60));

      // Display execution log
      console.log('\n📊 Execution Log:\n');
      console.log('─'.repeat(60));
      for (const entry of generated.executionLog) {
        console.log(`  Step ${entry.step}: ${entry.action}`);
        console.log(`    Duration: ${entry.duration}ms`);
        console.log(`    Result: ${entry.result}`);
      }
      console.log('─'.repeat(60));

      // Display locator mappings
      console.log('\n🔍 Locator Mappings (Old → New):\n');
      console.log('─'.repeat(60));
      for (const locator of generated.locators) {
        console.log(`  Step ${locator.step}:`);
        console.log(`    Old: ${locator.oldLocator}`);
        console.log(`    New: ${locator.newLocator}`);
        console.log(`    Strategy: ${locator.strategy}`);
      }
      console.log('─'.repeat(60));

      // Save to file
      const filePath = await generator.saveScriptToFile(testCase.id);

      console.log(`\n✅ Test files saved successfully`);
      console.log(`   Main file: ${filePath}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Error generating test: ${errorMsg}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Demo Complete! Generated test files are ready.');
  console.log('Location: tests/ui/');
  console.log('='.repeat(60) + '\n');
}

// Run the demo
main().catch(console.error);
