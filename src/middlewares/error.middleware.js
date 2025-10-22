const Logger = require('../utils/logger.util');
const { AppError } = require('../utils/error.util');

function formatErrorResponse(err) {
  if (err instanceof AppError) {
    return { status: err.status, body: { error: err.message, code: err.code } };
  }
  return { status: 500, body: { error: 'Internal server error', code: 'INTERNAL_ERROR' } };
}

function logError(err, logger) {
  const lg = logger || new Logger();
  const level = 'error';
  const context = {
    errorName: err.name,
    code: err.code || undefined,
    stack: err.stack,
    details: err.context || undefined,
    message: err.message,
  };
  lg[level](err.message, context);
}

function errorMiddleware(err, req, res, _next) {
  const logger = req.logger || new Logger({});
  logError(err, logger);
  const { status, body } = formatErrorResponse(err);
  res.status(status).json(body);
}

module.exports = {
  errorMiddleware,
  logError,
  formatErrorResponse,
};
