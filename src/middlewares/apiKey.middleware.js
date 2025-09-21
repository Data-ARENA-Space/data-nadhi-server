const { validateApiKey } = require('../services/apiKey.service');

const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(400).json({ error: 'API key required' });

    const { orgId, projectId } = await validateApiKey(apiKey);
    req.orgId = orgId;
    req.projectId = projectId;
    next();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

module.exports = apiKeyMiddleware;
