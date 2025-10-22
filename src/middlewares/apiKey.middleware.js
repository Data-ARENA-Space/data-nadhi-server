const { validateApiKey } = require('../services/apiKey.service');
const context = require('../utils/context.util');
const { UnauthorizedError } = require('../utils/error.util');

const apiKeyMiddleware = async (req, _res, next) => {
  const apiKey = req.headers['x-datanadhi-api-key'];
  if (!apiKey) return next(new UnauthorizedError('API key required'));
  try {
    const { orgId, projectId } = await validateApiKey(apiKey);
    req.orgId = orgId;
    req.projectId = projectId;

    // context.set({ organisationId: orgId, projectId });
    req.logger = context.getLogger();
    req.logger.debug('API key validated');

    next();
  } catch (err) {
    next(new UnauthorizedError(err.message));
  }
}

module.exports = apiKeyMiddleware;
