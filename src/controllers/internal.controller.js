const { encryptAesGcm } = require('../services/crypto.service');
const { createApiKey } = require('../services/apiKey.service');
const { SEC_DB } = process.env;

const encryptGlobalController = (req, res) => {
  try {
    const { value } = req.body;
    if (!value) return res.status(400).json({ error: 'Missing value' });

    const encrypted = encryptAesGcm(value, SEC_DB);
    res.json({ encrypted });
  } catch (err) {
    console.error('Encrypt-global error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const createApiKeyController = async (req, res) => {
  try {
    const { orgId, projectId } = req.body;
    if (!orgId || !projectId) return res.status(400).json({ error: 'orgId and projectId required' });

    const apiKey = await createApiKey(orgId, projectId);
    res.json({ apiKey });
  } catch (err) {
    console.error('Create API Key error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { encryptGlobalController, createApiKeyController };
