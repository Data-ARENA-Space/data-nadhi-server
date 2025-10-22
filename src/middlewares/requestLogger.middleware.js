const context = require('../utils/context.util');

const requestLogger = (req, _res, next) => {
  const initial = {};
  if (req.orgId != null) initial.organisationId = req.orgId;
  if (req.projectId != null) initial.projectId = req.projectId;
  if (req.body && req.body.log_data != null) initial.logData = req.body.log_data;
  context.enter(initial);

  req.logger = context.getLogger();
  req.logger.debug('Incoming request', { method: req.method, path: req.path });

  next();
};

module.exports = requestLogger;
