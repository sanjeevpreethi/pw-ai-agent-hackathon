# PW-AI-Agents Backend

Enterprise-grade backend service for intelligent test automation powered by AI agents.

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Build TypeScript
npm run build

# Start development server
npm run dev
```

### Directory Structure

```
backend/
├── src/
│   ├── agents/                 # AI agent services
│   │   ├── test-case-parser.ts
│   │   ├── script-generator.ts
│   │   └── script-validator.ts
│   ├── orchestration/          # Test execution orchestration
│   │   ├── test-runner.ts
│   │   ├── browser-manager.ts
│   │   └── retry-handler.ts
│   ├── api/                    # REST API layer
│   │   ├── routes/             # API route definitions
│   │   ├── controllers/        # Route controllers
│   │   └── middleware/         # Express middleware
│   ├── services/               # Business logic services
│   │   ├── test-case.service.ts
│   │   └── execution.service.ts
│   ├── database/               # Database configuration
│   ├── config/                 # Configuration management
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── validators.ts
│   │   └── retry.ts
│   └── index.ts               # Application entry point
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Key Features

### 1. AI-Powered Test Generation
- **Test Case Parsing**: Converts manual test specs, Jira tickets, Excel files to structured metadata
- **Script Generation**: Generates Playwright TypeScript scripts from test metadata
- **Script Validation**: Validates generated scripts for syntax, compliance, and best practices

### 2. Orchestration & Execution
- **Parallel Execution**: Execute 1000+ tests concurrently with worker pool management
- **Browser Pool**: Smart browser instance allocation and lifecycle management
- **Retry Logic**: Automatic retry with exponential backoff for transient failures

### 3. REST API
- **Test Generation API**: Upload, parse, and generate test scripts
- **Test Execution API**: Execute tests with various configurations
- **Monitoring & Metrics**: Real-time system health and performance metrics

### 4. Reliability & Observability
- **Structured Logging**: JSON-formatted logs for all operations
- **Error Classification**: Automatic categorization of errors (retriable vs permanent)
- **Circuit Breaker**: Protection against cascading failures
- **Health Checks**: Service health and dependency monitoring

## API Quick Reference

### Generate Test Script
```bash
curl -X POST http://localhost:3000/api/v1/scripts/generate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "testMetadata": {
      "id": "uuid",
      "name": "User Login Test",
      ...
    }
  }'
```

### Execute Tests
```bash
curl -X POST http://localhost:3000/api/v1/executions/run \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "testIds": ["TC_001", "TC_002"],
    "scriptPaths": ["./scripts/TC_001.ts", "./scripts/TC_002.ts"],
    "parallel": true,
    "maxWorkers": 4
  }'
```

### Health Check
```bash
curl http://localhost:3000/health
```

## Configuration

Edit `.env` file to configure:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://localhost:5432/pw_ai_agents

# Test Execution
TEST_RETRY_ATTEMPTS=3
MAX_PARALLEL_WORKERS=4
TEST_TIMEOUT_MS=60000

# Feature Flags
ENABLE_JIRA_INTEGRATION=false
ENABLE_AUTO_HEALING=false
ENABLE_TEST_DATA_GENERATOR=false
```

## Development

### Scripts

```bash
# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Production mode
npm run start

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Linting
npm run lint

# Format code
npm run format
```

### Type System

The project uses TypeScript with strict type checking:

```typescript
// Key type definitions available in src/types/index.ts
TestMetadata      // Complete test case metadata
Step              // Individual test step
Assertion         // Test assertion definition
TestResult        // Individual test execution result
ExecutionSummary  // Execution summary statistics
```

## Performance

### Optimization Tips

1. **Use batch operations** for multiple test generations
2. **Enable parallel execution** for independent tests
3. **Configure browser pool size** based on available resources
4. **Monitor metrics** to identify bottlenecks
5. **Use Redis caching** for frequently accessed data

### Benchmarks

- Script generation: ~2 seconds per test
- Test execution: 1-5 seconds (UI tests), <1 second (API tests)
- Batch processing: 100+ tests in parallel
- Success rate: 90%+ first-attempt success

## Error Handling

The backend implements comprehensive error handling:

### Error Categories

1. **Validation Errors** (400): Invalid request format
2. **Authentication Errors** (401): Missing/invalid token
3. **Not Found** (404): Resource doesn't exist
4. **Infrastructure Errors** (502-503): External service issues

### Automatic Retries

The system automatically retries failed tests based on error classification:

- **Retriable**: Network timeouts, stale elements, transient issues
- **Non-Retriable**: Assertion failures, missing elements, permanent errors

## Monitoring

### Health Endpoints

```
GET /health              # Basic health check
GET /status              # Detailed status with uptime
GET /api/v1/metrics      # System metrics (requires auth)
```

### Metrics Available

- Test execution rates
- Success/failure statistics
- Browser pool utilization
- Response times
- Error rates and types

## Database

Uses PostgreSQL for persistent storage:

```sql
-- Main tables
CREATE TABLE test_cases (
  id UUID PRIMARY KEY,
  project_id UUID,
  test_name VARCHAR(255),
  metadata JSONB,
  automation_status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE test_executions (
  id UUID PRIMARY KEY,
  test_id UUID,
  project_id UUID,
  results JSONB,
  summary JSONB,
  created_at TIMESTAMP
);
```

## Security

### Authentication
- JWT token-based security
- Token validation on protected endpoints
- Support for third-party OAuth providers

### Data Protection
- Sensitive credentials encrypted at rest
- TLS/SSL for all external communications
- Database connection pooling with timeout
- Input sanitization and validation

### Rate Limiting
Recommended limits:
- Script generation: 100/hour
- Test execution: 1000/hour
- General API: 10000/hour

## Troubleshooting

### Issue: "Database connection failed"
**Solution**: 
- Verify DATABASE_URL in .env
- Ensure PostgreSQL is running
- Check network connectivity

### Issue: "Script generation timeout"
**Solution**:
- Increase TEST_TIMEOUT_MS in .env
- Verify AI model endpoint is accessible
- Check network connectivity to external services

### Issue: "Browser pool exhausted"
**Solution**:
- Increase MAX_PARALLEL_WORKERS
- Monitor available system resources
- Reduce test parallelization

## Contributing

Please follow the coding guidelines:

1. Use strict TypeScript types
2. Add logging to important operations
3. Handle errors explicitly
4. Write descriptive commit messages
5. Create pull requests for review

## Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Detailed API reference
- [Architecture](../docs/ARCHITECTURE.md) - System architecture overview
- [Type Definitions](./src/types/index.ts) - Complete type system

## Support

For issues, questions, or suggestions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Contact the development team

## License

Copyright (c) 2026, PW-AI-Agents. All rights reserved.

---

**Last Updated**: April 11, 2026
**Version**: 1.0.0
