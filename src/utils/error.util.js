// Lightweight error classes and helpers for non-Express contexts (re-exported in middleware)
class AppError extends Error {
  constructor(message, { status = 400, code = 'APP_ERROR', expected = true, context = {} } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.expected = expected;
    this.context = context;
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation error', options = {}) { super(message, { status: 400, code: 'VALIDATION_ERROR', expected: true, ...options }); }
}
class NotFoundError extends AppError {
  constructor(message = 'Not found', options = {}) { super(message, { status: 404, code: 'NOT_FOUND', expected: true, ...options }); }
}
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', options = {}) { super(message, { status: 401, code: 'UNAUTHORIZED', expected: true, ...options }); }
}
class ConflictError extends AppError {
  constructor(message = 'Conflict', options = {}) { super(message, { status: 409, code: 'CONFLICT', expected: true, ...options }); }
}
class ServiceError extends AppError {
  constructor(message = 'Service error', options = {}) { super(message, { status: 503, code: 'SERVICE_ERROR', expected: false, ...options }); }
}

module.exports = { AppError, ValidationError, NotFoundError, UnauthorizedError, ConflictError, ServiceError };
