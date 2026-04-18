/**
 * Backend Configuration Management
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface Config {
  server: {
    port: number;
    nodeEnv: string;
    apiBaseUrl: string;
  };
  database: {
    url: string;
    poolMin: number;
    poolMax: number;
  };
  redis: {
    url: string;
    db: number;
  };
  ai: {
    endpoint: string;
    key: string;
    modelName: string;
  };
  grok: {
    enabled: boolean;
    apiKey: string;
    model: string;
    endpoint: string;
    maxTokens: number;
    temperature: number;
    useForEnhancement: boolean;
  };
  mcp: {
    serverUrl: string;
    authToken: string;
  };
  jira: {
    url: string;
    apiToken: string;
    username: string;
    enabled: boolean;
  };
  test: {
    timeout: number;
    retryAttempts: number;
    maxParallelWorkers: number;
    browserTimeout: number;
  };
  logging: {
    level: string;
    format: string;
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
  };
  storage: {
    artifactPath: string;
    scriptOutputPath: string;
  };
  features: {
    jiraIntegration: boolean;
    autoHealing: boolean;
    testDataGenerator: boolean;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/pw_ai_agents',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  ai: {
    endpoint: process.env.AI_MODEL_ENDPOINT || 'https://api.openai.com/v1',
    key: process.env.AI_MODEL_KEY || '',
    modelName: process.env.AI_MODEL_NAME || 'gpt-4',
  },
  grok: {
    enabled: process.env.GROK_ENABLED === 'true',
    apiKey: process.env.GROK_API_KEY || '',
    model: process.env.GROK_MODEL || 'grok-2',
    endpoint: process.env.GROK_ENDPOINT || 'https://api.x.ai/v1',
    maxTokens: parseInt(process.env.GROK_MAX_TOKENS || '2000', 10),
    temperature: parseFloat(process.env.GROK_TEMPERATURE || '0.7'),
    useForEnhancement: process.env.GROK_USE_FOR_ENHANCEMENT === 'true',
  },
  mcp: {
    serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:8080',
    authToken: process.env.MCP_AUTH_TOKEN || '',
  },
  jira: {
    url: process.env.JIRA_URL || '',
    apiToken: process.env.JIRA_API_TOKEN || '',
    username: process.env.JIRA_USERNAME || '',
    enabled: process.env.ENABLE_JIRA_INTEGRATION === 'true',
  },
  test: {
    timeout: parseInt(process.env.TEST_TIMEOUT_MS || '60000', 10),
    retryAttempts: parseInt(process.env.TEST_RETRY_ATTEMPTS || '3', 10),
    maxParallelWorkers: parseInt(process.env.MAX_PARALLEL_WORKERS || '4', 10),
    browserTimeout: parseInt(process.env.BROWSER_TIMEOUT_MS || '30000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key-32-chars-min',
  },
  storage: {
    artifactPath: process.env.ARTIFACT_STORAGE_PATH || './artifacts',
    scriptOutputPath: process.env.TEST_SCRIPT_OUTPUT_PATH || './scripts',
  },
  features: {
    jiraIntegration: process.env.ENABLE_JIRA_INTEGRATION === 'true',
    autoHealing: process.env.ENABLE_AUTO_HEALING === 'true',
    testDataGenerator: process.env.ENABLE_TEST_DATA_GENERATOR === 'true',
  },
};

export default config;
