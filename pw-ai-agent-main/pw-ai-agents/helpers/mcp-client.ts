import { spawn, ChildProcess } from "child_process";

export interface MCPToolCall {
  tool: string;
  params: Record<string, any>;
}

export interface MCPToolResult {
  success: boolean;
  result?: string;
  error?: string;
}

export class MCPClient {
  private process: ChildProcess | null = null;
  private buffer: string = "";
  private requestId: number = 0;
  private pendingRequests: Map<
    number,
    (result: any) => void
  > = new Map();

  async connect(mcpServerPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn("node", [mcpServerPath], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (!this.process.stdout || !this.process.stderr) {
        reject(new Error("Failed to create process"));
        return;
      }

      this.process.stdout.on("data", (data: Buffer) => {
        this.handleData(data);
      });

      this.process.stderr.on("data", (data: Buffer) => {
        console.error("MCP stderr:", data.toString());
      });

      this.process.on("error", (err) => {
        reject(err);
      });

      // Give the process time to start
      setTimeout(resolve, 1000);
    });
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString();

    // Process complete JSON objects from the buffer
    let startIndex = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      if (this.buffer[i] === "\n") {
        const line = this.buffer.substring(startIndex, i).trim();
        if (line) {
          try {
            const response = JSON.parse(line);
            const callback = this.pendingRequests.get(response.id);
            if (callback) {
              callback(response);
              this.pendingRequests.delete(response.id);
            }
          } catch (e) {
            // Not valid JSON, continue
          }
        }
        startIndex = i + 1;
      }
    }

    this.buffer = this.buffer.substring(startIndex);
  }

  async callTool(toolName: string, params: Record<string, any>): Promise<string> {
    if (!this.process || !this.process.stdin) {
      throw new Error("MCP not connected");
    }

    const id = ++this.requestId;
    const request = {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: params,
      },
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Tool call timeout for ${toolName}`));
      }, 30000);

      this.pendingRequests.set(id, (response: any) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      });

      this.process!.stdin!.write(JSON.stringify(request) + "\n");
    });
  }

  async navigateTo(url: string): Promise<void> {
    await this.callTool("browsernavigate", { url });
  }

  async captureSnapshot(): Promise<string> {
    return await this.callTool("browsersnapshot", {});
  }

  async click(selector: string): Promise<void> {
    await this.callTool("browserclick", { selector });
  }

  async type(selector: string, text: string, submit: boolean = false): Promise<void> {
    await this.callTool("browsertype", { selector, text, submit });
  }

  async selectOption(selector: string, value: string): Promise<void> {
    await this.callTool("browserselectoption", { selector, value });
  }

  async waitFor(selector?: string, timeout?: number): Promise<void> {
    await this.callTool("browserwaitfor", {
      ...(selector && { selector }),
      ...(timeout && { timeout }),
    });
  }

  async takeScreenshot(): Promise<string> {
    return await this.callTool("browsertakescreenshot", {});
  }

  async getConsoleLogs(): Promise<string> {
    return await this.callTool("browserconsolemessages", {});
  }

  async evaluate(script: string): Promise<any> {
    return await this.callTool("browserevaluate", { script });
  }

  async pressKey(key: string): Promise<void> {
    await this.callTool("browserpresskey", { key });
  }

  async uploadFile(selector: string, filePath: string): Promise<void> {
    await this.callTool("browserfileupload", { selector, filePath });
  }

  async handleDialog(accept: boolean, promptText?: string): Promise<void> {
    await this.callTool("browserhandledialog", { accept, promptText });
  }

  async initializePageForTesting(url?: string): Promise<void> {
    await this.callTool("plannersetuppage", { ...(url && { url }) });
  }

  async savePlan(plan: string, filePath?: string): Promise<void> {
    await this.callTool("plannersaveplan", {
      plan,
      ...(filePath && { filePath }),
    });
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
