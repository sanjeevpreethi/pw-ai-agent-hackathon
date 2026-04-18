import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server';
import { chromium, Browser, Page } from 'playwright';
import * as v from 'valibot';

class BrowserAutomationServer {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private consoleMessages: string[] = [];

  async initialize() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();

    // Listen to console messages
    this.page.on('console', msg => {
      this.consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
  }

  async cleanup() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }

  getServer(): McpServer {
    const server = new McpServer({
      name: 'browser-automation-server',
      version: '1.0.0',
    });

    // browserinitialize
    server.registerTool(
      'browserinitialize',
      {
        description: 'Initialize the browser and create a new page',
        inputSchema: v.object({}),
      },
      async () => {
        await this.initialize();
        return { content: [{ type: 'text', text: 'Browser initialized successfully' }] };
      }
    );

    // browserclick
    server.registerTool(
      'browserclick',
      {
        description: 'Click an element on the page',
        inputSchema: v.object({
          selector: v.string(),
        }),
      },
      async ({ selector }) => {
        if (!this.page) throw new Error('Page not initialized');
        await this.page.click(selector);
        return { content: [{ type: 'text', text: 'Clicked element' }] };
      }
    );

    // browsertype
    server.registerTool(
      'browsertype',
      {
        description: 'Type text into an input element',
        inputSchema: v.object({
          selector: v.string(),
          text: v.string(),
          submit: v.optional(v.boolean()),
        }),
      },
      async ({ selector, text, submit }) => {
        if (!this.page) throw new Error('Page not initialized');
        await this.page.fill(selector, text);
        if (submit) {
          await this.page.press(selector, 'Enter');
        }
        return { content: [{ type: 'text', text: 'Typed text into element' }] };
      }
    );

    // browsernavigate
    server.registerTool(
      'browsernavigate',
      {
        description: 'Navigate to a URL',
        inputSchema: v.object({
          url: v.string(),
        }),
      },
      async ({ url }) => {
        if (!this.page) throw new Error('Page not initialized');
        await this.page.goto(url);
        return { content: [{ type: 'text', text: 'Navigated to URL' }] };
      }
    );

    // browserwaitfor
    server.registerTool(
      'browserwaitfor',
      {
        description: 'Wait for an element or condition',
        inputSchema: v.object({
          selector: v.optional(v.string()),
          timeout: v.optional(v.number()),
        }),
      },
      async ({ selector, timeout = 10000 }) => {
        if (!this.page) throw new Error('Page not initialized');
        if (selector) {
          await this.page.waitForSelector(selector, { timeout });
        } else {
          await this.page.waitForTimeout(timeout);
        }
        return { content: [{ type: 'text', text: 'Wait completed' }] };
      }
    );

    // browsersnapshot
    server.registerTool(
      'browsersnapshot',
      {
        description: 'Capture accessibility snapshot of the page',
        inputSchema: v.object({}),
      },
      async () => {
        if (!this.page) throw new Error('Page not initialized');
        const title = await this.page.title();
        const url = this.page.url();
        return { content: [{ type: 'text', text: `Title: ${title}\nURL: ${url}` }] };
      }
    );

    // browsertakescreenshot
    server.registerTool(
      'browsertakescreenshot',
      {
        description: 'Take a screenshot of the page',
        inputSchema: v.object({
          fullPage: v.optional(v.boolean()),
        }),
      },
      async ({ fullPage = false }) => {
        if (!this.page) throw new Error('Page not initialized');
        const screenshot = await this.page.screenshot({ fullPage });
        return { content: [{ type: 'image', data: screenshot.toString('base64'), mimeType: 'image/png' }] };
      }
    );

    // browserconsolemessages
    server.registerTool(
      'browserconsolemessages',
      {
        description: 'Read browser console messages',
        inputSchema: v.object({}),
      },
      async () => {
        const messages = [...this.consoleMessages];
        this.consoleMessages = [];
        return { content: [{ type: 'text', text: messages.join('\n') }] };
      }
    );

    // browsernetworkrequests
    server.registerTool(
      'browsernetworkrequests',
      {
        description: 'Monitor network requests',
        inputSchema: v.object({}),
      },
      async () => {
        if (!this.page) throw new Error('Page not initialized');
        const requests: string[] = [];
        this.page.on('request', req => {
          requests.push(`${req.method()} ${req.url()}`);
        });
        // Wait a bit to collect requests
        await this.page.waitForTimeout(1000);
        return { content: [{ type: 'text', text: requests.join('\n') }] };
      }
    );

    // browserselectoption
    server.registerTool(
      'browserselectoption',
      {
        description: 'Select an option in a dropdown',
        inputSchema: v.object({
          selector: v.string(),
          value: v.string(),
        }),
      },
      async ({ selector, value }) => {
        if (!this.page) throw new Error('Page not initialized');
        await this.page.selectOption(selector, value);
        return { content: [{ type: 'text', text: 'Selected option' }] };
      }
    );

    // browserhover
    server.registerTool(
      'browserhover',
      {
        description: 'Hover over an element',
        inputSchema: v.object({
          selector: v.string(),
        }),
      },
      async ({ selector }) => {
        if (!this.page) throw new Error('Page not initialized');
        await this.page.hover(selector);
        return { content: [{ type: 'text', text: 'Hovered over element' }] };
      }
    );

    // browserdrag
    server.registerTool(
      'browserdrag',
      {
        description: 'Drag and drop between elements',
        inputSchema: v.object({
          sourceSelector: v.string(),
          targetSelector: v.string(),
        }),
      },
      async ({ sourceSelector, targetSelector }) => {
        if (!this.page) throw new Error('Page not initialized');
        await this.page.dragAndDrop(sourceSelector, targetSelector);
        return { content: [{ type: 'text', text: 'Dragged and dropped' }] };
      }
    );

    // browserfileupload
    server.registerTool(
      'browserfileupload',
      {
        description: 'Upload a file',
        inputSchema: v.object({
          selector: v.string(),
          filePath: v.string(),
        }),
      },
      async ({ selector, filePath }) => {
        if (!this.page) throw new Error('Page not initialized');
        await this.page.setInputFiles(selector, filePath);
        return { content: [{ type: 'text', text: 'Uploaded file' }] };
      }
    );

    // browserhandledialog
    server.registerTool(
      'browserhandledialog',
      {
        description: 'Handle alert/confirm/prompt dialogs',
        inputSchema: v.object({
          accept: v.boolean(),
          promptText: v.optional(v.string()),
        }),
      },
      async ({ accept, promptText }) => {
        if (!this.page) throw new Error('Page not initialized');
        this.page.on('dialog', async dialog => {
          if (dialog.type() === 'prompt' && promptText) {
            await dialog.accept(promptText);
          } else if (accept) {
            await dialog.accept();
          } else {
            await dialog.dismiss();
          }
        });
        return { content: [{ type: 'text', text: 'Dialog handler set' }] };
      }
    );

    // browserpresskey
    server.registerTool(
      'browserpresskey',
      {
        description: 'Press a keyboard key',
        inputSchema: v.object({
          key: v.string(),
        }),
      },
      async ({ key }) => {
        if (!this.page) throw new Error('Page not initialized');
        await this.page.keyboard.press(key);
        return { content: [{ type: 'text', text: 'Pressed key' }] };
      }
    );

    // browserevaluate
    server.registerTool(
      'browserevaluate',
      {
        description: 'Execute JavaScript on the page',
        inputSchema: v.object({
          script: v.string(),
        }),
      },
      async ({ script }) => {
        if (!this.page) throw new Error('Page not initialized');
        const result = await this.page.evaluate(script);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // browserruncode
    server.registerTool(
      'browserruncode',
      {
        description: 'Run arbitrary Playwright code',
        inputSchema: v.object({
          code: v.string(),
        }),
      },
      async ({ code }) => {
        if (!this.page) throw new Error('Page not initialized');
        // This is dangerous, but for demo
        const result = await eval(`(async (page) => { ${code} })(this.page)`);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );

    // browsergetaccessibilitytree
    server.registerTool(
      'browsergetaccessibilitytree',
      {
        description: 'Return the full accessibility tree of the current page as JSON, used for locator discovery',
        inputSchema: v.object({}),
      },
      async () => {
        if (!this.page) throw new Error('Page not initialized');
        const accessibility = (this.page as any).accessibility;
        const snapshot = accessibility?.snapshot ? await accessibility.snapshot() : null;
        const url = this.page.url();
        const title = await this.page.title();
        // Also collect all interactive elements with their attributes for selector generation
        const elements = await this.page.evaluate(() => {
          const interactive = Array.from(
            document.querySelectorAll('input, button, select, textarea, a[href], [role="button"], [role="textbox"], [role="combobox"], [role="link"]')
          );
          return interactive.map((el) => ({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            name: (el as HTMLInputElement).name || null,
            type: (el as HTMLInputElement).type || null,
            role: el.getAttribute('role') || null,
            ariaLabel: el.getAttribute('aria-label') || null,
            placeholder: (el as HTMLInputElement).placeholder || null,
            text: (el.textContent || '').trim().substring(0, 80),
            href: (el as HTMLAnchorElement).href || null,
          }));
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ url, title, snapshot, elements }, null, 2),
          }],
        };
      }
    );

    // browserclose
    server.registerTool(
      'browserclose',
      {
        description: 'Close the browser',
        inputSchema: v.object({}),
      },
      async () => {
        await this.cleanup();
        return { content: [{ type: 'text', text: 'Browser closed' }] };
      }
    );

    // plannersetuppage
    server.registerTool(
      'plannersetuppage',
      {
        description: 'Initialize page for testing',
        inputSchema: v.object({
          url: v.optional(v.string()),
        }),
      },
      async ({ url }) => {
        if (!this.page) await this.initialize();
        if (url) await this.page!.goto(url);
        return { content: [{ type: 'text', text: 'Page initialized' }] };
      }
    );

    // plannersaveplan
    server.registerTool(
      'plannersaveplan',
      {
        description: 'Save the execution plan',
        inputSchema: v.object({
          plan: v.string(),
          filePath: v.optional(v.string()),
        }),
      },
      async ({ plan, filePath = 'plan.json' }) => {
        // Save to file
        const fs = await import('fs');
        fs.writeFileSync(filePath, plan);
        return { content: [{ type: 'text', text: 'Plan saved' }] };
      }
    );

    return server;
  }
}

async function main() {
  const automation = new BrowserAutomationServer();
  await automation.initialize();

  const server = automation.getServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('Browser Automation MCP Server running');
}

main().catch(console.error);