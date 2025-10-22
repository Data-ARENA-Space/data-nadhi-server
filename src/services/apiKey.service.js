const { encryptAesGcm, decryptAesGcm } = require('./crypto.service');
const { getProjectSecret, getOrganisationSecret } = require('./entities.service');
const { getApiKey, setApiKey } = require('../dal/cache.dal');
const context = require('../utils/context.util');

const { SEC_GLOBAL, NONCE_VALUE, API_KEY_CACHE_TTL_SECONDS } = process.env;

const createApiKey = async (orgId, projectId) => {
  const orgSecret = await getOrganisationSecret(orgId);
  const projectSecret = await getProjectSecret(orgId, projectId);

  const enc1 = encryptAesGcm(NONCE_VALUE, projectSecret);
  const enc2 = encryptAesGcm(`${enc1}|${projectId}`, orgSecret);
  const enc3 = encryptAesGcm(`${enc2}|${orgId}`, SEC_GLOBAL);

  return Buffer.from(enc3, 'utf8').toString('base64');
}

const validateApiKey = async (apiKey) => {
  // Check cache first
  const cached = await getApiKey(apiKey);
  if (cached) return cached;

  let enc3 = Buffer.from(apiKey, 'base64').toString('utf8');
  const layer2 = decryptAesGcm(enc3, SEC_GLOBAL);
  const [enc2, orgId] = layer2.split('|');

  context.set({organisationId: orgId})

  let orgSecret = await getOrganisationSecret(orgId);

  const layer1 = decryptAesGcm(enc2, orgSecret);
  const [enc1, projectId] = layer1.split('|');

  context.set({projectId})

  let projectSecret = await getProjectSecret(orgId, projectId);

  const nonce = decryptAesGcm(enc1, projectSecret);
  if (nonce !== NONCE_VALUE) throw new Error('Nonce mismatch');

  const result = { orgId, projectId };
  setApiKey(apiKey, result, API_KEY_CACHE_TTL_SECONDS);
  return result;
}

module.exports = { createApiKey, validateApiKey };
