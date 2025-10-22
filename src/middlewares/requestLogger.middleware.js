const { randomUUID } = require('crypto');
const context = require('../utils/context.util');

const requestLogger = (req, _res, next) => {
  const traceId = req.headers['x-trace-id'] || randomUUID();
  req.traceId = traceId;

  context.enter({
    traceId,
    organisationId: req.orgId || null,
    projectId: req.projectId || null,
    pipelineId: null,
    logData: (req.body && req.body.log_data) ? req.body.log_data : null,
  });

  req.logger = context.getLogger();
  req.logger.debug('Incoming request', { method: req.method, path: req.path });

  next();
};

module.exports = requestLogger;
