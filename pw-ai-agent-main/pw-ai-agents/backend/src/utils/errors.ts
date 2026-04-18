/**
 * Custom Error Classes and Handlers
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super('EXTERNAL_SERVICE_ERROR', `${service} error: ${message}`, 502);
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

export class TestGenerationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('TEST_GENERATION_ERROR', message, 500, details);
    Object.setPrototypeOf(this, TestGenerationError.prototype);
  }
}

export class TestValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('TEST_VALIDATION_ERROR', message, 400, details);
    Object.setPrototypeOf(this, TestValidationError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super('DATABASE_ERROR', message, 500);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class CircuitOpenError extends AppError {
  constructor(service: string) {
    super('CIRCUIT_OPEN', `${service} circuit breaker is open`, 503);
    Object.setPrototypeOf(this, CircuitOpenError.prototype);
  }
}
