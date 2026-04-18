#!/bin/bash

# UI Automation Setup Script

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   UI Automation Orchestration System - Setup Script      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✓ Node.js $(node --version) found"
echo ""

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✓ npm $(npm --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium

echo ""
echo "✓ Setup complete!"
echo ""
echo "Available commands:"
echo "  npm run automate -- \"<user-input>\" \"<url>\""
echo "  npm run test                          (Run all tests)"
echo "  npm run report                        (Show test report)"
echo ""
echo "Example:"
echo "  npm run automate -- \"Fill in login form\" \"https://example.com/login\""
