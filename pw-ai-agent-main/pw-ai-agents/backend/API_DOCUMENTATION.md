# PW-AI-Agents Backend API Documentation

## Overview

The PW-AI-Agents backend is a comprehensive test automation platform backend that manages test case parsing, script generation, validation, and execution orchestration.

## Architecture

### Core Components

1. **AI Agents Layer** (`src/agents/`)
   - `test-case-parser.ts` - Converts raw test cases to structured metadata
   - `script-generator.ts` - Generates Playwright TypeScript scripts
   - `script-validator.ts` - Validates generated scripts for syntax and compliance

2. **Orchestration Layer** (`src/orchestration/`)
   - `test-runner.ts` - Orchestrates parallel/sequential test execution
   - `browser-manager.ts` - Manages browser instance pool and allocation
   - `retry-handler.ts` - Implements retry logic with exponential backoff

3. **API Layer** (`src/api/`)
   - **Routes** - RESTful endpoint definitions
   - **Controllers** - Business logic handling
   - **Middleware** - Request/response processing, authentication, logging

4. **Services Layer** (`src/services/`)
   - `test-case.service.ts` - Test case storage and retrieval
   - `execution.service.ts` - Execution result tracking

5. **Utilities** (`src/utils/`)
   - `logger.ts` - Structured logging
   - `errors.ts` - Custom error classes
   - `validators.ts` - Data validation using Zod
   - `retry.ts` - Retry and circuit breaker patterns

## API Endpoints

### Test Generation Endpoints

#### Upload Test Cases
```
POST /api/v1/test-cases/upload
Content-Type: application/json
Authorization: Bearer {token}

{
  "testCases": [
    {
      "testCaseId": "TC_001",
      "testName": "User Login",
      "steps": [...],
      "expectedResults": [...]
    }
  ],
  "format": "manual|jira|excel",
  "projectId": "proj_12345"
}

Response:
200 OK
{
  "success": true,
  "data": {
    "uploadId": "uuid",
    "parsedTestCases": [...],
    "summary": {
      "total": 1,
      "successful": 1,
      "failed": 0
    }
  }
}
```

#### Generate Single Script
```
POST /api/v1/scripts/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "testMetadata": {
    "id": "uuid",
    "name": "Test Name",
    "steps": [...],
    "assertions": [...],
    ...
  }
}

Response:
200 OK
{
  "success": true,
  "data": {
    "testId": "uuid",
    "generatedScript": "import { test } from '@playwright/test'...",
    "scriptPath": "./scripts/uuid.ts",
    "validationStatus": "valid",
    "errors": [],
    "warnings": []
  }
}
```

#### Generate Multiple Scripts (Batch)
```
POST /api/v1/scripts/generate-batch
Content-Type: application/json
Authorization: Bearer {token}

{
  "testMetadataList": [
    { "id": "uuid1", "name": "Test 1", ... },
    { "id": "uuid2", "name": "Test 2", ... }
  ]
}

Response:
200 OK
{
  "success": true,
  "data": {
    "batchId": "uuid",
    "scripts": [
      {
        "testId": "uuid1",
        "success": true,
        "script": "...",
        "validationStatus": "valid"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  }
}
```

### Test Execution Endpoints

#### Execute Tests
```
POST /api/v1/executions/run
Content-Type: application/json
Authorization: Bearer {token}

{
  "testIds": ["TC_001", "TC_002"],
  "scriptPaths": ["./scripts/TC_001.ts", "./scripts/TC_002.ts"],
  "browsers": ["chrome", "firefox"],
  "parallel": true,
  "maxWorkers": 4,
  "headless": true
}

Response:
200 OK
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "tests": [
      {
        "testId": "TC_001",
        "testName": "User Login",
        "status": "passed",
        "duration": 2345,
        "browser": "chrome",
        "retryCount": 0,
        "artifacts": {
          "screenshot": "./artifacts/screenshot.png"
        }
      }
    ],
    "summary": {
      "totalTests": 2,
      "passed": 2,
      "failed": 0,
      "successRate": 100,
      "duration": 15
    },
    "reportPath": "./reports/execution-uuid.html"
  }
}
```

#### Get Execution Status
```
GET /api/v1/executions/{executionId}
Authorization: Bearer {token}

Response:
200 OK
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "status": "completed",
    "metrics": {}
  }
}
```

#### Get Test Results
```
GET /api/v1/executions/{executionId}/results?page=1&pageSize=10
Authorization: Bearer {token}

Response:
200 OK
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "results": [...],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### Cancel Execution
```
POST /api/v1/executions/{executionId}/cancel
Authorization: Bearer {token}

Response:
200 OK
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "status": "cancelled"
  }
}
```

### Health & Monitoring Endpoints

#### Health Check
```
GET /health

Response:
200 OK
{
  "status": 'healthy',
  "timestamp": "2026-04-11T10:30:45Z"
}
```

#### Server Status
```
GET /status

Response:
200 OK
{
  "service": "pw-ai-agents-backend",
  "version": "1.0.0",
  "environment": "development",
  "uptime": 3456,
  "database": {
    "isConnected": true,
    "lastConnected": "2026-04-11T10:30:45Z"
  }
}
```

#### System Metrics
```
GET /api/v1/metrics
Authorization: Bearer {token}

Response:
200 OK
{
  "testRunner": {
    "queueLength": 5,
    "runningTests": 3,
    "completedTests": 42
  },
  "browserPool": {
    "totalInstances": 4,
    "activeInstances": 3,
    "idleInstances": 1,
    "utilizationRate": 75
  }
}
```

## Configuration

### Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/pw_ai_agents
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_DB=0

# AI Model
AI_MODEL_ENDPOINT=https://api.openai.com/v1
AI_MODEL_KEY=sk-...
AI_MODEL_NAME=gpt-4

# Playwright MCP
MCP_SERVER_URL=http://localhost:8080
MCP_AUTH_TOKEN=token

# Test Configuration
TEST_TIMEOUT_MS=60000
TEST_RETRY_ATTEMPTS=3
MAX_PARALLEL_WORKERS=4
BROWSER_TIMEOUT_MS=30000

# Feature Flags
ENABLE_JIRA_INTEGRATION=false
ENABLE_AUTO_HEALING=false
ENABLE_TEST_DATA_GENERATOR=false
```

## Installation & Setup

### Prerequisites
- Node.js v18+
- TypeScript 5.1+
- npm or yarn

### Installation

```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server
npm run dev

# Start production server
npm run start
```

## Error Handling

### Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `202 Accepted` - Request accepted for processing
- `204 No Content` - Request successful, no content
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - External service error
- `503 Service Unavailable` - Service temporarily unavailable

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {...},
    "timestamp": "2026-04-11T10:30:45Z",
    "requestId": "uuid"
  }
}
```

## Database

The backend uses PostgreSQL for persistent storage:

### Main Tables

- `test_cases` - Stored test case metadata
- `test_executions` - Execution results and artifacts
- `test_results` - Individual test result rows
- `projects` - Project management

## Performance Considerations

### Optimization Tips

1. **Parallel Execution**: Use `parallel: true` for independent tests
2. **Browser Pool**: Configure `MAX_PARALLEL_WORKERS` based on available resources
3. **Retry Strategy**: Automatic retry for transient failures (network, stale elements)
4. **Caching**: Redis caching for frequently accessed data
5. **Artifact Management**: Automatic cleanup of old artifacts

### Scalability

- Supports 1000+ concurrent test executions
- Distributed across multiple worker processes
- Horizontal scaling with multiple backend instances
- Load balancing recommended

## Monitoring & Logging

### Structured Logging

All operations are logged with structured JSON format:

```json
{
  "level": "info",
  "timestamp": "2026-04-11T10:30:45Z",
  "component": "TestRunner",
  "operation": "executeTest",
  "testId": "TC_001",
  "duration": 2345,
  "status": "success"
}
```

### Metrics Collection

Real-time metrics available at `/api/v1/metrics`:
- Test execution rate
- Success/failure rates
- Browser pool utilization
- Response times
- Error rates

## Security

### Authentication

- JWT token-based authentication
- Tokens required for all API endpoints except `/health` and `/status`
- Token validation on every request

### Data Protection

- Sensitive test credentials encrypted at rest
- TLS/SSL for all external communications
- Database connection pooling with timeout
- Input validation on all endpoints

### Rate Limiting

Recommended rate limits:
- Script generation: 100 per hour
- Test execution: 1000 per hour
- API calls: 10,000 per hour

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify DATABASE_URL is correct
- Check database is running
- Verify network connectivity

**Script Generation Timeout**
- Increase TEST_TIMEOUT_MS
- Check AI model endpoint
- Verify network connectivity to AI service

**Browser Allocation Failed**
- Check MAX_PARALLEL_WORKERS setting
- Monitor system resources
- Increase browser timeout if needed

## Contributing

See `CONTRIBUTING.md` for development guidelines and best practices.

## License

Copyright (c) 2026, PW-AI-Agents. All rights reserved.
