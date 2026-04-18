/**
 * Core type definitions for PW-AI-Agents backend
 * Based on ARCHITECTURE.md data models and contracts
 */

// ============================================================================
// Test Case & Metadata Types
// ============================================================================

export type ActionType = 'navigate' | 'click' | 'fill' | 'select' | 'wait' | 'execute' | 'hover' | 'doubleClick' | 'rightClick' | 'screenshot';
export type MatcherType = 'equals' | 'contains' | 'exists' | 'visible' | 'enabled' | 'hasText' | 'hasAttribute';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type Browser = 'chrome' | 'firefox' | 'safari' | 'edge';
export type LocatorStrategy = 'xpath' | 'css' | 'role' | 'text' | 'label';
export type TestStatus = 'passed' | 'failed' | 'skipped' | 'pending' | 'error';
export type AutomationStatus = 'not-started' | 'in-progress' | 'automated' | 'failed' | 'manual-review';

/**
 * Test Case Step Definition
 */
export interface Step {
  id: string;
  description: string;
  action: ActionType;
  target?: string; // Selector or element reference
  value?: string;
  timeout?: number;
  retryable?: boolean;
}

/**
 * Test Assertion Definition
 */
export interface Assertion {
  id: string;
  description: string;
  actual: string; // Selector to evaluate
  matcher: MatcherType;
  expected: string;
}

/**
 * Locator Mapping for UI Elements
 */
export interface LocatorMap {
  [elementName: string]: string; // Element name -> selector
}

/**
 * Test Data Structure
 */
export interface TestData {
  [key: string]: unknown;
}

/**
 * Complete Test Metadata
 */
export interface TestMetadata {
  id: string;
  name: string;
  description?: string;
  steps: Step[];
  assertions: Assertion[];
  testData: TestData;
  locators: LocatorMap;
  tags: string[];
  priority: PriorityLevel;
  browsers: Browser[];
  dependencies?: string[]; // Other test IDs that must run first
  preconditions?: string;
  postconditions?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Raw Test Case Input (from manual docs, Jira, Excel)
 */
export interface RawTestCase {
  testCaseId: string;
  testName: string;
  description?: string;
  preconditions?: string;
  steps: Array<{
    stepNum: number;
    action: string;
    testData?: string | Record<string, unknown>;
    target?: string;
  }>;
  expectedResults: string[];
  testData: TestData;
  locatorHints?: LocatorMap;
  browsers?: Browser[];
  priority?: PriorityLevel;
  tags?: string[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Test Case Upload Request
 */
export interface TestCaseUploadRequest {
  testCases: RawTestCase[];
  format: 'manual' | 'jira' | 'excel';
  projectId?: string;
}

/**
 * Script Generation Request
 */
export interface ScriptGenerationRequest {
  testMetadata: TestMetadata;
  outputFormat?: 'typescript' | 'javascript';
  framework?: 'playwright' | 'cypress' | 'selenium';
}

/**
 * Script Generation Response
 */
export interface ScriptGenerationResponse {
  testId: string;
  generatedScript: string;
  scriptPath: string;
  validationStatus: 'valid' | 'invalid' | 'warning';
  llm: {
    enabled: boolean;
    used: boolean;
  };
  errors?: ValidationError[];
  warnings?: string[];
  timestamp: Date;
}

/**
 * Test Execution Request
 */
export interface TestExecutionRequest {
  testIds: string[];
  scriptPaths: string[];
  browsers?: Browser[];
  parallel?: boolean;
  maxWorkers?: number;
  headless?: boolean;
}

/**
 * Test Execution Response
 */
export interface TestExecutionResponse {
  executionId: string;
  tests: TestResult[];
  summary: ExecutionSummary;
  reportPath: string;
  timestamp: Date;
}

/**
 * Individual Test Result
 */
export interface TestResult {
  testId: string;
  testName: string;
  status: TestStatus;
  duration: number; // milliseconds
  browser: Browser;
  error?: {
    message: string;
    stack?: string;
  };
  artifacts: {
    screenshot?: string;
    trace?: string;
    video?: string;
  };
  retryCount: number;
  timestamp: Date;
}

/**
 * Execution Summary
 */
export interface ExecutionSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  errors: number;
  duration: number; // seconds
  successRate: number; // percentage
  timestamp: Date;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation Error
 */
export interface ValidationError {
  code: string;
  message: string;
  location?: {
    line?: number;
    column?: number;
  };
  suggestion?: string;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  report: {
    syntaxValid: boolean;
    lintValid: boolean;
    helperReferencesValid: boolean;
    playwrightAPIValid: boolean;
  };
}

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Parser Agent Result
 */
export interface ParserResult {
  success: boolean;
  testMetadata?: TestMetadata;
  errors?: string[];
  executionTime: number;
}

/**
 * Generator Agent Result
 */
export interface GeneratorResult {
  success: boolean;
  generatedScript?: string;
  errors?: string[];
  executionTime: number;
  retryCount?: number;
  llmEnabled?: boolean;
  llmUsed?: boolean;
}

/**
 * Validator Agent Result
 */
export interface ValidatorResult {
  isValid: boolean;
  validationResult: ValidationResult;
  executionTime: number;
}

// ============================================================================
// Orchestration Types
// ============================================================================

/**
 * Test Runner Configuration
 */
export interface TestRunnerConfig {
  parallelWorkers: number;
  retryAttempts: number;
  timeout: number;
  headless: boolean;
  browsers: Browser[];
  artifactPath: string;
  reportFormat: 'html' | 'json' | 'junit';
}

/**
 * Browser Pool State
 */
export interface BrowserPoolState {
  maxInstances: number;
  allocatedInstances: number;
  waitingQueue: string[]; // Test IDs
  availableBrowsers: number;
}

/**
 * Execution Queue Item
 */
export interface ExecutionQueueItem {
  testId: string;
  scriptPath: string;
  priority: PriorityLevel;
  browser: Browser;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

// ============================================================================
// Database Types
// ============================================================================

/**
 * Stored Test Case Entity
 */
export interface StoredTestCase {
  id: string;
  projectId: string;
  testName: string;
  description?: string;
  metadata: TestMetadata;
  scriptPath?: string;
  automationStatus: AutomationStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Stored Test Execution
 */
export interface StoredExecution {
  id: string;
  testId: string;
  projectId: string;
  results: TestResult[];
  summary: ExecutionSummary;
  reportPath: string;
  createdAt: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: Date;
}

/**
 * Pagination Info
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

/**
 * Health Check Status
 */
export interface HealthCheckStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    database: boolean;
    cache: boolean;
    ai_model: boolean;
    playwright_mcp: boolean;
  };
  metrics?: {
    uptime: number;
    requestCount: number;
    errorCount: number;
  };
}

/**
 * Error Details
 */
export interface ErrorDetails {
  code: string;
  message: string;
  statusCode: number;
  timestamp: Date;
  requestId?: string;
  details?: unknown;
}
