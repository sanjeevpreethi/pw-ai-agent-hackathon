# Browser Automation MCP Server

This is a Model Context Protocol (MCP) server that provides tools for browser automation using Playwright.

## Tools

- `browserclick`: Click an element
- `browsertype`: Type text into an input
- `browsernavigate`: Navigate to a URL
- `browserwaitfor`: Wait for element/condition
- `browsersnapshot`: Capture page info (title and URL)
- `browsertakescreenshot`: Take a visual screenshot
- `browserconsolemessages`: Read browser console logs
- `browsernetworkrequests`: Monitor network requests
- `browserselectoption`: Select dropdown option
- `browserhover`: Hover over an element
- `browserdrag`: Drag and drop
- `browserfileupload`: Upload a file
- `browserhandledialog`: Handle alert/confirm/prompt dialogs
- `browserpresskey`: Press a keyboard key
- `browserevaluate`: Execute JavaScript on the page
- `browserruncode`: Run arbitrary Playwright code
- `browserclose`: Close the browser
- `plannersetuppage`: Initialize page for testing
- `plannersaveplan`: Save the execution plan

## Installation

1. Install dependencies: `npm install`
2. Install Playwright browsers: `npx playwright install`
3. Build: `npm run build`

## Usage

The server uses stdio transport. Configure in VS Code's MCP settings using the mcp.json in .vscode.

## Development

- `npm run dev`: Run with tsx for development