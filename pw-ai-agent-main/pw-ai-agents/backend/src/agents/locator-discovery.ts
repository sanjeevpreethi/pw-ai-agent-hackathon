/**
 * Locator Discovery Service â€“ MCP-backed
 *
 * Instead of launching Playwright directly, this service communicates with
 * the custom browser-automation MCP server (MCP/dist/index.js) over stdio
 * using JSON-RPC 2.0.  The MCP server provides `browsergetaccessibilitytree`
 * which returns every interactive element's id/name/role/aria-label so we can
 * pick the best Playwright selector without owning a browser process here.
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import logger from '../utils/logger';

export interface LocatorDiscoveryRequest {
  url: string;
  elementDescription: string;
  action: string;
}

export interface DiscoveredLocator {
  selector: string;
  method: string;
  confidence: number;
}

interface MCPElement {
  tag: string;
  id: string | null;
  name: string | null;
  type: string | null;
  role: string | null;
  ariaLabel: string | null;
  placeholder: string | null;
  text: string;
  href: string | null;
}

interface MCPAccessibilityResponse {
  url: string;
  title: string;
  elements: MCPElement[];
}

// â”€â”€â”€ Minimal stdio MCP client â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class StdioMCPClient {
  private proc: ChildProcess | null = null;
  private buffer = '';
  private reqId = 0;
  private pending = new Map<number, (r: any) => void>();

  async connect(serverPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.proc = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });

      this.proc.stdout!.on('data', (chunk: Buffer) => {
        this.buffer += chunk.toString();
        let nl: number;
        while ((nl = this.buffer.indexOf('\n')) !== -1) {
          const line = this.buffer.slice(0, nl).trim();
          this.buffer = this.buffer.slice(nl + 1);
          if (!line) continue;
          try {
            const msg = JSON.parse(line);
            const cb = this.pending.get(msg.id);
            if (cb) { this.pending.delete(msg.id); cb(msg); }
          } catch { /* ignore non-JSON lines */ }
        }
      });

      this.proc.stderr!.on('data', (d: Buffer) =>
        logger.debug('MCP server stderr', { msg: d.toString().trim() })
      );
      this.proc.on('error', reject);

      // MCP servers print to stderr when ready; give 2 s for startup
      setTimeout(resolve, 2000);
    });
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<string> {
    if (!this.proc?.stdin) throw new Error('MCP client not connected');
    const id = ++this.reqId;
    const req = {
      jsonrpc: '2.0', id,
      method: 'tools/call',
      params: { name, arguments: args },
    };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP tool "${name}" timed out`));
      }, 20000);

      this.pending.set(id, (resp: any) => {
        clearTimeout(timer);
        if (resp.error) return reject(new Error(resp.error.message));
        // MCP result shape: { content: [{ type, text }] }
        const text = resp.result?.content?.[0]?.text ?? JSON.stringify(resp.result);
        if (resp.result?.isError) {
          return reject(new Error(text || `MCP tool "${name}" returned an error`));
        }
        resolve(text);
      });

      this.proc!.stdin!.write(JSON.stringify(req) + '\n');
    });
  }

  async disconnect(): Promise<void> {
    try { await this.callTool('browserclose'); } catch { /* best-effort */ }
    this.proc?.kill();
    this.proc = null;
  }
}

// â”€â”€â”€ Locator discovery using MCP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class LocatorDiscoveryService {
  // Path to the built MCP server
  private readonly mcpServerPath = path.resolve(
    __dirname,
    '../../../../../MCP/dist/index.js'
  );

  /**
   * Discover the best Playwright selector for an element by:
   *  1. Spinning up the MCP server
   *  2. Navigating to the target URL
   *  3. Calling browsergetaccessibilitytree
   *  4. Ranking elements by how well they match the description
   */
  async discoverLocator(request: LocatorDiscoveryRequest): Promise<DiscoveredLocator> {
    const client = new StdioMCPClient();
    try {
      logger.info('MCP locator discovery: connecting to MCP server', {
        serverPath: this.mcpServerPath,
      });
      await client.connect(this.mcpServerPath);

      // Browser must be initialized on this MCP server before any page actions.
      await client.callTool('browserinitialize');

      // Navigate the MCP browser to the target URL
      await client.callTool('browsernavigate', { url: request.url });

      // Get full accessibility + element tree
      const rawJson = await client.callTool('browsergetaccessibilitytree');
      let data: MCPAccessibilityResponse;
      try {
        data = JSON.parse(rawJson) as MCPAccessibilityResponse;
      } catch {
        throw new Error(`Unexpected accessibility response: ${rawJson.slice(0, 200)}`);
      }

      logger.info('MCP locator discovery: received element tree', {
        url: data.url,
        elementCount: data.elements?.length ?? 0,
      });

      const best = this.selectBestElement(data.elements ?? [], request);
      return best;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn('MCP locator discovery failed, using fallback', { error: msg });
      return this.fallback(request.elementDescription);
    } finally {
      await client.disconnect().catch(() => { /* ignore */ });
    }
  }

  /** Score each element against the description and return the best match. */
  private selectBestElement(
    elements: MCPElement[],
    request: LocatorDiscoveryRequest
  ): DiscoveredLocator {
    const desc = request.elementDescription.toLowerCase();
    const words = desc.split(/\s+/);

    let bestScore = 0;
    let bestEl: MCPElement | null = null;

    for (const el of elements) {
      const score = this.score(el, words, request.action);
      if (score > bestScore) { bestScore = score; bestEl = el; }
    }

    if (!bestEl || bestScore < 0.3) return this.fallback(request.elementDescription);
    return this.buildSelector(bestEl, bestScore);
  }

  private score(el: MCPElement, words: string[], action: string): number {
    const candidates = [
      el.ariaLabel, el.placeholder, el.text, el.name, el.id,
    ]
      .filter(Boolean)
      .map((s) => s!.toLowerCase());

    let hits = 0;
    for (const w of words) {
      if (candidates.some((c) => c.includes(w))) hits++;
    }
    let score = hits / words.length;

    // Bonus: tag/role matches action type
    if (action === 'fill' || action === 'type') {
      if (['input', 'textarea'].includes(el.tag)) score += 0.1;
    }
    if (action === 'click') {
      if (['button', 'a'].includes(el.tag) || el.role === 'button') score += 0.1;
    }
    if (action === 'select') {
      if (el.tag === 'select') score += 0.2;
    }
    return Math.min(score, 1);
  }

  private buildSelector(el: MCPElement, confidence: number): DiscoveredLocator {
    // Priority: aria-label > unique id > name attribute
    if (el.ariaLabel) {
      return {
        selector: `getByRole('${this.roleFor(el)}', { name: /${el.ariaLabel}/i })`,
        method: 'mcp-aria-label',
        confidence,
      };
    }
    if (el.id) {
      return { selector: `locator('#${el.id}')`, method: 'mcp-id', confidence };
    }
    if (el.name) {
      return {
        selector: `locator('[name="${el.name}"]')`,
        method: 'mcp-name',
        confidence: confidence * 0.9,
      };
    }
    if (el.text && el.tag === 'button') {
      return {
        selector: `getByRole('button', { name: /${el.text}/i })`,
        method: 'mcp-button-text',
        confidence: confidence * 0.85,
      };
    }
    return this.fallback(el.text || el.tag);
  }

  private roleFor(el: MCPElement): string {
    if (el.role) return el.role;
    switch (el.tag) {
      case 'button': return 'button';
      case 'input': return el.type === 'checkbox' ? 'checkbox' : 'textbox';
      case 'select': return 'combobox';
      case 'textarea': return 'textbox';
      case 'a': return 'link';
      default: return 'generic';
    }
  }

  private fallback(description: string): DiscoveredLocator {
    const testId = description.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return { selector: `getByTestId('${testId}')`, method: 'mcp-fallback', confidence: 0.3 };
  }

  /** Called by script-generator after each step to release the MCP browser. */
  async cleanup(): Promise<void> {
    // No persistent state â€“ each discoverLocator call owns its own client
  }
}

export default new LocatorDiscoveryService();

